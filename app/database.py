from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use SQLite for local MVP simplicity, or configurable via env var
DATABASE_URL = "sqlite:///./lifeflow.db"
# DATABASE_URL = "postgresql://user:password@localhost/lifeflow"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
