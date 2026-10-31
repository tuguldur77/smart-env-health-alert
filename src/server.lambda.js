import express from 'express';
// import cors from 'cors';
import dotenv from 'dotenv';

import weatherRoutes from './routes/weather.js';
import airRoutes     from './routes/air.js';
import alertRoutes   from './routes/alert.js';
import authRoutes    from './routes/auth.js';
import historyRoutes from './routes/history.js';
import profileRoutes from './routes/profile.js';

dotenv.config();

// Create Express app (no listen(), no static, no filesystem)
const app = express();
// app.use(cors()); // Remove conflicting cors middleware
app.use(express.json());

// Manual CORS headers for Lambda
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API routes only (NO static serving)
app.use('/api/weather', weatherRoutes);
app.use('/api/air', airRoutes);
app.use('/api/alert', alertRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (req, res) => {
  res.json({ message: "Lambda API root is working!" });
});

export default app;