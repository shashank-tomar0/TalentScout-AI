import os
import smtplib
from dotenv import load_dotenv

load_dotenv()

def verify_smtp():
    host = os.environ.get("SMTP_HOST")
    port = int(os.environ.get("SMTP_PORT", 587))
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASS")
    
    print(f"Attempting to connect to {host}:{port}...")
    try:
        server = smtplib.SMTP(host, port, timeout=10)
        server.starttls()
        print("Connection established and TLS started.")
        
        print(f"Attempting to login as {user}...")
        server.login(user, password)
        print("Login SUCCESSFUL!")
        server.quit()
        return True
    except Exception as e:
        print(f"Login FAILED: {e}")
        return False

if __name__ == "__main__":
    verify_smtp()
