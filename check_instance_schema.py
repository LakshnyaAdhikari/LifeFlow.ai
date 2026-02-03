import sqlite3

conn = sqlite3.connect('lifeflow.db')
cursor = conn.cursor()

# Get schema
cursor.execute("PRAGMA table_info(workflow_instances)")
columns = cursor.fetchall()

print("workflow_instances schema:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

# Get recent data
cursor.execute("SELECT * FROM workflow_instances ORDER BY id DESC LIMIT 3")
instances = cursor.fetchall()

print("\nRecent instances:")
for inst in instances:
    print(f"  {inst}")

conn.close()
