import sys

with open("main.py", "r", encoding="utf-8") as f:
    text = f.read()

lines = text.split("\n")
with open("out.txt", "w", encoding="utf-8") as out:
    for i, line in enumerate(lines):
        if "/generate_interview" in line:
            out.write(f"FOUND AT LINE {i+1}: {line}\n")
            for j in range(i, min(i+40, len(lines))):
                out.write(f"{j+1}: {lines[j]}\n")
