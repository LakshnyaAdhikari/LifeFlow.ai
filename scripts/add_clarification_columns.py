
import sqlite3
import os

DB_PATH = "lifeflow.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found!")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("Adding clarification_questions column...")
        cursor.execute("ALTER TABLE user_situations ADD COLUMN clarification_questions JSON DEFAULT '[]'")
        print("✅ Added clarification_questions")
    except sqlite3.OperationalError as e:
        print(f"⚠️ clarification_questions might already exist: {e}")

    try:
        print("Adding clarification_answers column...")
        cursor.execute("ALTER TABLE user_situations ADD COLUMN clarification_answers JSON DEFAULT '[]'")
        print("✅ Added clarification_answers")
    except sqlite3.OperationalError as e:
        print(f"⚠️ clarification_answers might already exist: {e}")
        
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
