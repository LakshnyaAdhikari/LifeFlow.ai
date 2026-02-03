import sqlite3

conn = sqlite3.connect('lifeflow.db')
cursor = conn.cursor()

# Check workflow instances
cursor.execute("SELECT id, user_id, version_id, docket_number, status FROM workflow_instance ORDER BY id DESC LIMIT 5")
instances = cursor.fetchall()

print("Recent Workflow Instances:")
for inst in instances:
    print(f"  ID: {inst[0]}, User: {inst[1]}, Version: {inst[2]}, Docket: {inst[3]}, Status: {inst[4]}")

# Check workflow versions
cursor.execute("SELECT id, template_id, version_number FROM workflow_version LIMIT 5")
versions = cursor.fetchall()

print("\nWorkflow Versions:")
for ver in versions:
    print(f"  ID: {ver[0]}, Template: {ver[1]}, Version: {ver[2]}")

# Check workflow templates
cursor.execute("SELECT id, name, category FROM workflow_template LIMIT 5")
templates = cursor.fetchall()

print("\nWorkflow Templates:")
for temp in templates:
    print(f"  ID: {temp[0]}, Name: {temp[1]}, Category: {temp[2]}")

conn.close()
