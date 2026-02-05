"""Test script to isolate the MetaData conflict"""
import sys

print("Step 1: Importing database...")
from app.database import Base
print(f"  Base ID: {id(Base)}, Metadata ID: {id(Base.metadata)}")
print(f"  Tables: {list(Base.metadata.tables.keys())}")

print("\nStep 2: Importing models.core...")
try:
    from app.models.core import User
    print(f"  SUCCESS! User imported")
    print(f"  Base ID: {id(User.__bases__[0])}, Metadata ID: {id(User.__bases__[0].metadata)}")
    print(f"  Tables: {list(Base.metadata.tables.keys())}")
except Exception as e:
    print(f"  FAILED: {e}")
    import traceback
    traceback.print_exc()
