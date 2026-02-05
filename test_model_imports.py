"""Test script to isolate which model file causes the conflict"""
import sys

print("Step 1: Importing app.database...")
from app.database import Base
print(f"  Base ID: {id(Base)}, Tables: {list(Base.metadata.tables.keys())}")

print("\nStep 2: Importing app.models.knowledge...")
try:
    from app.models.knowledge import KnowledgeDomain
    print(f"  SUCCESS! Tables: {list(Base.metadata.tables.keys())}")
except Exception as e:
    print(f"  FAILED: {e}")

print("\nStep 3: Importing app.models.situation...")
try:
    from app.models.situation import UserSituation
    print(f"  SUCCESS! Tables: {list(Base.metadata.tables.keys())}")
except Exception as e:
    print(f"  FAILED: {e}")

print("\nStep 4: Importing app.auth_models...")
try:
    from app.auth_models import UserAuth
    print(f"  SUCCESS! Tables: {list(Base.metadata.tables.keys())}")
except Exception as e:
    print(f"  FAILED: {e}")

print("\nStep 5: Importing app.models.core...")
try:
    from app.models.core import User
    print(f"  SUCCESS! Tables: {list(Base.metadata.tables.keys())}")
except Exception as e:
    print(f"  FAILED: {e}")
    import traceback
    traceback.print_exc()
