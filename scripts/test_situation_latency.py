
import asyncio
import time
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal
from app.models import core, situation, knowledge
from app import auth_models
from app.models.situation import UserSituation
from app.services.situation.context_builder import SituationContextBuilder

async def test_latency():
    print("\n--- Testing Situation Context Builder Latency ---\n")
    
    db = SessionLocal()
    try:
        situation_id = 33
        print(f"Fetching Situation ID: {situation_id}...")
        
        start_db = time.time()
        sit = db.query(UserSituation).filter(UserSituation.id == situation_id).first()
        print(f"DB Fetch took: {time.time() - start_db:.4f}s")
        
        if not sit:
            print("Situation not found!")
            return

        print(f"Found: {sit.title}")
        
        print("\nBuilding Context...")
        start_ctx = time.time()
        
        builder = SituationContextBuilder(db)
        context = await builder.build_context(sit)
        
        duration = time.time() - start_ctx
        print(f"Context Build took: {duration:.4f}s")
        print(f"Timeline events: {len(context.timeline)}")
        print(f"Upcoming deadlines: {len(context.upcoming_deadlines)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_latency())
