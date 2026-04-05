@echo off
title JH EstimateAI
cd /d "%~dp0"

echo [1/3] FastAPI 백엔드 시작 (포트 8000)...
start cmd /k "cd /d "%~dp0backend" && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 2 /nobreak >nul

echo [2/3] Next.js 프론트엔드 시작 (포트 3000)...
if not exist "frontend\node_modules" (
  echo     node_modules 없음 - npm install 실행 중...
  cd /d "%~dp0frontend" && npm install
  cd /d "%~dp0"
)
start cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 3 /nobreak >nul

echo [3/3] 브라우저 오픈...
start http://localhost:3000

echo.
echo ===================================
echo  JH EstimateAI 시작 완료!
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:3000
echo  API Docs: http://localhost:8000/docs
echo ===================================
pause
