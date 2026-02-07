
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.auth_models import UserAuth  # Fix for mapper error
from app.models.knowledge import KnowledgeDocument, KnowledgeChunk, KnowledgeDomain
from sqlalchemy import text

def clean_db():
    db = SessionLocal()
    try:
        print("Cleaning knowledge tables...")
        # Use simple delete
        db.query(KnowledgeChunk).delete()
        db.query(KnowledgeDocument).delete()
        db.query(KnowledgeDomain).delete()
        db.commit()
        print("Knowledge tables cleaned.")
    except Exception as e:
        print(f"Error cleaning DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clean_db()
