"""
Document Processors

Extract and clean text from various document formats
"""

import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from loguru import logger

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

from bs4 import BeautifulSoup


class ProcessedDocument(BaseModel):
    """Processed document with cleaned text"""
    title: str
    content: str
    metadata: Dict[str, Any]
    sections: List[Dict[str, str]] = []


class DocumentProcessor:
    """
    Base document processor
    """
    
    def process(self, raw_content: bytes, metadata: Dict[str, Any]) -> ProcessedDocument:
        """Process raw content into structured document"""
        raise NotImplementedError


class PDFProcessor(DocumentProcessor):
    """
    PDF document processor
    """
    
    def process(self, raw_content: bytes, metadata: Dict[str, Any]) -> ProcessedDocument:
        """Extract text from PDF"""
        if PyPDF2 is None:
            raise ImportError("PyPDF2 is required for PDF processing")
        
        try:
            import io
            pdf_file = io.BytesIO(raw_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            # Extract text from all pages
            text_parts = []
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            
            full_text = "\n\n".join(text_parts)
            
            # Clean text
            cleaned_text = self._clean_text(full_text)
            
            # Extract title (from metadata or first line)
            title = metadata.get("title", "")
            if not title and cleaned_text:
                title = cleaned_text.split("\n")[0][:200]
            
            logger.info(f"Processed PDF: {len(cleaned_text)} characters")
            
            return ProcessedDocument(
                title=title,
                content=cleaned_text,
                metadata={
                    **metadata,
                    "pages": len(pdf_reader.pages),
                    "source_type": "pdf"
                }
            )
        
        except Exception as e:
            logger.error(f"Failed to process PDF: {e}")
            raise
    
    def _clean_text(self, text: str) -> str:
        """Clean extracted text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove page numbers (common patterns)
        text = re.sub(r'Page \d+', '', text)
        text = re.sub(r'\d+\s*$', '', text, flags=re.MULTILINE)
        
        # Fix common PDF extraction issues
        text = text.replace('\x00', '')
        
        return text.strip()


class HTMLProcessor(DocumentProcessor):
    """
    HTML document processor
    """
    
    def process(self, raw_content: bytes, metadata: Dict[str, Any]) -> ProcessedDocument:
        """Extract text from HTML"""
        try:
            html = raw_content.decode('utf-8', errors='ignore')
            soup = BeautifulSoup(html, 'lxml')
            
            # Extract title
            title = metadata.get("title", "")
            if not title:
                title_tag = soup.find('title')
                if title_tag:
                    title = title_tag.get_text().strip()
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
            
            # Extract main content
            # Try to find main content area
            main_content = soup.find('main') or soup.find('article') or soup.find('body')
            
            if main_content:
                text = main_content.get_text(separator='\n', strip=True)
            else:
                text = soup.get_text(separator='\n', strip=True)
            
            # Clean text
            cleaned_text = self._clean_text(text)
            
            # Extract sections (h1, h2, h3)
            sections = self._extract_sections(soup)
            
            logger.info(f"Processed HTML: {len(cleaned_text)} characters, {len(sections)} sections")
            
            return ProcessedDocument(
                title=title,
                content=cleaned_text,
                metadata={
                    **metadata,
                    "source_type": "html"
                },
                sections=sections
            )
        
        except Exception as e:
            logger.error(f"Failed to process HTML: {e}")
            raise
    
    def _clean_text(self, text: str) -> str:
        """Clean extracted text"""
        # Remove excessive whitespace
        lines = [line.strip() for line in text.split('\n')]
        lines = [line for line in lines if line]
        
        text = '\n'.join(lines)
        
        return text.strip()
    
    def _extract_sections(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract sections with headers"""
        sections = []
        
        for header in soup.find_all(['h1', 'h2', 'h3']):
            header_text = header.get_text().strip()
            
            # Get content until next header
            content_parts = []
            for sibling in header.find_next_siblings():
                if sibling.name in ['h1', 'h2', 'h3']:
                    break
                content_parts.append(sibling.get_text().strip())
            
            if header_text:
                sections.append({
                    "header": header_text,
                    "level": header.name,
                    "content": '\n'.join(content_parts)
                })
        
        return sections


class TextChunker:
    """
    Chunk text into smaller segments for embedding
    """
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        min_chunk_size: int = 100
    ):
        """
        Initialize chunker
        
        Args:
            chunk_size: Target chunk size in characters
            chunk_overlap: Overlap between chunks
            min_chunk_size: Minimum chunk size
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
    
    def chunk_text(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Chunk text into segments
        
        Returns list of chunks with metadata
        """
        metadata = metadata or {}
        
        # Split by paragraphs first
        paragraphs = text.split('\n\n')
        
        chunks = []
        current_chunk = ""
        current_metadata = metadata.copy()
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            # If adding this paragraph exceeds chunk size, save current chunk
            if len(current_chunk) + len(para) > self.chunk_size and len(current_chunk) >= self.min_chunk_size:
                chunks.append({
                    "content": current_chunk.strip(),
                    "metadata": current_metadata.copy(),
                    "chunk_index": len(chunks)
                })
                
                # Start new chunk with overlap
                if self.chunk_overlap > 0:
                    # Take last N characters for overlap
                    overlap_text = current_chunk[-self.chunk_overlap:]
                    current_chunk = overlap_text + "\n\n" + para
                else:
                    current_chunk = para
            else:
                # Add to current chunk
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para
        
        # Add final chunk
        if current_chunk.strip() and len(current_chunk) >= self.min_chunk_size:
            chunks.append({
                "content": current_chunk.strip(),
                "metadata": current_metadata.copy(),
                "chunk_index": len(chunks)
            })
        
        logger.info(f"Chunked text into {len(chunks)} segments")
        return chunks
    
    def chunk_with_sections(
        self,
        sections: List[Dict[str, str]],
        base_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Chunk text preserving section boundaries
        """
        base_metadata = base_metadata or {}
        chunks = []
        
        for section in sections:
            header = section.get("header", "")
            content = section.get("content", "")
            
            # Add header to metadata
            section_metadata = {
                **base_metadata,
                "section_header": header,
                "section_level": section.get("level", "")
            }
            
            # Chunk section content
            section_chunks = self.chunk_text(content, section_metadata)
            chunks.extend(section_chunks)
        
        return chunks


def get_processor(source_type: str) -> DocumentProcessor:
    """Get appropriate processor for source type"""
    processors = {
        "pdf": PDFProcessor(),
        "html": HTMLProcessor(),
    }
    
    processor = processors.get(source_type.lower())
    if not processor:
        raise ValueError(f"No processor available for source type: {source_type}")
    
    return processor
