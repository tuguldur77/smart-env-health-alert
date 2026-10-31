# AWS Deployment Guide

## 1. Database Setup (MongoDB Atlas)

### Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create account and cluster (free tier available)
3. Create database user and whitelist IP (0.0.0.0/0 for Lambda)
4. Get connection string: `mongodb+srv://<username>:<password>@cluster.mongodb.net/smartenv`

### Update Environment Variables
Add to your `.env` or AWS Lambda environment:
```
MONGODB_URI=mongodb+srv://your-user:your-password@cluster.mongodb.net/smartenv
```

## 2. AWS Lambda Deployment

### Install Serverless Framework
```bash
npm install -g serverless
```

### Create serverless.yml
```yaml
service: smart-env-health-alert

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    MONGODB_URI: ${env:MONGODB_URI}
    JWT_SECRET: ${env:JWT_SECRET}
    SEOUL_API_KEY: ${env:SEOUL_API_KEY}
    KMA_API_KEY: ${env:KMA_API_KEY}
  iamRoleStatements:
    - Effect: Allow
      Action:
        - logs:CreateLogGroup
        - logs:CreateLogStream
        - logs:PutLogEvents
      Resource: "*"

functions:
  api:
    handler: src/lambda/handler.handler
    events:
      - http:
          path: /
          method: ANY
          cors: true
      - http:
          path: /{proxy+}
          method: ANY
          cors: true

package:
  include:
    - src/**

plugins:
  - serverless-offline
```

### Deploy to AWS
```bash
serverless deploy
```

## 3. CloudWatch Events for Cron Jobs

### Update serverless.yml
```yaml
functions:
  # ... existing api function

  fetchRawData:
    handler: src/cron/fetchRaw.handler
    events:
      - schedule: rate(10 minutes)

  aggregateHourlyData:
    handler: src/cron/aggregateHourly.handler
    events:
      - schedule: cron(0 * * * ? *)  # Every hour
```

### Create Lambda Handlers for Cron
Create `src/cron/fetchRaw.js`:
```javascript
import { fetchRawData } from './fetchRaw.js';

export const handler = async (event) => {
  try {
    await fetchRawData();
    return { statusCode: 200, body: 'Raw data fetched' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Error fetching raw data' };
  }
};
```

Similarly for `aggregateHourly.js`.

## 4. Front-end Graphs

### Install Chart.js
```bash
npm install chart.js
```

### Update index.html
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<canvas id="historyChart" width="400" height="200"></canvas>
```

### Update app.js
```javascript
// Add chart initialization
const ctx = document.getElementById('historyChart').getContext('2d');
const historyChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'PM10',
      data: [],
      borderColor: 'red'
    }, {
      label: 'PM2.5',
      data: [],
      borderColor: 'blue'
    }]
  }
});

// Function to update chart
async function updateChart() {
  try {
    const response = await fetch('/api/history/raw?hours=12');
    const data = await response.json();
    
    const labels = data.map(d => new Date(d.timestamp).toLocaleTimeString());
    const pm10Data = data.map(d => d.pm10);
    const pm25Data = data.map(d => d.pm25);
    
    historyChart.data.labels = labels;
    historyChart.data.datasets[0].data = pm10Data;
    historyChart.data.datasets[1].data = pm25Data;
    historyChart.update();
  } catch (error) {
    console.error('Error updating chart:', error);
  }
}

// Call updateChart when page loads or on button click
updateChart();
```

## 5. User Login/Signup UI

### Update index.html
```html
<!-- Add login/signup forms -->
<div id="authSection" style="display: none;">
  <h2>로그인</h2>
  <input id="loginEmail" type="email" placeholder="이메일" />
  <input id="loginPassword" type="password" placeholder="비밀번호" />
  <button id="loginBtn">로그인</button>
  <button id="showSignupBtn">회원가입</button>
</div>

<div id="signupSection" style="display: none;">
  <h2>회원가입</h2>
  <input id="signupEmail" type="email" placeholder="이메일" />
  <input id="signupName" type="text" placeholder="이름" />
  <input id="signupPassword" type="password" placeholder="비밀번호" />
  <button id="signupBtn">회원가입</button>
  <button id="showLoginBtn">로그인으로 돌아가기</button>
</div>

<div id="userSection" style="display: none;">
  <p>환영합니다, <span id="userName"></span>!</p>
  <button id="logoutBtn">로그아웃</button>
</div>
```

### Update app.js
```javascript
// Auth state
let token = localStorage.getItem('token');
let user = null;

// DOM elements
const authSection = document.getElementById('authSection');
const signupSection = document.getElementById('signupSection');
const userSection = document.getElementById('userSection');

// Show appropriate section
function updateAuthUI() {
  if (token && user) {
    authSection.style.display = 'none';
    signupSection.style.display = 'none';
    userSection.style.display = 'block';
    document.getElementById('userName').textContent = user.name;
  } else {
    authSection.style.display = 'block';
    signupSection.style.display = 'none';
    userSection.style.display = 'none';
  }
}

// Login
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (response.ok) {
      token = data.token;
      user = data.user;
      localStorage.setItem('token', token);
      updateAuthUI();
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert('Login failed');
  }
});

// Signup
document.getElementById('signupBtn').addEventListener('click', async () => {
  const email = document.getElementById('signupEmail').value;
  const name = document.getElementById('signupName').value;
  const password = document.getElementById('signupPassword').value;
  
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    const data = await response.json();
    if (response.ok) {
      alert('Signup successful! Please login.');
      document.getElementById('showLoginBtn').click();
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert('Signup failed');
  }
});

// Toggle forms
document.getElementById('showSignupBtn').addEventListener('click', () => {
  authSection.style.display = 'none';
  signupSection.style.display = 'block';
});

document.getElementById('showLoginBtn').addEventListener('click', () => {
  signupSection.style.display = 'none';
  authSection.style.display = 'block';
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  token = null;
  user = null;
  localStorage.removeItem('token');
  updateAuthUI();
});

// Initialize
updateAuthUI();
```

### Update API calls to include auth
```javascript
// Example for authenticated requests
const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

const response = await fetch('/api/alerts/personal', { headers });
```

This provides a complete AWS deployment and front-end enhancement guide. Follow the steps in order for full cloud deployment.