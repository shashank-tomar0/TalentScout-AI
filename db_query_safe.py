import sqlite3
import json
import codecs

try:
    conn = sqlite3.connect('talentscout.db')
    c = conn.cursor()
    c.execute("SELECT id, data_json FROM candidates ORDER BY id DESC LIMIT 1")
    row = c.fetchone()
    if row:
        with codecs.open("db_check_result.txt", "w", "utf-8") as f:
            f.write(f"ID: {row[0]}\n")
            data = json.loads(row[1])
            f.write(f"Projects count: {data.get('projects')}\n")
            # also print raw text from DEBUG_LAST_RESUME.txt to see if GitHub links survived
            with codecs.open('DEBUG_LAST_RESUME.txt', 'r', 'utf-8') as f2:
                text = f2.read()
            import re
            links = re.findall(r'github\.com\/[^\s]+', text.lower())
            f.write(f"Git regex matched: {len(links)}\n")
            f.write("Links found:\n")
            for l in links:
                f.write(f"- {l}\n")
    else:
        with codecs.open("db_check_result.txt", "w", "utf-8") as f:
            f.write("No rows.")
except Exception as e:
    import traceback
    with open("db_check_err.txt", "w") as f:
        f.write(traceback.format_exc())
