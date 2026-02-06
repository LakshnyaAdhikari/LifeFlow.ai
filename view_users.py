import sqlite3

def show_data(table_name):
    conn = sqlite3.connect('lifeflow.db')
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        colnames = [description[0] for description in cursor.description]
        print(f"\n--- Table: {table_name} ---")
        print(" | ".join(colnames))
        print("-" * 50)
        for row in rows:
            print(" | ".join(map(str, row)))
    except Exception as e:
        print(f"Error reading {table_name}: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    show_data("users")
    show_data("user_auth")
    show_data("user_profile")
    show_data("user_sessions")
    show_data("otp_verification")
