
import sys
import os
sys.path.append(os.getcwd())

from app.services.knowledge.vector_db import get_vector_db
from app.services.llm.client import get_llm_client
import asyncio

async def test_search():
    print("Initialize VectorDB & LLMClient...")
    db = get_vector_db()
    llm = get_llm_client()
    
    query = "How do I update my Aadhaar address?"
    print(f"\nQuery: {query}")
    
    print("Generating embedding...")
    embedding = await llm.generate_embedding(query)
    
    print("Searching...")
    results = db.search(embedding, top_k=3)
    
    print(f"\nFound {len(results)} results:")
    for i, res in enumerate(results):
        print(f"\n[{i+1}] Score: {res.score:.4f}")
        print(f"Document: {res.metadata.get('title', 'Unknown')}")
        print(f"Content snippet: {res.content[:200]}...")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(test_search())
