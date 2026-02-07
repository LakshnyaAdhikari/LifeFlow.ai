"""
Document Fetchers

Fetch documents from authoritative Indian government sources
"""

import httpx
import hashlib
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from loguru import logger
from datetime import datetime


class FetchedDocument(BaseModel):
    """Fetched document with metadata"""
    url: str
    content: bytes
    content_type: str
    title: str
    source_authority: str
    domain: str
    metadata: Dict[str, Any] = {}


class DocumentFetcher:
    """
    Base document fetcher
    """
    
    def __init__(self, authority: str, domain: str):
        self.authority = authority
        self.domain = domain
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True, verify=False)
    
    async def fetch(self, url: str, title: str, metadata: Optional[Dict[str, Any]] = None) -> FetchedDocument:
        """Fetch document from URL"""
        raise NotImplementedError
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


class UIDAIFetcher(DocumentFetcher):
    """
    Fetch documents from UIDAI (Aadhaar)
    """
    
    def __init__(self):
        super().__init__(authority="UIDAI", domain="Identity Documents")
    
    async def fetch(self, url: str, title: str, metadata: Optional[Dict[str, Any]] = None) -> FetchedDocument:
        """Fetch UIDAI document"""
        try:
            logger.info(f"Fetching UIDAI document: {title}")
            
            response = await self.client.get(url)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "").lower()
            
            return FetchedDocument(
                url=url,
                content=response.content,
                content_type=content_type,
                title=title,
                source_authority=self.authority,
                domain=self.domain,
                metadata={
                    **(metadata or {}),
                    "fetched_at": datetime.utcnow().isoformat(),
                    "content_length": len(response.content)
                }
            )
        
        except Exception as e:
            logger.error(f"Failed to fetch UIDAI document: {e}")
            raise
    
    def get_priority_documents(self) -> List[Dict[str, str]]:
        """Get list of priority documents to fetch"""
        return [
            {
                "url": "https://uidai.gov.in/en/ecosystem/authentication-devices-documents/qr-code-reader.html",
                "title": "Aadhaar QR Code Information",
                "description": "How to read and verify Aadhaar QR codes"
            },
            # Add more UIDAI documents here
            # Note: These are example URLs - actual URLs may need verification
        ]


class IRDAIFetcher(DocumentFetcher):
    """
    Fetch documents from IRDAI (Insurance)
    """
    
    def __init__(self):
        super().__init__(authority="IRDAI", domain="Insurance")
    
    async def fetch(self, url: str, title: str, metadata: Optional[Dict[str, Any]] = None) -> FetchedDocument:
        """Fetch IRDAI document"""
        try:
            logger.info(f"Fetching IRDAI document: {title}")
            
            response = await self.client.get(url)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "").lower()
            
            return FetchedDocument(
                url=url,
                content=response.content,
                content_type=content_type,
                title=title,
                source_authority=self.authority,
                domain=self.domain,
                metadata={
                    **(metadata or {}),
                    "fetched_at": datetime.utcnow().isoformat(),
                    "content_length": len(response.content)
                }
            )
        
        except Exception as e:
            logger.error(f"Failed to fetch IRDAI document: {e}")
            raise
    
    def get_priority_documents(self) -> List[Dict[str, str]]:
        """Get list of priority documents to fetch"""
        return [
            {
                "url": "https://www.irdai.gov.in/admincms/cms/frmGeneral_Layout.aspx?page=PageNo234",
                "title": "Insurance Ombudsman - Complaint Resolution",
                "description": "How to file complaints with Insurance Ombudsman"
            },
            # Add more IRDAI documents
        ]


class PassportSevaFetcher(DocumentFetcher):
    """
    Fetch documents from Passport Seva
    """
    
    def __init__(self):
        super().__init__(authority="Passport Seva", domain="Identity Documents")
    
    async def fetch(self, url: str, title: str, metadata: Optional[Dict[str, Any]] = None) -> FetchedDocument:
        """Fetch Passport Seva document"""
        try:
            logger.info(f"Fetching Passport Seva document: {title}")
            
            response = await self.client.get(url)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "").lower()
            
            return FetchedDocument(
                url=url,
                content=response.content,
                content_type=content_type,
                title=title,
                source_authority=self.authority,
                domain=self.domain,
                metadata={
                    **(metadata or {}),
                    "fetched_at": datetime.utcnow().isoformat(),
                    "content_length": len(response.content)
                }
            )
        
        except Exception as e:
            logger.error(f"Failed to fetch Passport Seva document: {e}")
            raise
    
    def get_priority_documents(self) -> List[Dict[str, str]]:
        """Get list of priority documents to fetch"""
        return [
            {
                "url": "https://www.passportindia.gov.in/AppOnlineProject/online/faqServlet",
                "title": "Passport Application FAQs",
                "description": "Frequently asked questions about passport applications"
            },
            # Add more Passport Seva documents
        ]


class IncomeTaxFetcher(DocumentFetcher):
    """
    Fetch documents from Income Tax Department
    """
    
    def __init__(self):
        super().__init__(authority="Income Tax Department", domain="Taxation")
    
    async def fetch(self, url: str, title: str, metadata: Optional[Dict[str, Any]] = None) -> FetchedDocument:
        """Fetch Income Tax document"""
        try:
            logger.info(f"Fetching Income Tax document: {title}")
            
            response = await self.client.get(url)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "").lower()
            
            return FetchedDocument(
                url=url,
                content=response.content,
                content_type=content_type,
                title=title,
                source_authority=self.authority,
                domain=self.domain,
                metadata={
                    **(metadata or {}),
                    "fetched_at": datetime.utcnow().isoformat(),
                    "content_length": len(response.content)
                }
            )
        
        except Exception as e:
            logger.error(f"Failed to fetch Income Tax document: {e}")
            raise
    
    def get_priority_documents(self) -> List[Dict[str, str]]:
        """Get list of priority documents to fetch"""
        return [
            {
                "url": "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1",
                "title": "Which ITR Form to File",
                "description": "Guide to choosing the correct ITR form"
            },
            # Add more Income Tax documents
        ]


class ParivahanFetcher(DocumentFetcher):
    """
    Fetch documents from Parivahan (Transport)
    """
    
    def __init__(self):
        super().__init__(authority="Parivahan", domain="Vehicle & Transport")
    
    async def fetch(self, url: str, title: str, metadata: Optional[Dict[str, Any]] = None) -> FetchedDocument:
        """Fetch Parivahan document"""
        try:
            logger.info(f"Fetching Parivahan document: {title}")
            
            response = await self.client.get(url)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "").lower()
            
            return FetchedDocument(
                url=url,
                content=response.content,
                content_type=content_type,
                title=title,
                source_authority=self.authority,
                domain=self.domain,
                metadata={
                    **(metadata or {}),
                    "fetched_at": datetime.utcnow().isoformat(),
                    "content_length": len(response.content)
                }
            )
        
        except Exception as e:
            logger.error(f"Failed to fetch Parivahan document: {e}")
            raise
    
    def get_priority_documents(self) -> List[Dict[str, str]]:
        """Get list of priority documents to fetch"""
        return [
            {
                "url": "https://parivahan.gov.in/parivahan/en/content/driving-licence",
                "title": "Driving License Information",
                "description": "How to apply for and renew driving license"
            },
            # Add more Parivahan documents
        ]


class GenericFetcher(DocumentFetcher):
    """
    Generic document fetcher for other authorities
    """
    
    def __init__(self, authority: str, domain: str = "General"):
        super().__init__(authority=authority, domain=domain)
    
    async def fetch(self, url: str, title: str, metadata: Optional[Dict[str, Any]] = None) -> FetchedDocument:
        """Fetch document generically"""
        try:
            logger.info(f"Fetching document from {self.authority}: {title}")
            
            # Add user agent to avoid blocking
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            
            response = await self.client.get(url, headers=headers)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "").lower()
            
            return FetchedDocument(
                url=url,
                content=response.content,
                content_type=content_type,
                title=title,
                source_authority=self.authority,
                domain=self.domain,
                metadata={
                    **(metadata or {}),
                    "fetched_at": datetime.utcnow().isoformat(),
                    "content_length": len(response.content)
                }
            )
        
        except Exception as e:
            logger.error(f"Failed to fetch document from {self.authority}: {e}")
            raise

def get_fetcher(authority: str) -> DocumentFetcher:
    """Get fetcher for authority"""
    fetchers = {
        "UIDAI": UIDAIFetcher,
        "IRDAI": IRDAIFetcher,
        "Passport Seva": PassportSevaFetcher,
        "Income Tax": IncomeTaxFetcher,
        "Parivahan": ParivahanFetcher,
    }
    
    fetcher_class = fetchers.get(authority)
    if fetcher_class:
        return fetcher_class()
    
    # Return generic fetcher for others
    logger.info(f"Using generic fetcher for authority: {authority}")
    return GenericFetcher(authority=authority)
