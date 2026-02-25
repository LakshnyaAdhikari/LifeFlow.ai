"""
Automated PDF Downloader for LifeFlow.ai
==========================================
Uses Playwright to NAVIGATE to listing pages and CLICK download links
instead of hitting PDF URLs directly (bypasses CDN 403 blocks).

After downloading, updates data/pdfs/manifest.json with:
  - file path, checksum, download date, authority, version

Usage:
    python scripts/download_pdfs.py              # download all missing/updated
    python scripts/download_pdfs.py --force      # re-download everything
    python scripts/download_pdfs.py --domain Insurance  # specific domain only

After downloading, run:
    python scripts/ingest_knowledge.py
"""

import asyncio
import hashlib
import json
import os
import sys
import argparse
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from loguru import logger

# ─────────────────────────────────────────────────────────────────
# PDF Source Registry
# Each entry: navigate to 'page_url', then click/find a link
# matching 'link_text' or 'link_contains' to trigger the download.
# If 'direct_url' is set, try that first (some RBI docs work directly).
# ─────────────────────────────────────────────────────────────────
PDF_SOURCES = [
    # ── Insurance ──────────────────────────────────────────────
    {
        "domain": "Insurance",
        "authority": "IRDAI",
        "title": "Master Circular on Protection of Policyholders Interests 2024",
        "doc_type": "master_circular",
        "circular_number": "IRDAI/PP&GR/CIR/MISC/117/9/2024",
        "page_url": "https://irdai.gov.in/document-detail?documentId=5083599",
        "link_contains": ["download", "pdf", "circular"],
        "filename": "irdai_policyholder_master_circular_2024.pdf",
    },
    {
        "domain": "Insurance",
        "authority": "IRDAI",
        "title": "Master Circular on Health Insurance Products 2024",
        "doc_type": "master_circular",
        "page_url": "https://irdai.gov.in/document-detail?documentId=5128614",
        "link_contains": ["download", "pdf"],
        "filename": "irdai_health_insurance_master_circular_2024.pdf",
    },

    # ── Banking & Finance ───────────────────────────────────────
    {
        "domain": "Banking & Finance",
        "authority": "RBI",
        "title": "Reserve Bank Integrated Ombudsman Scheme 2021",
        "doc_type": "regulation",
        "direct_url": "https://rbidocs.rbi.org.in/rdocs/content/pdfs/RBIOS2021_121121.pdf",
        "filename": "rbi_integrated_ombudsman_scheme_2021.pdf",
    },
    {
        "domain": "Banking & Finance",
        "authority": "RBI",
        "title": "RBI Master Direction KYC 2016 (Updated 2024)",
        "doc_type": "regulation",
        "page_url": "https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=11566",
        "link_contains": ["pdf", "download", "master direction"],
        "filename": "rbi_kyc_master_direction_2024.pdf",
    },
    {
        "domain": "Banking & Finance",
        "authority": "RBI",
        "title": "RBI Booklet on Banking Ombudsman Scheme",
        "doc_type": "handbook",
        "direct_url": "https://rbidocs.rbi.org.in/rdocs/Publications/PDFs/BOM28022023A60F1B16F5884BD283499AD0A6E8E22E.PDF",
        "filename": "rbi_banking_ombudsman_booklet.pdf",
    },

    # ── Taxation ───────────────────────────────────────────────
    {
        "domain": "Taxation",
        "authority": "Income Tax Department",
        "title": "Instructions to ITR-1 Sahaj (AY 2024-25)",
        "doc_type": "form_instruction",
        "page_url": "https://incometaxindia.gov.in/Pages/downloads/income-tax-returns.aspx",
        "link_contains": ["itr-1", "sahaj", "instruction"],
        "filename": "itr1_sahaj_instructions_ay2024_25.pdf",
    },
    {
        "domain": "Taxation",
        "authority": "Income Tax Department",
        "title": "Instructions to ITR-4 Sugam (AY 2024-25)",
        "doc_type": "form_instruction",
        "page_url": "https://incometaxindia.gov.in/Pages/downloads/income-tax-returns.aspx",
        "link_contains": ["itr-4", "sugam", "instruction"],
        "filename": "itr4_sugam_instructions_ay2024_25.pdf",
    },

    # ── Employment ─────────────────────────────────────────────
    {
        "domain": "Employment",
        "authority": "EPFO",
        "title": "EPFO Information Handbook (RTI Act 2005)",
        "doc_type": "handbook",
        "page_url": "https://www.epfindia.gov.in/site_en/RTIInfo.php",
        "link_contains": ["information handbook", "handbook", "pdf"],
        "filename": "epfo_information_handbook_rti.pdf",
    },
    {
        "domain": "Employment",
        "authority": "EPFO",
        "title": "Composite Claim Form Aadhaar - Instructions",
        "doc_type": "form_instruction",
        "page_url": "https://www.epfindia.gov.in/site_en/For_Employees.php",
        "link_contains": ["composite claim", "aadhaar", "form 19"],
        "filename": "epfo_composite_claim_form_aadhaar.pdf",
    },

    # ── Consumer Protection ────────────────────────────────────
    {
        "domain": "Consumer Protection",
        "authority": "Government of India",
        "title": "Consumer Protection Act 2019",
        "doc_type": "regulation",
        "page_url": "https://consumeraffairs.gov.in/acts-and-rules/consumer-protection-act-2019",
        "link_contains": ["consumer protection act", "pdf", "download"],
        "filename": "consumer_protection_act_2019.pdf",
    },

    # ── Identity Documents ─────────────────────────────────────
    {
        "domain": "Identity Documents",
        "authority": "UIDAI",
        "title": "Aadhaar Enrolment and Update - Procedural Handbook",
        "doc_type": "handbook",
        "page_url": "https://uidai.gov.in/en/ecosystem/about-aadhaar/handbooks.html",
        "link_contains": ["handbook", "enrolment", "update", "pdf"],
        "filename": "uidai_enrolment_update_handbook.pdf",
    },
]

DOWNLOAD_DIR = Path("data/pdfs")
MANIFEST_PATH = Path("data/pdfs/manifest.json")


def load_manifest() -> dict:
    """Load existing manifest or return empty one."""
    if MANIFEST_PATH.exists():
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_manifest(manifest: dict):
    """Save manifest to disk."""
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)


def file_checksum(path: Path) -> str:
    """SHA256 checksum of a file."""
    sha256 = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


async def download_via_playwright(source: dict, dest: Path) -> bool:
    """
    Navigate to the listing page and click a PDF link to trigger download.
    Returns True if successful.
    """
    from playwright.async_api import async_playwright

    page_url = source.get("page_url")
    link_contains = [kw.lower() for kw in source.get("link_contains", [])]

    if not page_url:
        return False

    logger.info(f"[Playwright] Navigating to: {page_url}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
            accept_downloads=True,
        )
        page = await context.new_page()

        # Block images/media for speed
        await page.route("**/*.{png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,mp4,webm}",
                          lambda route: route.abort())

        try:
            await page.goto(page_url, wait_until="domcontentloaded", timeout=45000)
            try:
                await page.wait_for_load_state("networkidle", timeout=15000)
            except Exception:
                pass

            # Find all links on the page
            links = await page.query_selector_all("a[href]")

            download_link = None
            for link in links:
                href = (await link.get_attribute("href") or "").lower()
                text = (await link.inner_text()).lower().strip()
                combined = href + " " + text

                # Check if this link matches any of our keywords AND is a PDF
                is_pdf = ".pdf" in href or ".pdf" in text
                matches_keywords = any(kw in combined for kw in link_contains) if link_contains else True

                if is_pdf and matches_keywords:
                    download_link = link
                    logger.info(f"[Playwright] Found PDF link: {href[:80]}")
                    break

            # Fallback: find any PDF link on the page
            if not download_link:
                for link in links:
                    href = await link.get_attribute("href") or ""
                    if href.lower().endswith(".pdf"):
                        download_link = link
                        logger.warning(f"[Playwright] Using fallback PDF link: {href[:80]}")
                        break

            if not download_link:
                logger.error(f"[Playwright] No PDF link found on page: {page_url}")
                await browser.close()
                return False

            # Trigger download
            async with page.expect_download(timeout=60000) as download_info:
                await download_link.click()

            download = await download_info.value
            await download.save_as(str(dest))
            await browser.close()

            if dest.exists() and dest.stat().st_size > 1000:
                logger.info(f"[Playwright] Downloaded: {dest.name} ({dest.stat().st_size // 1024}KB)")
                return True
            else:
                logger.error(f"[Playwright] Download too small or missing: {dest}")
                return False

        except Exception as e:
            logger.error(f"[Playwright] Failed on {page_url}: {e}")
            await browser.close()
            return False


async def download_via_direct(url: str, dest: Path) -> bool:
    """
    Try direct URL download using httpx with browser-like headers.
    Works for some RBI / government document servers.
    """
    import httpx
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "application/pdf,application/octet-stream,*/*",
        "Accept-Language": "en-IN,en;q=0.9",
        "Referer": "https://www.google.com/",
    }
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=60) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            content = response.content
            if len(content) < 1000:
                raise ValueError(f"Response too small ({len(content)} bytes), likely blocked")
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(content)
            logger.info(f"[Direct] Downloaded: {dest.name} ({len(content) // 1024}KB)")
            return True
    except Exception as e:
        logger.warning(f"[Direct] Failed for {url}: {e}")
        return False


async def download_source(source: dict, force: bool = False) -> dict:
    """
    Download a single PDF source.
    Returns manifest entry dict.
    """
    filename = source["filename"]
    dest = DOWNLOAD_DIR / source["domain"].replace(" & ", "_").replace(" ", "_") / filename
    dest.parent.mkdir(parents=True, exist_ok=True)

    result = {
        "title": source["title"],
        "domain": source["domain"],
        "authority": source["authority"],
        "doc_type": source.get("doc_type", "information"),
        "local_path": str(dest),
        "status": "pending",
        "checksum": None,
        "downloaded_at": None,
        "file_size_kb": None,
    }
    if source.get("circular_number"):
        result["circular_number"] = source["circular_number"]

    # Skip if already exists and not forcing
    if dest.exists() and not force:
        result["status"] = "cached"
        result["checksum"] = file_checksum(dest)
        result["file_size_kb"] = dest.stat().st_size // 1024
        logger.info(f"[CACHE HIT] {filename}")
        return result

    success = False

    # 1. Try direct URL first (fastest)
    if source.get("direct_url"):
        success = await download_via_direct(source["direct_url"], dest)

    # 2. Fall back to Playwright click-download
    if not success and source.get("page_url"):
        success = await download_via_playwright(source, dest)

    if success and dest.exists():
        result["status"] = "downloaded"
        result["checksum"] = file_checksum(dest)
        result["downloaded_at"] = datetime.now(timezone.utc).isoformat()
        result["file_size_kb"] = dest.stat().st_size // 1024
    else:
        result["status"] = "failed"
        logger.error(f"[FAILED] Could not download: {source['title']}")

    return result


async def main(force: bool = False, domain_filter: Optional[str] = None):
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    manifest = load_manifest()

    sources = PDF_SOURCES
    if domain_filter:
        sources = [s for s in sources if domain_filter.lower() in s["domain"].lower()]
        print(f"[FILTER] Processing {len(sources)} sources for domain: {domain_filter}")

    print(f"\n[START] Downloading {len(sources)} PDF sources...")
    print("=" * 55)

    downloaded = 0
    cached = 0
    failed = 0

    for source in sources:
        filename = source["filename"]
        print(f"  [{source['domain']:20s}] {source['title'][:45]}...", end="", flush=True)
        result = await download_source(source, force=force)
        manifest[filename] = result

        if result["status"] == "downloaded":
            downloaded += 1
            print(f" [OK] {result['file_size_kb']}KB")
        elif result["status"] == "cached":
            cached += 1
            print(f" [CACHED] {result['file_size_kb']}KB")
        else:
            failed += 1
            print(f" [FAILED]")

        save_manifest(manifest)  # Save after each to be safe

    print("=" * 55)
    print(f"[DONE] Downloaded: {downloaded} | Cached: {cached} | Failed: {failed}")
    print(f"[NEXT] Run: python scripts/ingest_knowledge.py")
    print(f"[MANIFEST] {MANIFEST_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LifeFlow PDF Downloader")
    parser.add_argument("--force", action="store_true", help="Re-download even if cached")
    parser.add_argument("--domain", type=str, help="Filter to specific domain")
    args = parser.parse_args()
    asyncio.run(main(force=args.force, domain_filter=args.domain))
