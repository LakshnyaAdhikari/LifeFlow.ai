import sqlite3
import sys

def get_latest_otp(phone_part):
    conn = sqlite3.connect('lifeflow.db')
    cursor = conn.cursor()
    try:
        query = "SELECT phone, otp_code, created_at FROM otp_verification WHERE phone LIKE ? ORDER BY created_at DESC LIMIT 5"
        cursor.execute(query, (f"%{phone_part}%",))
        rows = cursor.fetchall()
        if not rows:
            print(f"No OTP found for {phone_part}")
            return
        
        print(f"Latest OTPs for {phone_part}:")
        for row in rows:
            print(f"Phone: {row[0]}, OTP: {row[1]}, Created At: {row[2]}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    phone = sys.argv[1] if len(sys.argv) > 1 else "7428036070"
    get_latest_otp(phone)
