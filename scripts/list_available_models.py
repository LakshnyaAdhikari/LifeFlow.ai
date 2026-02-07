
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found")
    exit(1)

client = genai.Client(api_key=api_key)

try:
    print("Listing models...")
    with open("available_models.txt", "w") as f:
        for model in client.models.list():
            print(f"Model: {model.name}")
            f.write(f"{model.name}\n")
            try:
                # Try to get display name if available
                if hasattr(model, 'display_name'):
                    f.write(f"  Display: {model.display_name}\n")
            except:
                pass
except Exception as e:
    print(f"Error listing models: {e}")
