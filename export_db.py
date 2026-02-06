import sqlite3
import csv

def export_table(table_name):
    conn = sqlite3.connect('lifeflow.db')
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        colnames = [description[0] for description in cursor.description]
        with open(f"{table_name}.csv", 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(colnames)
            writer.writerows(rows)
        print(f"Exported {table_name} to {table_name}.csv")
    except Exception as e:
        print(f"Error exporting {table_name}: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    export_table("users")
    export_table("user_sessions")
