@echo off
title TalentScout AI - Full Stack Launcher
color 0A
echo.
echo  ████████╗ █████╗ ██╗     ███████╗███╗   ██╗████████╗███████╗ ██████╗ ██████╗ ██╗   ██╗████████╗
echo  ╚══██╔══╝██╔══██╗██║     ██╔════╝████╗  ██║╚══██╔══╝██╔════╝██╔════╝██╔═══██╗██║   ██║╚══██╔══╝
echo  ╚══██╔══╝██╔══██╗██║     ██╔════╝████╗  ██║╚══██╔══╝██╔════╝██╔════╝██╔═██╗██║   ██║╚══██╔══╝
echo     ██║   ███████║██║     █████╗  ██╔██╗ ██║   ██║   ███████╗██║     ██║   ██║██║   ██║   ██║
echo     ██║   ██╔══██║██║     ██╔══╝  ██║╚██╗██║   ██║   ╚════██║██║     ██║   ██║██║   ██║   ██║
echo     ██║   ██║  ██║███████╗███████╗██║ ╚████║   ██║   ███████║╚██████╗╚██████╔╝╚██████╔╝   ██║
echo.
echo  [ TALENTSCOUT AI - PRODUCTION STACK ]
echo.

:: 1. Check for Virtual Environment
if not exist venv (
    echo [ERROR] Virtual Environment not found!
    echo Please run 'setup_env.bat' first to install dependencies safely.
    pause
    exit /b
)

echo [1/3] Environment Verified (VENV)
echo.

:: 2. Launch Backend
echo [2/3] Launching FastAPI Backend...
start "TalentScout :: Backend" cmd /k "call venv\Scripts\activate && echo [BACKEND] Starting... && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak > nul

:: 3. Launch Frontend
echo.
echo [3/3] Launching Next.js Frontend...
start "TalentScout :: Frontend" cmd /k "echo [FRONTEND] Starting... && cd frontend && npm run dev -- -p 3001"

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
