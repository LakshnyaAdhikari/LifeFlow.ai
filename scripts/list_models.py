
import os
import asyncio
from dotenv import load_dotenv
from google import genai

load_dotenv()

async def list_models():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not found")
        return

    client = genai.Client(api_key=api_key)
    
    try:
        model = client.models.get(model="models/gemini-2.5-flash")
        print(f"Model: {model.name}")
        print(f"Supported methods: {model.supported_generation_methods}")
        
    except Exception as e:
        print(f"Error checking model: {e}")

if __name__ == "__main__":
    asyncio.run(list_models())
