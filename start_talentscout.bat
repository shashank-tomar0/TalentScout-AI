@echo off
title TalentScout AI - Full Stack Launcher
color 0A
echo.
echo  ████████╗ █████╗ ██╗     ███████╗███╗   ██╗████████╗███████╗ ██████╗ ██████╗ ██╗   ██╗████████╗
echo  ╚══██╔══╝██╔══██╗██║     ██╔════╝████╗  ██║╚══██╔══╝██╔════╝██╔════╝██╔═══██╗██║   ██║╚══██╔══╝
echo     ██║   ███████║██║     █████╗  ██╔██╗ ██║   ██║   ███████╗██║     ██║   ██║██║   ██║   ██║
echo     ██║   ██╔══██║██║     ██╔══╝  ██║╚██╗██║   ██║   ╚════██║██║     ██║   ██║██║   ██║   ██║
echo     ██║   ██║  ██║███████╗███████╗██║ ╚████║   ██║   ███████║╚██████╗╚██████╔╝╚██████╔╝   ██║
echo.
echo  [ TALENTSCOUT AI - PRODUCTION STACK ]
echo.
echo  [1/3] Checking Python dependencies...
echo  (Running: pip install -r requirements.txt)
python -m pip install -r requirements.txt -q

echo.
echo  [2/3] Launching FastAPI Backend on port 8000...
start "TalentScout :: Backend (FastAPI)" cmd /k "echo [BACKEND] Starting... && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak > nul

echo.
echo  [3/3] Launching Landing Page (Next.js) on port 3001...
start "TalentScout :: Frontend (Next.js)" cmd /k "echo [FRONTEND] Installing packages (first run may take a minute)... && cd frontend && npm install && npm run dev -- --port 3001"

echo.
echo  =============================================
echo   All services launched!
echo  =============================================
echo   Backend API:     http://localhost:8000
echo   API Docs:        http://localhost:8000/docs
echo   Landing Page:    http://localhost:3001
echo  =============================================
echo.
echo If "Disconnected" appears in UI, check the Backend terminal for errors.
echo.
pause
