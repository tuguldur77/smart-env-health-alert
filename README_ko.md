# 스마트 환경·건강 알림 (On-Premise)
## 실행 방법
1) PowerShell:
   cd Smart-EnviroHealth-Alert-main
   node server/index.js
2) 브라우저: http://localhost:3000
3) 위치 권한이 거부되면, 오른쪽에서 위도/경도 입력 후 **수동 좌표 사용** 클릭

## 기능
- 한국어 UI (공기질/날씨/위치)
- 수동 좌표 입력 및 데이터 새로고침
- On-premise 로컬 실행

## 참고
- 포트: 3000 (충돌 시 다른 프로세스 종료 후 재실행)
- 파일 인코딩: UTF-8

## 환경 변수 (.env)
- 위치: `server/.env` (또는 루트 `.env`)
- 필수 값: `SEOUL_API_KEY` (서울 열린데이터광장 공기질 API 인증키)
- 예시:

```dotenv
SEOUL_API_KEY=여기에_서울_API_키_입력
# (선택) 한국기상청 API 키를 사용할 경우
KMA_API_KEY=여기에_KMA_API_키_입력
```
