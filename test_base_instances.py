"""
Test to check if there are multiple Base instances
"""
import sys

print("Testing for multiple Base instances...")

print("\n1. Import database.Base")
from app.database import Base as DatabaseBase
print(f"   DatabaseBase ID: {id(DatabaseBase)}")
print(f"   DatabaseBase.metadata ID: {id(DatabaseBase.metadata)}")

print("\n2. Import models.core")
from app.models.core import Base as CoreBase
print(f"   CoreBase ID: {id(CoreBase)}")
print(f"   CoreBase.metadata ID: {id(CoreBase.metadata)}")

print("\n3. Are they the same?")
print(f"   DatabaseBase is CoreBase: {DatabaseBase is CoreBase}")
print(f"   DatabaseBase.metadata is CoreBase.metadata: {DatabaseBase.metadata is CoreBase.metadata}")

if DatabaseBase is not CoreBase:
    print("\n❌ PROBLEM FOUND: Multiple Base instances!")
else:
    print("\n✅ Base instances are the same")
