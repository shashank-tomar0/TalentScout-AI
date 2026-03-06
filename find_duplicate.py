with open("main.py", "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if "def calculate_candidate_score" in line:
            print(f"Match at line {i}: {line.strip()}")
