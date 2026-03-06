import sys
sys.path.append('.')
from main import extract_structured_data
import os

try:
    with open('DEBUG_LAST_RESUME.txt', encoding='utf-8') as f:
        text = f.read()
    res = extract_structured_data(text)
    with open('pytest_out.txt', 'w') as f:
        f.write(f"Projects count: {res.get('project_count')}\n")
except Exception as e:
    import traceback
    with open('pytest_out.txt', 'w') as f:
        f.write(traceback.format_exc())
