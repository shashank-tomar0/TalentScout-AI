@echo off
setlocal enabledelayedexpansion

echo ################################################
echo #        TalentScout AI - OneClick Run         #
echo ################################################

:: Check if .env exists
if not exist ".env" (
    echo [ERROR] .env file not found! Please create it from .env.example
    pause
    exit /b 1
)

:: BACKEND SETUP
echo [BACKEND] Checking Python environment...
if not exist "venv" (
    echo [BACKEND] Virtual environment 'venv' not found.
    echo [BACKEND] Creating venv and installing requirements...
    python -m venv venv
    call .\venv\Scripts\activate
    pip install -r requirements.txt
) else (
    echo [BACKEND] Virtual environment found. Activating...
    call .\venv\Scripts\activate
)

:: FRONTEND SETUP
echo [FRONTEND] Checking dependencies...
if not exist "frontend\node_modules" (
    echo [FRONTEND] node_modules not found. Installing...
    cd frontend
    call npm install
    cd ..
)

:: START SERVICES
echo.
echo [SYSTEM] Starting services...
echo [SYSTEM] Backend will run on http://localhost:8000
echo [SYSTEM] Frontend will run on http://localhost:3001
echo.

:: Start Backend in a new window
echo [SYSTEM] Launching Backend...
start "TalentScout-BACKEND" cmd /k "call .\venv\Scripts\activate && uvicorn main:app --reload"

:: Start Frontend in a new window
echo [SYSTEM] Launching Frontend...
start "TalentScout-FRONTEND" cmd /k "cd frontend && npm run dev -- -p 3001"

echo.
echo [SUCCESS] Both services are launching in separate windows.
echo [SUCCESS] Dashboard: http://localhost:3001
echo.
echo Keep this window open or close it once services are confirmed running.
pause
