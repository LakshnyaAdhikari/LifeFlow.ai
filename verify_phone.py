import sqlite3

# Connect to database
conn = sqlite3.connect('lifeflow.db')
cursor = conn.cursor()

# Update phone verification status
phone = "+917428036070"
cursor.execute("UPDATE user_auth SET is_phone_verified = 1 WHERE phone = ?", (phone,))
conn.commit()

# Check the update
cursor.execute("SELECT phone, is_phone_verified FROM user_auth WHERE phone = ?", (phone,))
result = cursor.fetchone()

if result:
    print(f"✅ Phone {result[0]} verification status: {bool(result[1])}")
else:
    print(f"❌ No user found with phone {phone}")

# Also show the OTP
cursor.execute("""
    SELECT otp.otp_code, otp.expires_at 
    FROM otp_verification otp
    JOIN user_auth ua ON otp.user_auth_id = ua.id
    WHERE ua.phone = ?
    ORDER BY otp.created_at DESC
    LIMIT 1
""", (phone,))
otp_result = cursor.fetchone()

if otp_result:
    print(f"📱 Latest OTP: {otp_result[0]}")
    print(f"   Expires: {otp_result[1]}")

conn.close()
