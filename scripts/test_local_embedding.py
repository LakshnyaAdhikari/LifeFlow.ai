
from sentence_transformers import SentenceTransformer
import time

print("Loading model...")
start = time.time()
model = SentenceTransformer('all-MiniLM-L6-v2')
print(f"Model loaded in {time.time() - start:.2f}s")

print("Generating embedding...")
embedding = model.encode("This is a test sentence.")
print(f"Embedding shape: {embedding.shape}")
print("Success!")
