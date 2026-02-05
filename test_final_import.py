"""
Final test to understand the import sequence
"""
import sys

print("=" * 80)
print("IMPORT SEQUENCE TEST")
print("=" * 80)

print("\n1. Before any imports:")
print(f"   'app.models.core' in sys.modules: {'app.models.core' in sys.modules}")
print(f"   'app.models.knowledge' in sys.modules: {'app.models.knowledge' in sys.modules}")

print("\n2. Importing app.database...")
from app.database import Base
print(f"   Tables: {list(Base.metadata.tables.keys())}")

print("\n3. Importing app.models...")
try:
    import app.models
    print(f"   SUCCESS!")
    print(f"   Tables: {list(Base.metadata.tables.keys())}")
    print(f"   'app.models.core' in sys.modules: {'app.models.core' in sys.modules}")
    print(f"   'app.models.knowledge' in sys.modules: {'app.models.knowledge' in sys.modules}")
except Exception as e:
    print(f"   FAILED: {e}")
    import traceback
    traceback.print_exc()
