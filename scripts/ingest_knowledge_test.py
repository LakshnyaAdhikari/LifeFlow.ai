"""
Knowledge Base Ingestion Script (TEST)
=====================================
Used for testing new knowledge sources before adding them to the
production knowledge_sources.yaml.

Usage:
    python scripts/ingest_knowledge_test.py
"""

import asyncio
import sys
import os
import yaml
import logging

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.database import SessionLocal
from app.services.knowledge.ingestion import IngestionPipeline
from app.auth_models import UserAuth
from loguru import logger
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)

# Test log
logger.add("ingestion_test.log", rotation="10 MB")


async def ingest_from_yaml(
    pipeline: IngestionPipeline,
    config_path: str = "knowledge_sources_test.yaml",
):
    """Ingest HTML sources from the TEST yaml."""

    if not os.path.exists(config_path):
        logger.warning(f"Config file not found: {config_path}")
        return 0, 0

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    success = 0
    failed = 0

    for domain_config in config.get("domains", []):

        domain_name = domain_config["name"]

        print(f"\n[DOMAIN] {domain_name}")

        for source in domain_config.get("sources", []):

            authority = source["authority"]

            print(f"  [SOURCE] {authority}")

            for doc_config in source.get("documents", []):

                title = doc_config["title"]
                url = doc_config["url"]
                doc_type = doc_config["type"]

                print(f"    [DOC] {title[:60]}...", end="", flush=True)

                try:

                    doc = await pipeline.ingest_document(
                        url=url,
                        title=title,
                        authority=authority,
                        domain_name=domain_name,
                        source_type=doc_type,
                        metadata={
                            "original_url": url,
                            "doc_type": doc_config.get(
                                "doc_type",
                                "information",
                            ),
                            "authority_weight": source.get(
                                "authority_weight",
                                1.0,
                            ),
                        },
                    )

                    success += 1
                    print(f" [OK] (ID: {doc.id})")

                except Exception as e:

                    failed += 1

                    print(f" [FAIL] {str(e)[:100]}")

                    logger.error(f"{title}: {e}")

    return success, failed


async def ingest_knowledge_base():

    db = SessionLocal()

    pipeline = IngestionPipeline(db)

    print("\n====================================")
    print(" LifeFlow TEST Knowledge Ingestion")
    print("====================================")

    total_success = 0
    total_failed = 0

    try:

        print("\n[PHASE 1] Testing knowledge_sources_test.yaml")

        success, failed = await ingest_from_yaml(pipeline)

        total_success += success
        total_failed += failed
        print("\n[PHASE 2] PDF Ingestion")
        print("Skipped (Phase 1 HTML testing only)")

        print("\n[PHASE 3] Curated Knowledge")
        print("Skipped (Phase 1 HTML testing only)")

    finally:

        db.close()

    print("\n====================================")
    print(" TEST INGESTION COMPLETE")
    print("====================================")
    print(f"Successful : {total_success}")
    print(f"Failed     : {total_failed}")
    print("====================================\n")


if __name__ == "__main__":
    asyncio.run(ingest_knowledge_base())