import sqlite3
import json
import os

DB_NAME = "talentscout.db"

def check_latest_candidate():
    if not os.path.exists(DB_NAME):
        print(f"Error: {DB_NAME} not found in {os.getcwd()}")
        return
        
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT id, filename, data_json FROM candidates ORDER BY id DESC LIMIT 1")
    row = c.fetchone()
    conn.close()
    
    if row:
        print(f"ID: {row[0]}")
        print(f"Filename: {row[1]}")
        try:
            data = json.loads(row[2])
            print("Score Breakdown:")
            print(json.dumps(data.get("score_breakdown"), indent=2))
            print("Hireability Summary (first 200 chars):")
            summary = data.get("hireability_summary", "N/A")
            print(summary[:200] + "...")
        except Exception as e:
            print(f"Error parsing JSON: {e}")
    else:
        print("No candidates found.")

if __name__ == "__main__":
    check_latest_candidate()
