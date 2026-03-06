import re
import codecs

with codecs.open("main.py", "r", "utf-8") as f:
    text = f.read()

# Fix timeout
if "timeout=15.0" not in text:
    text = text.replace("sqlite3.connect(DB_NAME)", "sqlite3.connect(DB_NAME, timeout=15.0)")

# Fix UNIQUE constraint by using UPSERT (INSERT OR REPLACE)
text = text.replace("INSERT INTO candidates", "INSERT OR REPLACE INTO candidates")
text = text.replace("INSERT INTO users", "INSERT OR IGNORE INTO users")

with codecs.open("main.py", "w", "utf-8") as f:
    f.write(text)

print("Patch applied.")
