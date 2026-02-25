from app.services.knowledge.vector_db import get_vector_db

db = get_vector_db()
stats = db.get_stats()

print("=== INDEX STATS ===")
print(f"Total Vectors : {stats['total_vectors']}")
print(f"Dimension     : {stats['dimension']}")
print(f"Total Chunks  : {stats['total_chunks']}")
print(f"Unique Docs   : {stats['unique_documents']}")
print()

print("=== CHUNK CONTENTS ===")
for i, (chunk_id, meta) in enumerate(db.metadata.items()):
    print(f"--- Chunk {i+1} (ID: {chunk_id}) ---")
    print(f"  Title     : {meta.get('title', 'N/A')}")
    print(f"  Domain    : {meta.get('domain', 'N/A')}")
    print(f"  Authority : {meta.get('source_authority', 'N/A')}")
    preview = meta.get('content', '')[:150]
    print(f"  Preview   : {preview}...")
    print()
