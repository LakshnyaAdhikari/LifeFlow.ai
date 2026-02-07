import asyncio
import sys
import os
import yaml
import logging
from typing import Dict, Any, List

# Add parent directory to path to allow importing app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.services.knowledge.ingestion import IngestionPipeline
from app.auth_models import UserAuth  # Fix for mapper error
from loguru import logger
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger.add("ingestion.log", rotation="10 MB")

async def ingest_knowledge_base():
    """
    Ingest knowledge base from configuration file
    """
    config_path = "knowledge_sources.yaml"
    
    if not os.path.exists(config_path):
        logger.error(f"Configuration file not found: {config_path}")
        return
    
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    
    db = SessionLocal()
    pipeline = IngestionPipeline(db)
    
    total_docs = 0
    success_docs = 0
    failed_docs = 0
    
    print(f"\n🚀 Starting Knowledge Base Ingestion...")
    print(f"=======================================")
    
    try:
        for domain_config in config.get("domains", []):
            domain_name = domain_config["name"]
            print(f"\n📂 Processing Domain: {domain_name}")
            
            for source in domain_config.get("sources", []):
                authority = source["authority"]
                print(f"  🏛️ Source: {authority}")
                
                for doc_config in source.get("documents", []):
                    total_docs += 1
                    title = doc_config["title"]
                    url = doc_config["url"]
                    doc_type = doc_config["type"]
                    
                    print(f"    📄 Ingesting: {title}...", end="", flush=True)
                    
                    try:
                        # Ingest document
                        doc = await pipeline.ingest_document(
                            url=url,
                            title=title,
                            authority=authority,
                            domain_name=domain_name,
                            source_type=doc_type,
                            metadata={"original_url": url}
                        )
                        
                        success_docs += 1
                        print(f" ✅ Done (ID: {doc.id})")
                        
                    except Exception as e:
                        failed_docs += 1
                        print(f" ❌ Failed: {str(e)}")
                        logger.error(f"Failed to ingest {title}: {e}")
    
    finally:
        db.close()
    
    print(f"\n=======================================")
    print(f"📊 Ingestion Summary:")
    print(f"   Total Documents: {total_docs}")
    print(f"   Successful:      {success_docs}")
    print(f"   Failed:          {failed_docs}")
    print(f"=======================================\n")

if __name__ == "__main__":
    asyncio.run(ingest_knowledge_base())
