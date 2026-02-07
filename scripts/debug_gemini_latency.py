
import os
import time
import asyncio
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found")
    exit(1)

client = genai.Client(api_key=api_key)

models_to_test = [
    "models/gemini-flash-latest",
    "models/gemini-2.0-flash-lite",
    "models/gemini-2.5-flash-lite",
    "models/gemini-2.0-flash-001"
]

def test_sync_generation():
    with open("latency_results.txt", "w", encoding="utf-8") as f:
        f.write("--- Testing Sync Generation ---\n")
        
        for model_name in models_to_test:
            print(f"Testing {model_name}...")
            f.write(f"\nTesting model: {model_name}\n")
            start_time = time.time()
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents="Explain how to update Aadhaar address.",
                    config={"max_output_tokens": 10}
                )
                duration = time.time() - start_time
                msg = f"✅ Success! Time: {duration:.2f}s"
                print(msg)
                f.write(msg + "\n")
                f.write(f"Response: {response.text}\n")
                return # Stop on first success
            except Exception as e:
                duration = time.time() - start_time
                msg = f"❌ Failed! Time: {duration:.2f}s Error: {e}"
                print(msg)
                f.write(msg + "\n")

async def test_async_generation():
    pass

if __name__ == "__main__":
    test_sync_generation()
    asyncio.run(test_async_generation())
