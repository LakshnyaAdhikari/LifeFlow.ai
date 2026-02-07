
import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
# Import ALL models to ensure SQLAlchemy registry is populated
from app.models import core, situation, knowledge
from app import auth_models
from app.models.situation import UserSituation

db = SessionLocal()
try:
    situations = db.query(UserSituation).all()
    print(f"Found {len(situations)} situations:")
    for s in situations:
        print(f"ID: {s.id}, Title: {s.title}, User: {s.user_id}")
finally:
    db.close()
