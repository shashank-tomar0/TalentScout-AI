import sys
sys.path.append('.')
from main import extract_structured_data
import re

text = open('DEBUG_LAST_RESUME.txt', encoding='utf-8').read()
PROJ_HEADER = re.compile(
    r'^\s*(?:[\W_]*)(?:high[\s\-]*impact\s*|academic\s*|personal\s*|technical\s*|key\s*|notable\s*|major\s*)?projects?(?:[\W_]*)\s*$',
    re.IGNORECASE
)
PROJ_HEADER_NO_SPACE = re.compile(
    r'high[\-]?impactprojects?',
    re.IGNORECASE
)

text_lines = text.replace('\r\n', '\n').replace('\r', '\n').split('\n')
proj_start_li = None
for li, line in enumerate(text_lines):
    stripped = line.strip()
    if PROJ_HEADER.search(stripped) or PROJ_HEADER_NO_SPACE.search(stripped):
        print(f"MATCH: {stripped} at line {li}")
        proj_start_li = li + 1
        break

if not proj_start_li:
    print("NO HEADER FOUND.")
    
res = extract_structured_data(text)
print("PROJECT COUNT RETURNED:", res.get("project_count"))
