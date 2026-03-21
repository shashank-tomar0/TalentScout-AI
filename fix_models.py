import re
import sys

with open("main.py", "r", encoding="utf-8") as f:
    code = f.read()

count1 = code.count('llama-3.3-70b-versatile')
count2 = code.count('llama3-70b-8192')
count3 = code.count('llama-3.3-70b')

code = code.replace('llama-3.3-70b-versatile', 'llama-3.1-8b-instant')
code = code.replace('llama3-70b-8192', 'llama-3.1-8b-instant')
code = code.replace('llama-3.3-70b', 'llama-3.1-8b-instant')

# Also change concurrency limits if available to be safe
code = re.sub(r'asyncio\.Semaphore\(\w*\)', 'asyncio.Semaphore(2)', code) # max 2 concurrent requests

with open("main.py", "w", encoding="utf-8") as f:
    f.write(code)

print(f"Replaced {count1} versatile, {count2} 8192, {count3} 70b. Set concurrency to 2.")
