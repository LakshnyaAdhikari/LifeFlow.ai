"""Test script to isolate the MetaData conflict - Version 2"""
import sys

print("Step 1: Importing sqlalchemy...")
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
print("  SUCCESS!")

print("\nStep 2: Creating Base...")
Base = declarative_base()
print(f"  Base ID: {id(Base)}, Metadata ID: {id(Base.metadata)}")
print(f"  Tables: {list(Base.metadata.tables.keys())}")

print("\nStep 3: Importing app.database...")
try:
    from app.database import Base as AppBase
    print(f"  SUCCESS!")
    print(f"  AppBase ID: {id(AppBase)}, Metadata ID: {id(AppBase.metadata)}")
    print(f"  Tables: {list(AppBase.metadata.tables.keys())}")
except Exception as e:
    print(f"  FAILED: {e}")
    import traceback
    traceback.print_exc()
