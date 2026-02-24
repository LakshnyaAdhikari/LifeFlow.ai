"""
Document Processors

Extract and clean text from various document formats.
Implements GPT-advised architecture:
  - PDF chunk size: 1500 chars, 250 overlap (denser legal text)
  - HTML chunk size: 1000 chars, 200 overlap (lighter web content)
  - Authority weight metadata on every chunk
  - Rich metadata: doc_type, circular_number, version_date, jurisdiction
"""

import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from loguru import logger

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

from bs4 import BeautifulSoup


# ─────────────────────────────────────────────
# Authority weight registry
# Higher = more authoritative = ranked first in retrieval
# ─────────────────────────────────────────────
AUTHORITY_WEIGHTS: Dict[str, float] = {
    # Tier 1 — Primary regulatory authority
    "IRDAI": 1.5,
    "RBI": 1.5,
    "Income Tax Department": 1.5,
    "UIDAI": 1.5,
    "EPFO": 1.5,
    "MCA": 1.5,
    "GST Council": 1.4,
    "CBIC": 1.4,
    "Passport Seva": 1.4,
    "Election Commission of India": 1.4,
    "Parivahan": 1.3,
    "Dept of Land Resources": 1.3,
    "Labour Ministry": 1.3,
    # Tier 2 — Consumer/citizen portals backed by regulation
    "NCDRC": 1.2,
    "CCPA": 1.2,
    "NHB": 1.2,
    # Default
    "Government of India": 1.0,
}

def get_authority_weight(authority: str) -> float:
    """Return authority weight; defaults to 1.0 for unknown authorities."""
    return AUTHORITY_WEIGHTS.get(authority, 1.0)


# ─────────────────────────────────────────────
# Document type classifier
# ─────────────────────────────────────────────
def classify_doc_type(title: str) -> str:
    """
    Classify document type based on title keywords.
    Used for retrieval filtering and scoring.
    """
    title_lower = title.lower()
    if any(w in title_lower for w in ["master circular", "circular"]):
        return "master_circular"
    if any(w in title_lower for w in ["scheme", "regulation", "act", "rules"]):
        return "regulation"
    if any(w in title_lower for w in ["handbook", "manual", "guide", "procedure"]):
        return "handbook"
    if any(w in title_lower for w in ["faq", "frequently asked"]):
        return "faq"
    if any(w in title_lower for w in ["form", "application"]):
        return "form_instruction"
    return "information"


class ProcessedDocument(BaseModel):
    """Processed document with cleaned text"""
    title: str
    content: str
    metadata: Dict[str, Any]
    sections: List[Dict[str, str]] = []


class DocumentProcessor:
    """Base document processor"""

    def process(self, raw_content: bytes, metadata: Dict[str, Any]) -> ProcessedDocument:
        """Process raw content into structured document"""
        raise NotImplementedError


class PDFProcessor(DocumentProcessor):
    """
    PDF document processor.
    Uses pdfplumber (primary) → PyPDF2 (fallback).
    Extracts text page by page, with page number metadata.
    """

    def process(self, raw_content: bytes, metadata: Dict[str, Any]) -> ProcessedDocument:
        """Extract text from PDF using pdfplumber → PyPDF2 fallback"""
        title = metadata.get("title", "Untitled PDF")
        authority = metadata.get("authority", "Unknown")

        # Enrich metadata
        enriched_metadata = {
            **metadata,
            "source_type": "pdf",
            "doc_type": classify_doc_type(title),
            "authority_weight": get_authority_weight(authority),
            "accessed_on": metadata.get("fetched_at", ""),
        }

        # --- Try pdfplumber first (better for structured/table-heavy PDFs) ---
        if pdfplumber is not None:
            try:
                import io
                text_parts = []
                with pdfplumber.open(io.BytesIO(raw_content)) as pdf:
                    enriched_metadata["pages"] = len(pdf.pages)
                    for i, page in enumerate(pdf.pages):
                        text = page.extract_text()
                        if text and text.strip():
                            text_parts.append(f"[Page {i+1}]\n{text.strip()}")

                full_text = "\n\n".join(text_parts)
                cleaned = self._clean_text(full_text)

                if len(cleaned) > 200:
                    logger.info(f"[PDFProcessor/pdfplumber] {len(cleaned)} chars, {len(pdf.pages)} pages: '{title}'")
                    return ProcessedDocument(
                        title=title,
                        content=cleaned,
                        metadata=enriched_metadata
                    )
                logger.warning(f"[PDFProcessor/pdfplumber] Output too short ({len(cleaned)} chars), trying PyPDF2")
            except Exception as e:
                logger.warning(f"[PDFProcessor/pdfplumber] Failed: {e}, trying PyPDF2")

        # --- PyPDF2 fallback ---
        if PyPDF2 is not None:
            try:
                import io
                pdf_file = io.BytesIO(raw_content)
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                enriched_metadata["pages"] = len(pdf_reader.pages)

                text_parts = []
                for i, page in enumerate(pdf_reader.pages):
                    text = page.extract_text()
                    if text:
                        text_parts.append(f"[Page {i+1}]\n{text.strip()}")

                full_text = "\n\n".join(text_parts)
                cleaned = self._clean_text(full_text)
                logger.info(f"[PDFProcessor/PyPDF2] {len(cleaned)} chars: '{title}'")
                return ProcessedDocument(
                    title=title,
                    content=cleaned,
                    metadata=enriched_metadata
                )
            except Exception as e:
                logger.error(f"[PDFProcessor/PyPDF2] Also failed: {e}")
                raise

        raise ImportError("Neither pdfplumber nor PyPDF2 is installed.")

    def _clean_text(self, text: str) -> str:
        """Clean PDF extracted text"""
        # Normalize whitespace but preserve paragraph breaks
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        # Remove stray page number lines (e.g., lone digits)
        text = re.sub(r'(?m)^\s*\d+\s*$', '', text)
        text = text.replace('\x00', '')
        return text.strip()


class HTMLProcessor(DocumentProcessor):
    """
    HTML document processor.
    Handles both raw HTML bytes and plain-text bytes (from Playwright).
    """

    def process(self, raw_content: bytes, metadata: Dict[str, Any]) -> ProcessedDocument:
        """Extract text from HTML or plain-text content"""
        title = metadata.get("title", "")
        authority = metadata.get("authority", "Unknown")
        content_type = metadata.get("content_type", "")

        enriched_metadata = {
            **metadata,
            "source_type": "html",
            "doc_type": classify_doc_type(title),
            "authority_weight": get_authority_weight(authority),
            "accessed_on": metadata.get("fetched_at", ""),
        }

        try:
            # Playwright returns plain text; detect via content_type flag
            if "source=playwright" in content_type or "text/plain" in content_type:
                text = raw_content.decode("utf-8", errors="ignore")
                cleaned_text = self._clean_plain_text(text)
                sections = []
            else:
                html = raw_content.decode("utf-8", errors="ignore")
                soup = BeautifulSoup(html, "lxml")

                if not title:
                    title_tag = soup.find("title")
                    if title_tag:
                        title = title_tag.get_text().strip()

                # Remove boilerplate
                for tag in soup(["script", "style", "nav", "footer", "header",
                                  ".breadcrumb", "[aria-hidden]"]):
                    tag.decompose()

                main_content = soup.find("main") or soup.find("article") or soup.find("body")
                raw_text = main_content.get_text(separator="\n", strip=True) if main_content else soup.get_text(separator="\n", strip=True)
                cleaned_text = self._clean_html_text(raw_text)
                sections = self._extract_sections(soup)

            enriched_metadata["source_type"] = "html"
            logger.info(f"[HTMLProcessor] {len(cleaned_text)} chars, '{title}'")

            return ProcessedDocument(
                title=title,
                content=cleaned_text,
                metadata=enriched_metadata,
                sections=sections
            )

        except Exception as e:
            logger.error(f"[HTMLProcessor] Failed: {e}")
            raise

    def _clean_html_text(self, text: str) -> str:
        lines = [line.strip() for line in text.split("\n")]
        lines = [line for line in lines if line and len(line) > 2]
        return "\n".join(lines).strip()

    def _clean_plain_text(self, text: str) -> str:
        lines = [line.strip() for line in text.split("\n")]
        lines = [line for line in lines if line and len(line) > 2]
        # Remove duplicate consecutive lines (common in scraped content)
        deduped = []
        for line in lines:
            if not deduped or line != deduped[-1]:
                deduped.append(line)
        return "\n".join(deduped).strip()

    def _extract_sections(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        sections = []
        for header in soup.find_all(["h1", "h2", "h3"]):
            header_text = header.get_text().strip()
            content_parts = []
            for sibling in header.find_next_siblings():
                if sibling.name in ["h1", "h2", "h3"]:
                    break
                content_parts.append(sibling.get_text().strip())
            if header_text:
                sections.append({
                    "header": header_text,
                    "level": header.name,
                    "content": "\n".join(content_parts)
                })
        return sections


class TextChunker:
    """
    Adaptive text chunker.
    Uses larger chunks for PDFs (denser legal text) and smaller for HTML.
    Every chunk carries authority_weight for downstream retrieval scoring.
    """

    # Recommended settings per source type
    SETTINGS = {
        "pdf":  {"chunk_size": 1500, "overlap": 250},
        "html": {"chunk_size": 1000, "overlap": 200},
        "text": {"chunk_size": 1000, "overlap": 200},
    }

    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        min_chunk_size: int = 100
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size

    @classmethod
    def for_source_type(cls, source_type: str) -> "TextChunker":
        """Factory: get a chunker tuned for the source type."""
        settings = cls.SETTINGS.get(source_type.lower(), cls.SETTINGS["html"])
        return cls(
            chunk_size=settings["chunk_size"],
            chunk_overlap=settings["overlap"]
        )

    def chunk_text(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Chunk text into segments. Authority weight is propagated to every chunk.
        """
        metadata = metadata or {}
        authority_weight = metadata.get("authority_weight", 1.0)

        # Split by paragraphs first
        paragraphs = text.split("\n\n")

        chunks = []
        current_chunk = ""

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            if len(current_chunk) + len(para) > self.chunk_size and len(current_chunk) >= self.min_chunk_size:
                chunk_meta = {**metadata, "chunk_index": len(chunks), "authority_weight": authority_weight}
                chunks.append({
                    "content": current_chunk.strip(),
                    "metadata": chunk_meta
                })
                # Overlap: carry last N chars into next chunk
                overlap_text = current_chunk[-self.chunk_overlap:] if self.chunk_overlap > 0 else ""
                current_chunk = (overlap_text + "\n\n" + para).strip()
            else:
                current_chunk = (current_chunk + "\n\n" + para).strip() if current_chunk else para

        if current_chunk.strip() and len(current_chunk) >= self.min_chunk_size:
            chunk_meta = {**metadata, "chunk_index": len(chunks), "authority_weight": authority_weight}
            chunks.append({
                "content": current_chunk.strip(),
                "metadata": chunk_meta
            })

        logger.info(f"Chunked into {len(chunks)} segments (size={self.chunk_size}, overlap={self.chunk_overlap})")
        return chunks

    def chunk_with_sections(
        self,
        sections: List[Dict[str, str]],
        base_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Chunk text preserving section boundaries."""
        base_metadata = base_metadata or {}
        chunks = []
        for section in sections:
            header = section.get("header", "")
            content = section.get("content", "")
            section_metadata = {
                **base_metadata,
                "section_header": header,
                "section_level": section.get("level", "")
            }
            section_chunks = self.chunk_text(content, section_metadata)
            chunks.extend(section_chunks)
        return chunks


def get_processor(source_type: str) -> DocumentProcessor:
    """Get appropriate processor for source type"""
    processors = {
        "pdf":  PDFProcessor(),
        "html": HTMLProcessor(),
        "text": HTMLProcessor(),  # plain text also goes through HTMLProcessor
    }
    processor = processors.get(source_type.lower())
    if not processor:
        raise ValueError(f"No processor available for source type: {source_type}")
    return processor
