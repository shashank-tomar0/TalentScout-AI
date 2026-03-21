@echo off
echo Starting TalentScout AI Backend...
call venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000
pause
