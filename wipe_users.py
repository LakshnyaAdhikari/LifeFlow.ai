import sqlite3

def wipe_user_data():
    conn = sqlite3.connect('lifeflow.db')
    cursor = conn.cursor()
    
    # List of tables to clear for a fresh start with users
    tables_to_clear = [
        "users",
        "user_auth",
        "user_profile",
        "user_sessions",
        "otp_verification",
        "user_queries",
        "user_situations",
        "workflow_instances",
        "guidance_sessions",
        "situation_interactions",
        "user_feedback",
        "node_instance_states",
        "action_logs",
        "step_evidence"
    ]
    
    print("🧹 Starting database cleanup...")
    
    try:
        # Disable foreign keys temporarily if needed, though DELETE will work
        cursor.execute("PRAGMA foreign_keys = OFF;")
        
        for table in tables_to_clear:
            try:
                cursor.execute(f"DELETE FROM {table};")
                print(f"✅ Cleared table: {table}")
            except sqlite3.OperationalError as e:
                # Table might not exist yet
                print(f"⚠️  Skipped {table}: {e}")
        
        # Reset auto-increment counters if they exist
        try:
            cursor.execute("DELETE FROM sqlite_sequence WHERE name IN (" + ",".join(f"'{t}'" for t in tables_to_clear) + ");")
        except sqlite3.OperationalError:
            pass
        
        conn.commit()
        print("\n✨ All user accounts and related data have been removed. You can now start fresh!")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        conn.rollback()
    finally:
        cursor.execute("PRAGMA foreign_keys = ON;")
        conn.close()

if __name__ == "__main__":
    wipe_user_data()
