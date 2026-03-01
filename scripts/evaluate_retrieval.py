import asyncio
import json
import os
import sys
from pathlib import Path

# Add project root to python path
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from colorama import init, Fore, Style
from app.services.knowledge.vector_db import get_vector_db
from app.services.llm.client import get_llm_client

init(autoreset=True)

async def run_evaluation():
    print(Fore.CYAN + "===============================================")
    print(Fore.CYAN + "   LifeFlow.ai V3 RAG Evaluation Framework     ")
    print(Fore.CYAN + "===============================================\n")

    eval_path = Path("tests/eval_queries.json")
    if not eval_path.exists():
        print(Fore.RED + "Error: tests/eval_queries.json not found.")
        return

    with open(eval_path, "r", encoding="utf-8") as f:
        queries = json.load(f)

    vector_db = get_vector_db()
    llm_client = get_llm_client()

    print(f"Loaded {len(queries)} queries for testing.\n")

    total_score = 0
    
    for idx, q_data in enumerate(queries, 1):
        query = q_data["query"]
        domain = q_data["domain"]
        expected_sources = set(q_data["expected_sources"])
        is_procedural = q_data["is_procedural"]

        print(Fore.YELLOW + f"Test {idx}/{len(queries)}: [{domain}] {query}")
        
        # 1. Generate Embedding
        query_embedding = await llm_client.generate_embedding(query)

        # 2. Retrieve top chunks using V3 Engine logic
        print("  Retrieving chunks...")
        results = vector_db.search(
            query_embedding=query_embedding,
            top_k=5,
            filter_metadata=None,
            alpha=0.5, # V3 parameter
            min_authority=0.0 # Just observe scores for now
        )

        if not results:
            print(Fore.RED + "  FAIL: No chunks retrieved.")
            continue

        # 3. Analyze Results
        retrieved_authorities = {r.source_authority for r in results}
        max_authority = max([r.metadata.get("authority_weight", 0.0) for r in results])
        avg_density = sum([r.metadata.get("procedural_density", 0.0) for r in results]) / len(results)
        
        # Check expected sources
        source_hit = False
        if expected_sources:
            if expected_sources.intersection(retrieved_authorities):
                source_hit = True
            else:
                source_hit = False
        else:
            source_hit = True # Procedural False test

        print(f"  Top Match Score : {results[0].score:.3f}")
        print(f"  Max Authority   : {max_authority}")
        print(f"  Avg Proc Density: {avg_density:.2f}")
        print(f"  Authorities Hit : {', '.join(retrieved_authorities)}")

        score = 0
        if source_hit:
            score += 1
            print(Fore.GREEN + "  [PASS] Expected authority retrieved.")
        else:
            print(Fore.RED + f"  [FAIL] Missing expected authorities: {expected_sources}")
            
        if is_procedural and max_authority >= 0.8:
            score += 1
            print(Fore.GREEN + "  [PASS] High-authority procedural chunks retrieved.")
        elif is_procedural:
            print(Fore.RED + "  [FAIL] Failed to retrieve high-authority constraint.")
        else:
            score += 1

        total_score += score
        print()

    print(Fore.CYAN + "===============================================")
    max_possible = len(queries) * 2
    pass_rate = (total_score / max_possible) * 100
    print(f"Overall Evaluation Score: {total_score}/{max_possible} ({pass_rate:.1f}%)")

if __name__ == "__main__":
    asyncio.run(run_evaluation())
