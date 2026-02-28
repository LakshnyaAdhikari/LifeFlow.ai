"""
Knowledge Base Ingestion Script
=================================
Ingests documents from two sources:
  1. knowledge_sources.yaml  — HTML pages + any remote URLs
  2. data/pdfs/manifest.json — locally cached PDFs (downloaded by download_pdfs.py)

Usage:
    python scripts/ingest_knowledge.py

Run after download_pdfs.py to include locally cached PDFs.
"""

import asyncio
import sys
import os
import yaml
import json
import logging
from pathlib import Path
from typing import Dict, Any, List

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Force UTF-8 stdout on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.database import SessionLocal
from app.services.knowledge.ingestion import IngestionPipeline
from app.auth_models import UserAuth  # Fix for mapper error
from loguru import logger
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger.add("ingestion.log", rotation="10 MB")


async def ingest_from_yaml(pipeline: IngestionPipeline, config_path: str = "knowledge_sources.yaml"):
    """Ingest HTML and remote sources from knowledge_sources.yaml."""
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
            print(f"  [SRC] {authority}")

            for doc_config in source.get("documents", []):
                title = doc_config["title"]
                url = doc_config["url"]
                doc_type = doc_config["type"]

                # Skip PDFs from YAML — they're handled by manifest ingestion
                # (direct PDF URLs fail with 403; manifest has local cached copies)
                if doc_type == "pdf" and not url.startswith("file://"):
                    print(f"    [SKIP PDF] {title[:50]} — use download_pdfs.py first")
                    continue

                print(f"    [DOC] {title[:50]}...", end="", flush=True)

                try:
                    doc = await pipeline.ingest_document(
                        url=url,
                        title=title,
                        authority=authority,
                        domain_name=domain_name,
                        source_type=doc_type,
                        metadata={
                            "original_url": url,
                            "doc_type": doc_config.get("doc_type", "information"),
                        }
                    )
                    success += 1
                    print(f" [OK] (ID: {doc.id})")
                except Exception as e:
                    failed += 1
                    print(f" [FAIL] {str(e)[:80]}")
                    logger.error(f"Failed to ingest {title}: {e}")

    return success, failed


async def ingest_from_manifest(pipeline: IngestionPipeline, manifest_path: str = "data/pdfs/manifest.json"):
    """Ingest locally cached PDFs from the download manifest."""
    if not os.path.exists(manifest_path):
        print(f"\n[PDF MANIFEST] Not found: {manifest_path}")
        print(f"  Run: python scripts/download_pdfs.py  to download PDFs first")
        return 0, 0

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    success = 0
    failed = 0
    skipped = 0

    downloaded_entries = {k: v for k, v in manifest.items() if v.get("status") in ("downloaded", "cached")}
    print(f"\n[PDF MANIFEST] Found {len(downloaded_entries)} locally cached PDFs")

    for filename, entry in downloaded_entries.items():
        local_path = entry.get("local_path", "")
        if not local_path or not Path(local_path).exists():
            print(f"  [MISSING] {filename} — file not on disk, re-run download_pdfs.py")
            skipped += 1
            continue

        title = entry["title"]
        authority = entry["authority"]
        domain_name = entry["domain"]
        file_url = "file:///" + local_path.replace("\\", "/")

        print(f"  [PDF] {title[:55]}...", end="", flush=True)

        try:
            doc = await pipeline.ingest_document(
                url=file_url,
                title=title,
                authority=authority,
                domain_name=domain_name,
                source_type="pdf",
                metadata={
                    "doc_type": entry.get("doc_type", "information"),
                    "local_path": local_path,
                    "checksum": entry.get("checksum"),
                    "downloaded_at": entry.get("downloaded_at"),
                    "circular_number": entry.get("circular_number"),
                }
            )
            success += 1
            print(f" [OK] (ID: {doc.id})")
        except Exception as e:
            failed += 1
            print(f" [FAIL] {str(e)[:80]}")
            logger.error(f"Failed to ingest PDF {title}: {e}")

    return success, failed


CURATED_FILE_MAP = {
    "consumer_protection_guide.txt": {
        "domain": "Consumer Protection",
        "authority": "Government of India",
        "title": "Consumer Protection in India — Comprehensive Guide",
    },
    "vehicle_transport_guide.txt": {
        "domain": "Vehicle & Transport",
        "authority": "Parivahan",
        "title": "Vehicle and Transport Services — Comprehensive Guide",
    },
    "property_registration_guide.txt": {
        "domain": "Property",
        "authority": "Dept of Land Resources",
        "title": "Property Registration and Land Records — Comprehensive Guide",
    },
    "insurance_policyholder_guide.txt": {
        "domain": "Insurance",
        "authority": "IRDAI",
        "title": "Insurance Policyholder Rights and Claims — Comprehensive Guide",
    },
    "itr_filing_guide.txt": {
        "domain": "Taxation",
        "authority": "Income Tax Department",
        "title": "Income Tax Return Filing — Comprehensive Guide",
    },
}


async def ingest_from_curated(pipeline: IngestionPipeline, curated_dir: str = "data/curated"):
    """Ingest curated .txt knowledge files from data/curated/ directory."""
    curated_path = Path(curated_dir)
    if not curated_path.exists():
        print(f"\n[CURATED] Directory not found: {curated_dir}")
        return 0, 0

    txt_files = list(curated_path.glob("*.txt"))
    if not txt_files:
        print(f"\n[CURATED] No .txt files in {curated_dir}")
        return 0, 0

    success = 0
    failed = 0
    print(f"\n[CURATED] Found {len(txt_files)} curated text files")

    for txt_file in txt_files:
        meta = CURATED_FILE_MAP.get(txt_file.name, {})
        domain = meta.get("domain", "General")
        authority = meta.get("authority", "Government of India")
        title = meta.get("title", txt_file.stem.replace("_", " ").title())

        file_url = "file:///" + str(txt_file.resolve()).replace("\\", "/")
        print(f"  [CURATED] {title[:55]}...", end="", flush=True)

        try:
            doc = await pipeline.ingest_document(
                url=file_url,
                title=title,
                authority=authority,
                domain_name=domain,
                source_type="txt",
                metadata={
                    "doc_type": "curated_guide",
                    "local_path": str(txt_file),
                    "source": "curated",
                }
            )
            success += 1
            print(f" [OK] (ID: {doc.id})")
        except Exception as e:
            failed += 1
            print(f" [FAIL] {str(e)[:80]}")
            logger.error(f"Failed to ingest curated file {txt_file.name}: {e}")

    return success, failed


async def ingest_knowledge_base():
    db = SessionLocal()
    pipeline = IngestionPipeline(db)

    print("\n[START] LifeFlow Knowledge Base Ingestion")
    print("==========================================")

    total_success = 0
    total_failed = 0

    try:
        # Phase 1: HTML sources from YAML
        print("\n[PHASE 1] HTML / Remote Sources (knowledge_sources.yaml)")
        s, f = await ingest_from_yaml(pipeline)
        total_success += s
        total_failed += f

        # Phase 2: Locally cached PDFs from manifest
        print("\n[PHASE 2] Local PDF Cache (data/pdfs/manifest.json)")
        s, f = await ingest_from_manifest(pipeline)
        total_success += s
        total_failed += f

        # Phase 3: Curated text files from data/curated/
        print("\n[PHASE 3] Curated Knowledge Files (data/curated/)")
        s, f = await ingest_from_curated(pipeline)
        total_success += s
        total_failed += f

    finally:
        db.close()

    print(f"\n==========================================")
    print(f"[SUMMARY] Ingestion Complete")
    print(f"  Successful : {total_success}")
    print(f"  Failed     : {total_failed}")
    print(f"==========================================\n")


if __name__ == "__main__":
    asyncio.run(ingest_knowledge_base())
