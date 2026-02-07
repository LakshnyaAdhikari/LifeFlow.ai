
try:
    with open("all_models.txt", "r", encoding="utf-8") as f:
        for line in f:
            if "flash" in line:
                print(line.strip())
except Exception as e:
    print(f"Error reading file: {e}")
