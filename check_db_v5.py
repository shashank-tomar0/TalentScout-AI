import sqlite3
import json
conn = sqlite3.connect('talentscout.db')
c = conn.cursor()
c.execute("SELECT id, data_json FROM candidates ORDER BY id DESC LIMIT 1")
row = c.fetchone()
if row:
    print(f"Latest candidate ID: {row[0]}")
    data = json.loads(row[1])
    print(f"Projects extracted: {data.get('projects')}")
else:
    print("No DB row found.")
