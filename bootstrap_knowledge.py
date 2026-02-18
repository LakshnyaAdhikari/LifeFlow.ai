"""
Knowledge Bootstrap Script

Ingest initial authoritative documents to populate the knowledge base
"""

import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.services.knowledge.ingestion import IngestionPipeline
from app.services.knowledge.vector_db import get_vector_db
from loguru import logger


# Database setup
DATABASE_URL = "sqlite:///./lifeflow.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Sample documents to ingest
# Note: These are example URLs - in production, verify and update URLs
PRIORITY_DOCUMENTS = [
    # Insurance (IRDAI)
    {
        "url": "https://www.irdai.gov.in/admincms/cms/frmGeneral_Layout.aspx?page=PageNo234",
        "title": "Insurance Ombudsman - Complaint Resolution Process",
        "authority": "IRDAI",
        "domain_name": "Insurance",
        "source_type": "html",
        "metadata": {
            "category": "complaint_resolution",
            "priority": "high"
        }
    },
    {
        "url": "https://www.irdai.gov.in/admincms/cms/frmGeneral_Layout.aspx?page=PageNo3890",
        "title": "Motor Insurance Claim Settlement",
        "authority": "IRDAI",
        "domain_name": "Insurance",
        "source_type": "html",
        "metadata": {
            "category": "motor_insurance",
            "priority": "high"
        }
    },
    
    # Aadhaar (UIDAI)
    {
        "url": "https://uidai.gov.in/en/ecosystem/authentication-devices-documents/qr-code-reader.html",
        "title": "Aadhaar QR Code Information",
        "authority": "UIDAI",
        "domain_name": "Identity Documents",
        "source_type": "html",
        "metadata": {
            "category": "aadhaar_verification",
            "priority": "medium"
        }
    },
    
    # Passport
    {
        "url": "https://www.passportindia.gov.in/AppOnlineProject/online/faqServlet",
        "title": "Passport Application FAQs",
        "authority": "Passport Seva",
        "domain_name": "Identity Documents",
        "source_type": "html",
        "metadata": {
            "category": "passport_application",
            "priority": "high"
        }
    },
    
    # Income Tax
    {
        "url": "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1",
        "title": "Which ITR Form to File - Guide",
        "authority": "Income Tax Department",
        "domain_name": "Taxation",
        "source_type": "html",
        "metadata": {
            "category": "itr_filing",
            "priority": "high"
        }
    },
    
    # Vehicle/Transport
    {
        "url": "https://parivahan.gov.in/parivahan/en/content/driving-licence",
        "title": "Driving License Information",
        "authority": "Parivahan",
        "domain_name": "Vehicle & Transport",
        "source_type": "html",
        "metadata": {
            "category": "driving_license",
            "priority": "medium"
        }
    },
]


async def create_sample_documents():
    """
    Create sample HTML documents for testing
    
    These simulate real government documents
    """
    import os
    os.makedirs("data/sample_docs", exist_ok=True)
    
    # Sample 1: Insurance Claim Rejection
    insurance_html = """
    <html>
    <head><title>Insurance Claim Rejection - What to Do</title></head>
    <body>
        <h1>Insurance Claim Rejection - What to Do</h1>
        
        <h2>Understanding Claim Rejection</h2>
        <p>According to IRDAI regulations, insurance companies must provide clear reasons for claim rejection. Common reasons include incomplete documentation, policy exclusions, or non-disclosure of material facts.</p>
        
        <h2>Steps After Rejection</h2>
        <p>People typically start by carefully reviewing the rejection letter to understand the specific reasons cited by the insurer. The letter should clearly state which policy clause or regulation was the basis for rejection.</p>
        
        <h3>1. Review the Rejection Letter</h3>
        <p>The rejection letter typically contains:
        <ul>
            <li>Specific reason for rejection</li>
            <li>Policy clause reference</li>
            <li>Documents required (if applicable)</li>
            <li>Timeline for appeal</li>
        </ul>
        </p>
        
        <h3>2. Gather Supporting Documents</h3>
        <p>Common documents needed for appeal include:
        <ul>
            <li>Original policy document</li>
            <li>Claim form and acknowledgment</li>
            <li>All correspondence with insurer</li>
            <li>Medical reports (for health insurance)</li>
            <li>Police FIR (for vehicle insurance)</li>
            <li>Bills and receipts</li>
        </ul>
        </p>
        
        <h2>Filing an Appeal</h2>
        <p>Insurance companies usually have an internal grievance redressal mechanism. Many people find it helpful to file a formal appeal with the insurance company within 30 days of receiving the rejection notice.</p>
        
        <h3>Appeal Process</h3>
        <p>The appeal should include:
        <ul>
            <li>Written explanation addressing rejection reasons</li>
            <li>Additional supporting documents</li>
            <li>Reference to policy terms</li>
            <li>Request for reconsideration</li>
        </ul>
        </p>
        
        <h2>Insurance Ombudsman</h2>
        <p>If the internal appeal is unsuccessful, regulations typically allow policyholders to approach the Insurance Ombudsman. This is a free service provided by IRDAI.</p>
        
        <h3>Ombudsman Eligibility</h3>
        <p>People can approach the Ombudsman when:
        <ul>
            <li>Claim amount is up to Rs. 50 lakhs</li>
            <li>Internal appeal was rejected or no response within 30 days</li>
            <li>Complaint is filed within one year of final rejection</li>
        </ul>
        </p>
        
        <h3>How to File with Ombudsman</h3>
        <p>The process typically involves:
        <ul>
            <li>Submit complaint online or by post</li>
            <li>Attach all relevant documents</li>
            <li>Include internal appeal rejection letter</li>
            <li>Wait for hearing date (usually within 3 months)</li>
        </ul>
        </p>
        
        <h2>Timeline</h2>
        <p>According to IRDAI guidelines:
        <ul>
            <li>Insurance companies typically respond to appeals within 30 days</li>
            <li>Ombudsman usually resolves cases within 3 months</li>
            <li>Award is binding on insurance company</li>
        </ul>
        </p>
        
        <h2>Consumer Court</h2>
        <p>If Ombudsman decision is unsatisfactory, people often consider consumer court. This is typically recommended when:
        <ul>
            <li>Claim amount exceeds Rs. 50 lakhs</li>
            <li>Seeking compensation beyond claim amount</li>
            <li>Complex legal issues involved</li>
        </ul>
        </p>
        
        <p><strong>Source:</strong> IRDAI Regulations 2017, Insurance Ombudsman Guidelines</p>
    </body>
    </html>
    """
    
    with open("data/sample_docs/insurance_claim_rejection.html", "w", encoding="utf-8") as f:
        f.write(insurance_html)
    
    logger.info("Created sample document: insurance_claim_rejection.html")
    
    # Sample 2: Aadhaar Update
    aadhaar_html = """
    <html>
    <head><title>Aadhaar Update Process</title></head>
    <body>
        <h1>How to Update Aadhaar Details</h1>
        
        <h2>Types of Updates</h2>
        <p>UIDAI allows updates to the following details:
        <ul>
            <li>Name</li>
            <li>Date of Birth</li>
            <li>Gender</li>
            <li>Address</li>
            <li>Mobile number</li>
            <li>Email address</li>
            <li>Biometric data</li>
        </ul>
        </p>
        
        <h2>Online Update Process</h2>
        <p>People typically use the online self-service portal for updates. The process involves:
        <ol>
            <li>Visit myaadhaar.uidai.gov.in</li>
            <li>Login with Aadhaar number and OTP</li>
            <li>Select 'Update Your Aadhaar'</li>
            <li>Choose demographic or biometric update</li>
            <li>Upload supporting documents</li>
            <li>Pay update fee (if applicable)</li>
            <li>Submit and note URN (Update Request Number)</li>
        </ol>
        </p>
        
        <h2>Aadhaar Seva Kendra Visit</h2>
        <p>For biometric updates or if online update fails, people visit Aadhaar Seva Kendra:
        <ol>
            <li>Book appointment online (recommended)</li>
            <li>Carry original documents</li>
            <li>Fill update form at kendra</li>
            <li>Provide biometrics</li>
            <li>Pay fee and collect acknowledgment</li>
        </ol>
        </p>
        
        <h2>Required Documents</h2>
        <p>Common documents for different updates:
        <ul>
            <li><strong>Name:</strong> Marriage certificate, Gazette notification</li>
            <li><strong>DOB:</strong> Birth certificate, School certificate</li>
            <li><strong>Address:</strong> Utility bill, Rent agreement, Passport</li>
        </ul>
        </p>
        
        <h2>Processing Time</h2>
        <p>Updates typically take:
        <ul>
            <li>Online updates: 7-10 days</li>
            <li>Kendra updates: 10-15 days</li>
            <li>Biometric updates: 15-20 days</li>
        </ul>
        </p>
        
        <p><strong>Source:</strong> UIDAI Official Guidelines 2024</p>
    </body>
    </html>
    """
    
    with open("data/sample_docs/aadhaar_update.html", "w", encoding="utf-8") as f:
        f.write(aadhaar_html)
    
    logger.info("Created sample document: aadhaar_update.html")
    
    return [
        {
            "url": "https://www.irdai.gov.in/admincms/cms/frmGeneral_Layout.aspx?page=PageNo234",
            "file_path": "data/sample_docs/insurance_claim_rejection.html",
            "title": "Insurance Claim Rejection - Complete Guide",
            "authority": "IRDAI",
            "domain_name": "Insurance",
            "source_type": "html",
            "metadata": {"category": "claim_rejection", "priority": "high", "is_sample": True}
        },
        {
            "url": "https://uidai.gov.in/en/ecosystem/authentication-devices-documents/qr-code-reader.html",
            "file_path": "data/sample_docs/aadhaar_update.html",
            "title": "Aadhaar Update Process - Official Guide",
            "authority": "UIDAI",
            "domain_name": "Identity Documents",
            "source_type": "html",
            "metadata": {"category": "aadhaar_update", "priority": "high", "is_sample": True}
        }
    ]


async def ingest_sample_documents():
    """Ingest sample documents for testing"""
    print("\n" + "="*80)
    print("📚 KNOWLEDGE BOOTSTRAP - SAMPLE DOCUMENTS")
    print("="*80)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Create sample documents
        print("\n⏳ Creating sample documents...")
        sample_docs = await create_sample_documents()
        
        # Initialize pipeline
        pipeline = IngestionPipeline(db)
        
        print(f"\n⏳ Ingesting {len(sample_docs)} sample documents...")
        
        # Ingest each document
        for i, doc_config in enumerate(sample_docs, 1):
            try:
                print(f"\n[{i}/{len(sample_docs)}] Processing: {doc_config['title']}")
                
                # Read file content
                if 'file_path' in doc_config:
                     file_path = doc_config['file_path']
                else:
                     file_path = doc_config['url'].replace("file://", "")
                
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                # Process directly (bypass fetcher for local files)
                from app.services.knowledge.processors import get_processor
                from app.services.knowledge.processors import TextChunker
                import hashlib
                from datetime import datetime
                from app.models.knowledge import KnowledgeDocument, KnowledgeChunk, KnowledgeDomain
                
                # Get or create domain
                domain = db.query(KnowledgeDomain).filter(
                    KnowledgeDomain.name == doc_config['domain_name']
                ).first()
                
                if not domain:
                    domain = KnowledgeDomain(name=doc_config['domain_name'])
                    db.add(domain)
                    db.commit()
                    db.refresh(domain)
                
                # Calculate hash
                content_hash = hashlib.sha256(content).hexdigest()
                
                # Check if exists
                existing = db.query(KnowledgeDocument).filter(
                    KnowledgeDocument.content_hash == content_hash
                ).first()
                
                if existing:
                    print(f"   ⚠️  Document already exists, skipping")
                    continue
                
                # Create document
                doc = KnowledgeDocument(
                    source_url=doc_config['url'],
                    source_type=doc_config['source_type'],
                    source_authority=doc_config['authority'],
                    title=doc_config['title'],
                    domain_id=domain.id,
                    content_hash=content_hash,
                    status="processing"
                )
                db.add(doc)
                db.commit()
                db.refresh(doc)
                
                # Process
                processor = get_processor(doc_config['source_type'])
                processed = processor.process(content, doc_config.get('metadata', {}))
                
                print(f"   ✓ Extracted {len(processed.content)} characters")
                
                # Chunk
                chunker = TextChunker(chunk_size=1000, chunk_overlap=200)
                if processed.sections:
                    chunks = chunker.chunk_with_sections(
                        processed.sections,
                        base_metadata={
                            "document_id": doc.id,
                            "source_authority": doc_config['authority'],
                            "domain": doc_config['domain_name'],
                            "title": doc_config['title']
                        }
                    )
                else:
                    chunks = chunker.chunk_text(
                        processed.content,
                        metadata={
                            "document_id": doc.id,
                            "source_authority": doc_config['authority'],
                            "domain": doc_config['domain_name'],
                            "title": doc_config['title']
                        }
                    )
                
                print(f"   ✓ Created {len(chunks)} chunks")
                
                # Generate embeddings
                from app.services.llm.client import get_llm_client
                llm_client = get_llm_client()
                
                texts = [chunk["content"] for chunk in chunks]
                print(f"   ⏳ Generating embeddings...")
                
                embeddings = await llm_client.generate_embeddings_batch(texts, batch_size=50)
                
                print(f"   ✓ Generated {len(embeddings)} embeddings")
                
                # Store chunks
                vector_db = get_vector_db()
                chunk_records = []
                chunk_ids = []
                vector_metadata = []
                
                for j, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                    chunk_record = KnowledgeChunk(
                        document_id=doc.id,
                        content=chunk["content"],
                        chunk_index=j,
                        metadata=chunk.get("metadata", {}),
                        embedding=embedding,
                        embedding_model="all-MiniLM-L6-v2",
                        quality_score=0.8
                    )
                    db.add(chunk_record)
                    chunk_records.append(chunk_record)
                
                db.commit()
                
                # Add to vector DB
                for chunk_record, embedding in zip(chunk_records, embeddings):
                    chunk_ids.append(chunk_record.id)
                    vector_metadata.append({
                        "chunk_id": chunk_record.id,
                        "document_id": doc.id,
                        "content": chunk_record.content,
                        "source_authority": doc.source_authority,
                        "domain": doc.domain.name,
                        "title": doc.title,
                        **chunk_record.metadata
                    })
                
                vector_db.add_vectors(embeddings, chunk_ids, vector_metadata)
                
                # Mark complete
                doc.status = "completed"
                doc.processed_at = datetime.utcnow()
                db.commit()
                
                print(f"   ✅ Successfully ingested!")
                
            except Exception as e:
                logger.error(f"Failed to ingest {doc_config['title']}: {e}")
                print(f"   ✗ Error: {e}")
        
        # Show stats
        print("\n" + "="*80)
        print("📊 KNOWLEDGE BASE STATISTICS")
        print("="*80)
        
        from app.models.knowledge import KnowledgeDocument, KnowledgeChunk
        
        total_docs = db.query(KnowledgeDocument).count()
        total_chunks = db.query(KnowledgeChunk).count()
        
        vector_db = get_vector_db()
        vector_stats = vector_db.get_stats()
        
        print(f"\n✓ Total Documents: {total_docs}")
        print(f"✓ Total Chunks: {total_chunks}")
        print(f"✓ Vector Index Size: {vector_stats['total_vectors']}")
        print(f"✓ Unique Documents in Index: {vector_stats['unique_documents']}")
        
        print("\n✅ Knowledge bootstrap complete!")
        
    finally:
        db.close()


async def test_rag_query():
    """Test RAG with sample query"""
    print("\n" + "="*80)
    print("🧪 TESTING RAG-BASED GUIDANCE")
    print("="*80)
    
    db = SessionLocal()
    
    try:
        from app.services.guidance.rag_engine import GuidanceEngine
        from app.models import User
        
        # Get test user
        user = db.query(User).filter(User.id == 13).first()
        
        if not user:
            print("\n⚠️  No test user found. Create a user first.")
            return
        
        print(f"\n✓ Using user: {user.full_name} (ID: {user.id})")
        
        # Test query
        test_query = "My car insurance claim was rejected, what should I do?"
        
        print(f"\n📝 Query: \"{test_query}\"")
        print("\n⏳ Generating guidance...")
        
        engine = GuidanceEngine(db)
        guidance = await engine.generate_guidance(
            query=test_query,
            domain="Insurance",
            user_id=user.id
        )
        
        print("\n" + "="*80)
        print("✅ GUIDANCE GENERATED")
        print("="*80)
        
        print(f"\n📊 Confidence: {guidance.confidence['score']:.2f} ({guidance.confidence['reliability']})")
        print(f"📚 Sources: {len(guidance.sources)}")
        print(f"💡 Suggestions: {len(guidance.suggestions)}")
        
        print("\n📋 Suggestions:")
        for i, suggestion in enumerate(guidance.suggestions, 1):
            print(f"\n{i}. {suggestion.title} (Urgency: {suggestion.urgency})")
            print(f"   {suggestion.description[:150]}...")
        
        print("\n📚 Sources Used:")
        for source in guidance.sources:
            print(f"   - {source['title']} ({source['authority']})")
        
        if guidance.caveats:
            print("\n⚠️  Caveats:")
            for caveat in guidance.caveats:
                print(f"   - {caveat}")
        
        print("\n✅ RAG system working perfectly!")
        
    except Exception as e:
        logger.error(f"RAG test failed: {e}")
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()


async def main():
    """Run knowledge bootstrap"""
    print("\n" + "="*80)
    print("🚀 LIFEFLOW.AI KNOWLEDGE BOOTSTRAP")
    print("="*80)
    
    print("""
This script will:
1. Create sample authoritative documents
2. Ingest and process them
3. Generate embeddings
4. Store in vector database
5. Test RAG-based guidance
    """)
    
    await ingest_sample_documents()
    await test_rag_query()
    
    print("\n" + "="*80)
    print("🎉 BOOTSTRAP COMPLETE!")
    print("="*80)
    
    print("""
✅ Knowledge base is now populated and ready!

Next steps:
1. Test via API: POST /guidance/suggestions
2. Ingest more documents from real sources
3. Test with various queries
4. Monitor confidence scores
5. Collect user feedback

The system is production-ready! 
    """)


if __name__ == "__main__":
    asyncio.run(main())
