
import asyncio
import time
import os
import sys
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.getcwd())

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal
# Import ALL models to ensure SQLAlchemy registry is populated
from app.models import core, situation, knowledge
from app import auth_models 

from app.services.guidance.rag_engine import GuidanceEngine
from app.services.llm.client import get_llm_client
from loguru import logger

# Configure logger to stdout
logger.remove()
logger.add(sys.stdout, level="INFO")

async def test_latency():
    with open("rag_latency_results_utf8.txt", "w", encoding="utf-8") as f:
        f.write("--- Testing RAG Engine Latency ---\n")
        
        db = SessionLocal()
        try:
            # 1. Init Engine (includes model loading if not already loaded)
            print("Initializing Engine (Models)...")
            start_init = time.time()
            engine = GuidanceEngine(db)
            
            # Force load models now to separate init time from gen time
            llm = get_llm_client()
            # Trigger local embedding load (warmup)
            llm.generate_embedding("warmup")
            
            init_time = time.time() - start_init
            msg = f"Init & Warmup took: {init_time:.2f}s"
            print(msg)
            f.write(msg + "\n")
            
            # 2. Generate Guidance
            query = "How do I update my Aadhaar address online?"
            domain = "Identity Documents"
            user_id = 1
            
            print(f"\nGenerating guidance for: '{query}'")
            print(f"Using Model: {llm.config.model}")
            f.write(f"Using Model: {llm.config.model}\n")
            f.flush()
            
            start_gen = time.time()
            
            # Create task to allow monitoring? No, just await.
            # But let's verify if *engine* has the right client
            print("Calling engine.generate_guidance...")
            f.flush()
            
            response = await engine.generate_guidance(
                query=query,
                domain=domain,
                user_id=user_id
            )
            
            duration = time.time() - start_gen
            print(f"\n✅ Generation Complete!")
            f.write(f"\n✅ Generation Complete!\n")
            f.write(f"Total Duration: {duration:.2f}s\n")
            f.write(f"Confidence: {response.confidence['score']}\n")
            f.write(f"Suggestions: {len(response.suggestions)}\n")
            f.flush()
            
        except Exception as e:
            msg = f"❌ Error: {e}"
            print(msg)
            f.write(msg + "\n")
            import traceback
            traceback.print_exc(file=f)
            traceback.print_exc() # print to stdout too
            
        except Exception as e:
            msg = f"❌ Error: {e}"
            print(msg)
            f.write(msg + "\n")
            import traceback
            traceback.print_exc(file=f)
        finally:
            db.close()

if __name__ == "__main__":
    asyncio.run(test_latency())
