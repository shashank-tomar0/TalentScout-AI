@echo off
echo [1/4] Creating Virtual Environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create venv. Make sure Python is installed.
    exit /b %errorlevel%
)

echo [2/4] Activating Virtual Environment and Installing Requirements...
call venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt

echo [3/5] Downloading SpaCy Model (en_core_web_md)...
python -m spacy download en_core_web_md

echo [4/5] Installing Frontend Dependencies (npm install)...
cd frontend
call npm install
cd ..

echo [5/5] Verification...
python -c "import spacy; nlp = spacy.load('en_core_web_md'); print('SpaCy model loaded successfully')"

echo.
echo [SUCCESS] Environment is ready (Backend & Frontend).
echo To start everything, run: start_talentscout.bat
pause
