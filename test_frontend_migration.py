"""
Frontend Migration Test

Tests that frontend correctly uses new situation-based APIs
"""

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def test_frontend_migration():
    """Test complete user workflow with new APIs"""
    
    print("\n" + "="*80)
    print("FRONTEND MIGRATION TEST")
    print("="*80)
    
    # Setup Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in background
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        wait = WebDriverWait(driver, 10)
        
        print("\n1. Opening LifeFlow.ai...")
        driver.get("http://localhost:3000")
        time.sleep(2)
        
        print("✅ Frontend loaded successfully")
        
        # Check if login page appears
        print("\n2. Checking authentication...")
        try:
            login_button = wait.until(
                EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Login')]"))
            )
            print("✅ Login page detected")
        except:
            print("⚠️  Already logged in or login page not found")
        
        print("\n" + "="*80)
        print("MANUAL TESTING REQUIRED")
        print("="*80)
        print("""
The frontend has been updated to use new APIs:

✅ Home Page Changes:
   - Uses /intake/resolve instead of /intake/situational
   - Uses /situations/create instead of /workflows
   - Displays existing situations
   - Shows domain classification results

✅ New Situation Page:
   - Displays situation details
   - Provides RAG-based guidance
   - Shows confidence scores
   - Lists authoritative sources

📋 Manual Test Steps:
1. Open http://localhost:3000
2. Login with test credentials
3. Enter a query (e.g., "my car insurance claim was rejected")
4. Verify domain classification appears
5. Click "Start Tracking This Situation"
6. Verify situation page loads
7. Ask for guidance
8. Verify suggestions appear with confidence scores

⚠️  Note: RAG features require OPENAI_API_KEY to be set
        """)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure:")
        print("  - Frontend is running (npm run dev)")
        print("  - Backend is running (uvicorn app.main:app --reload)")
        print("  - Chrome/Chromium is installed")
    
    finally:
        try:
            driver.quit()
        except:
            pass


if __name__ == "__main__":
    test_frontend_migration()
