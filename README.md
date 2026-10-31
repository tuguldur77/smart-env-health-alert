# Smart Environment & Health Alert

A web app that combines Seoul air quality and weather data with a user's health profile to show personalized risk alerts. It includes an interactive map of Seoul districts and charts of recent trends. The backend was built to run on AWS serverless services.

> The original AWS deployment is no longer running, so the project needs to be run locally or redeployed.

## Features

- Air quality by Seoul district (PM10, PM2.5, O3) and weather data from public APIs
- Personalized alerts based on a risk score and the user's health profile
- JWT-based sign-up and login
- Scheduled data collection and hourly aggregation

## Tech stack

- **Frontend:** HTML, CSS, JavaScript, Leaflet.js, Chart.js
- **Backend:** Node.js 20, Express, MongoDB, Mongoose
- **Cloud:** AWS Lambda, API Gateway, S3, CloudFront, EventBridge, Serverless Framework

## Run locally

```bash
npm install
cp server/.env.example server/.env
npm start
```

Fill in `server/.env` first. The server runs on port 3000. To use the frontend with your own backend, update `API_BASE` in `public/js/app.js`.

To deploy with the Serverless Framework, set the same four variables in your shell environment. See [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) for details.

---

# **스마트 환경·건강 알림 시스템 - 기술 문서**

## **1. 프로젝트 개요**

### **1.1 프로젝트 제목**
스마트 환경·건강 알림 (Smart Environment & Health Alert System)

### **1.2 프로젝트 설명**
사용자의 건강 프로필을 기반으로 실시간 대기질과 날씨 알림을 제공하는 환경 건강 모니터링 시스템입니다. 한국 정부 API를 통합하여 위치 기반 환경 데이터를 제공하고 위험도를 평가합니다.

### **1.3 핵심 기능**
- **실시간 대기질 모니터링**: 서울 구별 PM10, PM2.5, O3 수치
- **날씨 통합**: 기온, 습도, 풍속, 강수량 데이터
- **개인 맞춤 건강 알림**: 사용자 건강 프로필을 활용한 위험 기반 알림
- **인터랙티브 지도**: 서울 구별 대기질 시각화
- **사용자 인증**: JWT 기반 보안 로그인 시스템
- **건강 프로필 관리**: 포괄적인 사용자 건강 데이터 수집
- **역사 데이터 분석**: 12시간 추이 시각화
- **자동화 데이터 수집**: 데이터 집계를 위한 예약된 크론 작업

---

## **2. 시스템 아키텍처**

### **2.1 기술 스택**

#### **프론트엔드**
- **HTML5/CSS3**: 현대적인 디자인의 반응형 웹 인터페이스
- **Vanilla JavaScript (ES6+)**: 클라이언트 측 로직 및 API 통합
- **Leaflet.js**: 인터랙티브 지도 시각화
- **Chart.js**: 역사 데이터 추이 차트
- **Axios**: API 통신용 HTTP 클라이언트

#### **백엔드**
- **Node.js 20.x**: 서버 측 런타임
- **Express.js**: RESTful API 프레임워크
- **MongoDB**: 사용자 및 환경 데이터용 NoSQL 데이터베이스
- **Mongoose**: MongoDB 스키마 관리를 위한 ODM

#### **클라우드 인프라**
- **AWS Lambda**: API 엔드포인트를 위한 서버리스 컴퓨팅
- **API Gateway**: CORS가 활성화된 RESTful API 관리
- **CloudFront**: 정적 콘텐츠 전송용 CDN
- **S3**: 정적 웹사이트 호스팅
- **EventBridge**: 예약된 크론 작업 실행

#### **외부 API**
- **서울 오픈 API**: 대기질 데이터 (PM10, PM2.5, O3)
- **기상청**: 날씨 데이터
- **XML2JS**: API 응답용 XML에서 JSON 변환

### **2.2 아키텍처 다이어그램**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   프론트엔드    │    │   API 게이트웨이 │    │   AWS Lambda    │
│   (S3 + CF)     │◄──►│   (REST API)    │◄──►│   (Express.js)  │
│                 │    │                 │    │                 │
│ - HTML/CSS/JS   │    │ - CORS 활성화   │    │ - 라우트        │
│ - Leaflet 지도  │    │ - JWT 인증      │    │ - 컨트롤러     │
│ - Chart.js      │    │                 │    │ - 서비스       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌─────────────────┐         │
│ 외부 API        │    │   MongoDB       │◄────────┘
│                 │    │   Atlas         │
│ - 서울 대기 API │    │                 │
│ - 기상청 날씨   │    │ - 사용자        │
│ - XML/JSON      │    │ - 건강프로필    │
└─────────────────┘    │ - 원시 데이터   │
                       │ - 시간별 데이터 │
                       └─────────────────┘
```

---

## **3. 데이터베이스 설계**

### **3.1 MongoDB 컬렉션**

#### **사용자 컬렉션**
```javascript
{
  _id: ObjectId,
  email: String (고유, 필수),
  password: String (해시화, 필수),
  name: String (필수),
  createdAt: Date,
  updatedAt: Date
}
```

#### **건강프로필 컬렉션**
```javascript
{
  userId: ObjectId (참조: User),
  // 기본 정보
  ageGroup: String (열거형: 0-6,7-12,13-18,19-64,65+),
  gender: String (열거형: male,female,other),

  // 건강 상태
  chronicConditions: [String] (천식,copd,알레르기,심장,당뇨,기타,없음),
  respiratorySensitivity: String (매우민감함,민감함,보통,낮음),

  // 생활 패턴
  activityTime: String (아침,오후,저녁,불규칙),
  outdoorActivityHours: String (<1,1-3,3-5,5+),
  workEnvironment: String (실내,혼합,실외),

  // 환경 민감도
  pmSensitivity: String (매우민감함,민감함,보통,낮음),
  weatherSensitivity: String (매우민감함,민감함,보통,낮음),
  disasterSensitivity: String (매우민감함,민감함,보통,낮음),

  // 행동 패턴
  maskUsage: String (항상,대체로,가끔,전혀),
  airPurifierUsage: String (항상,종종,거의없음,없음),

  // 알림 설정
  alertSituations: [String] (pm10_bad,pm25_bad,ozone_high,heat_wave,cold_wave,...),
  alertTimePreference: String (언제든지,아침,외출전,야간제외),

  // 응급 연락처
  emergencyContact: {
    enabled: Boolean,
    name: String,
    phone: String
  },

  // 계산된 필드
  riskLevel: String (낮음,중간,높음,매우높음),
  environmentSensitivityScore: Number,
  heatSensitivityScore: Number,
  respiratoryRiskScore: Number,
  recommendedAlertThresholds: Object,

  createdAt: Date,
  updatedAt: Date
}
```

#### **원시환경데이터 컬렉션**
```javascript
{
  _id: ObjectId,
  district: String,
  dataTime: Date,
  pm10: Number,
  pm25: Number,
  o3: Number,
  no2: Number,
  co: Number,
  so2: Number,
  temperature: Number,
  humidity: Number,
  windSpeed: Number,
  windDirection: Number,
  precipitation: Number,
  createdAt: Date
}
```

#### **시간별환경데이터 컬렉션**
```javascript
{
  _id: ObjectId,
  district: String,
  hour: Date,
  avgPm10: Number,
  avgPm25: Number,
  avgO3: Number,
  maxPm10: Number,
  maxPm25: Number,
  minPm10: Number,
  minPm25: Number,
  dataPoints: Number,
  createdAt: Date
}
```

---

## **4. API 설계**

### **4.1 RESTful 엔드포인트**

#### **인증 라우트** (`/api/auth`)
- `POST /api/auth/signup` - 사용자 등록
- `POST /api/auth/login` - 사용자 인증

#### **날씨 라우트** (`/api/weather`)
- `GET /api/weather?lat={lat}&lon={lon}` - 현재 날씨 데이터

#### **대기질 라우트** (`/api/air`)
- `GET /api/air?lat={lat}&lon={lon}` - 현재 대기질 데이터

#### **알림 라우트** (`/api/alert`)
- `GET /api/alert?lat={lat}&lon={lon}` - 일반 환경 알림
- `GET /api/alert/personal?lat={lat}&lon={lon}` - 개인 맞춤 건강 알림 (JWT 필요)

#### **프로필 라우트** (`/api/profile`)
- `POST /api/profile` - 건강 프로필 생성/업데이트 (JWT 필요)
- `GET /api/profile` - 사용자 건강 프로필 조회 (JWT 필요)

#### **역사 라우트** (`/api/history`)
- `GET /api/history/raw?hours=12` - 차트용 원시 환경 데이터
- `GET /api/history/hourly?district={district}&days=7` - 집계된 시간별 데이터

### **4.2 응답 형식**

#### **날씨 API 응답**
```json
{
  "temperature": 22.5,
  "feelsLike": 24.1,
  "humidity": 65,
  "windSpeed": 2.3,
  "windDirection": 180,
  "precipitation": 0,
  "precipitationProbability": 10
}
```

#### **대기질 API 응답**
```json
{
  "city": "서울시",
  "district": "강남구",
  "pm10": 45,
  "pm25": 22,
  "o3": 0.035,
  "grade": "보통",
  "dataTime": "2025-11-26 14:00"
}
```

#### **알림 API 응답**
```json
{
  "city": "서울시",
  "district": "강남구",
  "temperature": 22.5,
  "feelsLike": 24.1,
  "pm10": 45,
  "pm25": 22,
  "grade": "보통",
  "alert": "서울시 강남구의 미세먼지 수준이 보통입니다. 건강에 유의하세요.",
  "severity": "medium",
  "personalAlert": "천식에 위험할 수 있는 미세먼지 수준입니다. 실내 활동을 권장합니다.",
  "riskLevel": "high"
}
```

---

## **5. 핵심 서비스 구현**

### **5.1 대기질 서비스** (`airService.js`)
- **getAirData()**: 서울 오픈 API에서 실시간 대기질 데이터 가져오기
- **getNearestDistrict()**: 좌표를 기반으로 가장 가까운 서울 구 계산
- **calcAirGrade()**: PM 수치를 한국 대기질 등급으로 변환

### **5.2 날씨 서비스** (`weatherService.js`)
- **getWeatherData()**: 기상청 API에서 날씨 데이터 검색
- **XML 파싱**: XML 응답을 JSON 형식으로 변환
- **데이터 정규화**: 날씨 매개변수 표준화

### **5.3 알림 서비스** (`alertService.js`)
- **getAlertMessage()**: 일반 환경 알림 생성
- **getPersonalAlertMessage()**: 건강 프로필을 사용한 개인 맞춤 알림 생성
- **위험도 평가**: 심각도 계산을 위한 위험 서비스와 통합

### **5.4 위험도 평가 서비스** (`riskService.js`)
- **evaluateRiskLevel()**: 사용자 위험 점수 계산 (0-20 척도)
- **고려 요소**:
  - 연령대 (어린이/노인 = 더 높은 위험)
  - 만성 질환 (천식, COPD, 심장병)
  - 민감도 수준 (PM, 날씨, 호흡기)
  - 생활 요인 (실외 활동, 작업 환경)
  - 보호 행동 (마스크 사용, 공기청정기)
- **위험 수준**: 낮음 (<5), 중간 (5-9), 높음 (10-14), 매우높음 (15+)

---

## **6. 프론트엔드 구현**

### **6.1 주요 컴포넌트**

#### **대시보드 레이아웃**
- **대기질 카드**: 실시간 PM10/PM2.5/O3 수치
- **날씨 카드**: 기온, 습도, 풍속, 강수량
- **알림 카드**: 개인 맞춤 건강 알림
- **위치 카드**: GPS 좌표 및 수동 입력
- **지도 시각화**: Leaflet 기반 서울 구 지도
- **역사 차트**: 12시간 추이 분석

#### **인증 시스템**
- **로그인/회원가입 폼**: JWT 기반 인증
- **프로필 관리**: 6개 카테고리의 건강 설문조사
- **사용자 대시보드**: 개인 맞춤 환경 모니터링

#### **인터랙티브 기능**
- **지리적 위치**: 폴백이 있는 브라우저 GPS 통합
- **수동 좌표**: 직접 위도/경도 입력
- **실시간 업데이트**: 자동 데이터 새로고침
- **반응형 디자인**: 모바일 친화적 인터페이스

### **6.2 JavaScript 아키텍처**

#### **핵심 함수**
- **fetchAll()**: 모든 API 호출 오케스트레이션 (날씨, 대기, 알림)
- **updateWeather()**: 날씨 데이터 표시
- **updateAir()**: 대기질 정보 표시
- **updateAlert()**: 개인 맞춤 알림 렌더링
- **loadSeoulDistrictsMap()**: Leaflet 지도 초기화
- **updateChart()**: 역사 추이 차트 생성

#### **인증 흐름**
- **토큰 관리**: LocalStorage 기반 JWT 저장
- **자동 로그인**: 브라우저 새로고침 시 지속 세션
- **프로필 통합**: 건강 데이터가 알림 개인화에 영향

---

## **7. 데이터 처리 파이프라인**

### **7.1 자동화 데이터 수집**
- **원시 데이터 가져오기**: EventBridge를 통해 10분마다
- **시간별 집계**: 매시간 0분에
- **데이터 소스**: 서울 오픈 API + 기상청 날씨 API

### **7.2 데이터 집계 로직**
```javascript
// 시간별 집계 예시
{
  district: "강남구",
  hour: "2025-11-26T14:00:00Z",
  avgPm10: 42.3,
  avgPm25: 21.7,
  maxPm10: 58,
  maxPm25: 32,
  dataPoints: 6
}
```

### **7.3 크론 작업 구현**
- **fetchRaw.js**: 원시 환경 데이터 수집
- **aggregateHourly.js**: 시간별 평균 및 극값 처리
- **오류 처리**: 정상적인 실패 복구
- **로깅**: 모니터링을 위한 CloudWatch 통합

---

## **8. 보안 구현**

### **8.1 인증 및 권한 부여**
- **JWT 토큰**: 7일 만료로 상태 비저장 인증
- **비밀번호 해싱**: 보안 비밀번호 저장을 위한 bcryptjs
- **CORS 구성**: Lambda 호환성을 위한 수동 헤더
- **입력 검증**: 서버 측 데이터 정리

### **8.2 API 보안**
- **속도 제한**: AWS API Gateway 조절
- **요청 검증**: 매개변수 정리
- **오류 처리**: 데이터 유출 없는 보안 오류 응답

---

## **9. 배포 및 DevOps**

### **9.1 AWS 인프라**
- **Lambda 함수**: 3개의 서버리스 함수 (API, fetchRaw, aggregateHourly)
- **API Gateway**: CORS가 활성화된 REST API
- **CloudFront**: 사용자 정의 도메인을 가진 CDN
- **S3 버킷**: 정적 웹사이트 호스팅
- **MongoDB Atlas**: 연결 풀링이 있는 클라우드 데이터베이스

### **9.2 CI/CD 파이프라인**
- **Serverless Framework**: 코드로서의 인프라
- **환경 변수**: 보안 구성 관리
- **자동화 배포**: `serverless deploy --force`
- **캐시 관리**: 업데이트를 위한 CloudFront 무효화

### **9.3 모니터링 및 로깅**
- **CloudWatch**: Lambda 실행 로그
- **오류 추적**: 포괄적인 오류 처리
- **성능 모니터링**: API 응답 시간
- **데이터 검증**: 자동화 건강 체크

---

## **10. 성능 최적화**

### **10.1 프론트엔드 최적화**
- **지연 로딩**: 외부 라이브러리 비동기 로드
- **DOM 캐싱**: 재사용을 위한 요소 참조 저장
- **효율적인 업데이트**: 대상화된 DOM 조작
- **반응형 이미지**: 모바일 장치용 최적화

### **10.2 백엔드 최적화**
- **연결 풀링**: MongoDB 연결 재사용
- **API 캐싱**: 정적 자산용 CloudFront CDN
- **Lambda 콜드 스타트**: 최적화된 패키지 크기
- **데이터베이스 인덱싱**: 효율적인 쿼리 성능

### **10.3 데이터 처리**
- **배치 작업**: 대량 데이터 삽입
- **메모리 관리**: 대규모 데이터셋용 스트림 처리
- **오류 복구**: 자동 재시도 메커니즘

---

## **11. 테스트 및 품질 보증**

### **11.1 수동 테스트 시나리오**
- **사용자 등록/로그인**: 인증 흐름 검증
- **프로필 생성**: 건강 설문조사 데이터 제출
- **알림 생성**: 개인화 알림 정확성
- **지도 상호작용**: 구 선택 및 데이터 표시
- **차트 렌더링**: 역사 데이터 시각화
- **모바일 반응성**: 크로스 디바이스 호환성

### **11.2 API 테스트**
- **엔드포인트 검증**: 모든 라우트가 올바른 응답 반환
- **오류 처리**: 적절한 오류 코드 및 메시지
- **데이터 무결성**: MongoDB 문서 검증
- **성능**: 2초 미만 응답 시간

---

## **12. 미래 개선사항**

### **12.1 계획된 기능**
- **푸시 알림**: 중요 경고를 위한 브라우저 푸시 알림
- **고급 분석**: 머신러닝 기반 위험 예측
- **다국어 지원**: 영어/한국어 인터페이스 옵션
- **오프라인 모드**: 오프라인 액세스를 위한 캐시된 데이터
- **소셜 기능**: 커뮤니티 건강 추이 공유

### **12.2 기술 개선사항**
- **GraphQL API**: 더 효율적인 데이터 가져오기
- **마이크로서비스**: 확장성을 위한 서비스 분해
- **실시간 업데이트**: WebSocket 통합
- **고급 캐싱**: 향상된 성능을 위한 Redis

---

## **13. 결론**

이 구현은 다음과 같이 통합하는 포괄적인 환경 건강 모니터링 시스템을 보여줍니다:

- **실시간 데이터 처리**: 자동화 수집을 통한 한국 정부 API
- **개인 맞춤 건강 알림**: 상세한 사용자 프로필을 사용한 위험 기반 알림
- **현대적 웹 아키텍처**: 반응형 프론트엔드와 서버리스 백엔드
- **확장 가능 인프라**: 모니터링이 포함된 AWS 클라우드 네이티브 배포
- **사용자 중심 디자인**: 포괄적인 건강 프로필링으로 직관적인 인터페이스

시스템은 데이터 프라이버시와 시스템 신뢰성을 유지하면서 귀중한 환경 건강 통찰을 제공합니다. 모듈식 아키텍처는 쉬운 유지보수와 미래 기능 추가를 허용합니다.

---

## **최근 업데이트 (2025년 11월 26일)**

### **Node.js 런타임 업그레이드**
- **Node.js 18.x → 20.x**: AWS Lambda 런타임 지원 종료 대응
- **보안 강화**: 최신 LTS 버전으로 보안 패치 및 업데이트 적용
- **환경 변수 관리**: serverless-dotenv-plugin 도입으로 환경 설정 개선
- **배포 자동화**: AWS Serverless Framework를 통한 원활한 배포

---

**프로젝트 저장소**: https://github.com/tuguldur77/smart-env-health-alert
**API 문서**: 인라인 코드 주석 및 JSDoc 스타일 문서
**기술 스택**: Node.js, Express, MongoDB, AWS Lambda, Leaflet.js, Chart.js

*날짜: 2025년 11월 26일*
*버전: 1.0.0*
*상태: 프로덕션 배포 완료*

---

## **설치 및 실행 가이드**

### **사전 요구사항**
- Node.js 20.x 이상
- MongoDB Atlas 계정
- AWS 계정 (Lambda, API Gateway, S3, CloudFront)
- 서울 오픈 API 키
- 기상청 API 키

### **로컬 개발 환경 설정**

1. **저장소 클론**
```bash
git clone https://github.com/tuguldur77/Cloud_Web_Project.git
cd Cloud_Web_Project
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
```bash
# .env 파일 생성
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
SEOUL_API_KEY=your_seoul_api_key
KMA_API_KEY=your_kma_api_key
```

4. **로컬 개발 서버 실행**
```bash
npm run dev
```

5. **크론 작업 테스트**
```bash
npm run cron:fetch
npm run cron:aggregate
```

### **AWS 배포**

1. **Serverless Framework 설치**
```bash
npm install -g serverless
```

2. **AWS 자격 증명 설정**
```bash
aws configure
```

3. **환경 변수 파일 생성** (`.env`)
```bash
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
SEOUL_API_KEY=your_seoul_api_key
KMA_API_KEY=your_kma_api_key
```

4. **배포 실행**
```bash
serverless deploy --force
```

### **프로젝트 구조**

```
Cloud_Web_Project/
├── src/
│   ├── lambda/
│   │   └── handler.js          # Lambda 진입점
│   ├── server.lambda.js        # Express 서버 (Lambda용)
│   ├── server.js               # 로컬 개발 서버
│   ├── routes/                 # API 라우트
│   │   ├── auth.js
│   │   ├── weather.js
│   │   ├── air.js
│   │   ├── alert.js
│   │   ├── profile.js
│   │   └── history.js
│   ├── controllers/            # 비즈니스 로직
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   └── historyController.js
│   ├── services/               # 핵심 서비스
│   │   ├── authService.js
│   │   ├── weatherService.js
│   │   ├── airService.js
│   │   ├── alertService.js
│   │   └── riskService.js
│   ├── models/                 # 데이터베이스 모델
│   │   ├── User.js
│   │   ├── HealthProfile.js
│   │   ├── RawEnvironmentData.js
│   │   └── HourlyEnvironmentData.js
│   ├── middleware/             # 미들웨어
│   │   └── auth.js
│   └── cron/                   # 예약 작업
│       ├── fetchRaw.js
│       └── aggregateHourly.js
├── public/                     # 정적 파일
│   ├── index.html
│   ├── js/
│   │   └── app.js
│   └── css/
│       └── style.css
├── serverless.yml              # AWS 배포 설정
├── package.json
└── README.md                   # 이 파일
```

---

## **주요 특징 및 기능**

### **실시간 환경 모니터링**
- 서울시 25개 구별 대기질 데이터 실시간 수집
- 기상청 날씨 데이터 통합
- 10분 간격 자동 데이터 업데이트

### **개인 맞춤 건강 알림**
- 6개 카테고리 건강 프로필링 (기본정보, 건강상태, 생활패턴, 환경민감도, 행동패턴, 알림설정)
- 위험도 평가 알고리즘 (0-20점 척도)
- 개인화된 알림 메시지 생성

### **인터랙티브 사용자 인터페이스**
- 반응형 웹 디자인 (모바일 지원)
- Leaflet.js 기반 서울 구 지도
- Chart.js 기반 역사 데이터 시각화
- 실시간 GPS 위치 감지

### **보안 및 신뢰성**
- JWT 기반 인증 시스템
- bcryptjs 비밀번호 해싱
- AWS API Gateway 속도 제한
- CloudWatch 모니터링 및 로깅

---

## **문제 해결**

### **일반적인 문제**

1. **API 키 오류**
   - 서울 오픈 API와 기상청 API 키가 올바르게 설정되었는지 확인
   - `.env` 파일의 환경 변수 확인

2. **MongoDB 연결 오류**
   - MongoDB Atlas 연결 문자열 확인
   - IP 화이트리스트 설정 확인

3. **Lambda 배포 실패**
   - AWS 자격 증명 확인
   - `serverless.yml` 설정 검토

4. **프론트엔드 표시 문제**
   - CloudFront 캐시 무효화
   - 브라우저 캐시 클리어
