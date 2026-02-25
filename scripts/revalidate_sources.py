"""
Source Revalidation Script for LifeFlow.ai
============================================
Checks if any PDFs in the manifest have been updated on the source site.
Re-downloads and re-ingests if changed.

Usage:
    python scripts/revalidate_sources.py          # check all sources
    python scripts/revalidate_sources.py --ingest  # check + re-ingest changed

Recommended: Run this weekly via Task Scheduler / cron.
"""

import asyncio
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from loguru import logger
from download_pdfs import download_source, load_manifest, save_manifest, file_checksum, PDF_SOURCES

MANIFEST_PATH = Path("data/pdfs/manifest.json")


async def revalidate_all(re_ingest: bool = False):
    """
    For each source in the manifest:
    1. Check if listing page has a newer PDF (via HEAD request or page scrape)
    2. Re-download if checksum differs
    3. Optionally re-ingest into FAISS
    """
    manifest = load_manifest()
    updated = []
    unchanged = []
    failed_check = []

    print("\n[REVALIDATE] Checking all sources for updates...")
    print("=" * 60)

    for source in PDF_SOURCES:
        filename = source["filename"]
        old_entry = manifest.get(filename, {})
        old_checksum = old_entry.get("checksum")
        local_path = Path(old_entry.get("local_path", "")) if old_entry else None

        print(f"  Checking: {source['title'][:50]}...", end="", flush=True)

        # Force re-download to compare checksums
        result = await download_source(source, force=True)

        if result["status"] == "failed":
            failed_check.append(filename)
            print(" [FAIL]")
            continue

        new_checksum = result.get("checksum")

        if old_checksum and new_checksum and old_checksum == new_checksum:
            # Unchanged — restore old metadata
            manifest[filename] = {**old_entry, "last_checked": datetime.now(timezone.utc).isoformat()}
            unchanged.append(filename)
            print(f" [UNCHANGED]")
        else:
            # Updated or new
            result["previous_checksum"] = old_checksum
            result["last_checked"] = datetime.now(timezone.utc).isoformat()
            manifest[filename] = result
            updated.append(filename)
            print(f" [UPDATED] {result.get('file_size_kb', '?')}KB")

        save_manifest(manifest)

    print("=" * 60)
    print(f"[DONE] Unchanged: {len(unchanged)} | Updated: {len(updated)} | Failed: {len(failed_check)}")

    if updated:
        print(f"\n[UPDATED FILES]")
        for f in updated:
            print(f"  - {f}")

        if re_ingest:
            print("\n[AUTO-INGEST] Re-ingesting updated documents...")
            await run_ingestion_for_updated(manifest, updated)
        else:
            print(f"\n[NEXT] Run: python scripts/ingest_knowledge.py  (to re-ingest updated docs)")


async def run_ingestion_for_updated(manifest: dict, updated_filenames: list):
    """Trigger ingestion for only the updated documents."""
    from dotenv import load_dotenv
    load_dotenv()

    from app.database import SessionLocal
    from app.services.knowledge.ingestion import IngestionPipeline

    db = SessionLocal()
    pipeline = IngestionPipeline(db)

    for filename in updated_filenames:
        entry = manifest.get(filename)
        if not entry or entry["status"] != "downloaded":
            continue

        local_path = entry.get("local_path")
        if not local_path or not Path(local_path).exists():
            logger.warning(f"Local file not found: {local_path}")
            continue

        # Use file:// URL so local fetcher picks it up
        file_url = f"file:///{local_path.replace(chr(92), '/')}"

        try:
            doc = await pipeline.ingest_document(
                url=file_url,
                title=entry["title"],
                authority=entry["authority"],
                domain_name=entry["domain"],
                source_type="pdf",
                metadata={
                    "doc_type": entry.get("doc_type", "information"),
                    "local_path": local_path,
                }
            )
            print(f"  [OK] Re-ingested: {entry['title'][:50]} (ID: {doc.id})")
        except Exception as e:
            print(f"  [FAIL] {entry['title'][:50]}: {e}")

    db.close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="LifeFlow Source Revalidator")
    parser.add_argument("--ingest", action="store_true", help="Auto re-ingest updated docs")
    args = parser.parse_args()
    asyncio.run(revalidate_all(re_ingest=args.ingest))
