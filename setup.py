"""
LifeFlow.ai - Quick Setup Script

Automates the setup process for development and production
"""

import os
import sys
import subprocess
from pathlib import Path


def print_header(text):
    """Print a formatted header"""
    print("\n" + "="*80)
    print(f"  {text}")
    print("="*80 + "\n")


def check_python_version():
    """Check if Python version is compatible"""
    print_header("Checking Python Version")
    
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print("❌ Python 3.9+ required")
        print(f"   Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    
    print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
    return True


def check_env_file():
    """Check if .env file exists and has required variables"""
    print_header("Checking Environment Configuration")
    
    env_path = Path(".env")
    
    if not env_path.exists():
        print("⚠️  .env file not found")
        print("\nCreating .env from template...")
        
        env_template = """# LifeFlow.ai Environment Configuration

# CRITICAL: OpenAI API Key (required for RAG features)
OPENAI_API_KEY=your_openai_api_key_here

# Security
SECRET_KEY=your-secret-key-change-this-in-production

# Database (SQLite for development)
DATABASE_URL=sqlite:///./lifeflow.db

# Server
HOST=127.0.0.1
PORT=8000

# Frontend
FRONTEND_URL=http://localhost:3000

# Production Settings (uncomment for production)
# DATABASE_URL=postgresql://user:password@localhost/lifeflow
# VECTOR_DB_TYPE=pinecone
# PINECONE_API_KEY=your_pinecone_key
# PINECONE_ENVIRONMENT=your_environment
"""
        
        with open(".env", "w") as f:
            f.write(env_template)
        
        print("✅ Created .env file")
        print("\n⚠️  IMPORTANT: Edit .env and add your OPENAI_API_KEY")
        return False
    
    # Check for required variables
    with open(".env", "r") as f:
        content = f.read()
    
    has_openai_key = "OPENAI_API_KEY=" in content and "your_openai_api_key_here" not in content
    has_secret_key = "SECRET_KEY=" in content
    
    if has_openai_key and has_secret_key:
        print("✅ Environment configured")
        return True
    else:
        if not has_openai_key:
            print("⚠️  OPENAI_API_KEY not set in .env")
        if not has_secret_key:
            print("⚠️  SECRET_KEY not set in .env")
        return False


def setup_venv():
    """Set up virtual environment"""
    print_header("Setting Up Virtual Environment")
    
    venv_path = Path("venv")
    
    if venv_path.exists():
        print("✅ Virtual environment already exists")
        return True
    
    print("Creating virtual environment...")
    try:
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        print("✅ Virtual environment created")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to create virtual environment: {e}")
        return False


def install_dependencies():
    """Install Python dependencies"""
    print_header("Installing Dependencies")
    
    # Determine pip path
    if sys.platform == "win32":
        pip_path = Path("venv/Scripts/pip.exe")
    else:
        pip_path = Path("venv/bin/pip")
    
    if not pip_path.exists():
        print("❌ Virtual environment not found. Run setup first.")
        return False
    
    print("Installing Python packages...")
    try:
        subprocess.run([str(pip_path), "install", "-r", "requirements.txt"], check=True)
        print("✅ Dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False


def setup_database():
    """Initialize database"""
    print_header("Setting Up Database")
    
    # Determine python path
    if sys.platform == "win32":
        python_path = Path("venv/Scripts/python.exe")
    else:
        python_path = Path("venv/bin/python")
    
    print("Creating database tables...")
    
    # Create a simple script to initialize DB
    init_script = """
from app.database import engine, Base
from app.models import User, WorkflowTemplate, WorkflowVersion, WorkflowInstance, NodeState
from app.models.situation import UserSituation, SituationInteraction, UserFeedback
from app.models.knowledge import KnowledgeDomain, KnowledgeDocument, KnowledgeChunk, UserQuery, GuidanceSession

print("Creating all tables...")
Base.metadata.create_all(bind=engine)
print("✅ Database initialized")
"""
    
    with open("_init_db.py", "w") as f:
        f.write(init_script)
    
    try:
        subprocess.run([str(python_path), "_init_db.py"], check=True)
        os.remove("_init_db.py")
        print("✅ Database ready")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to initialize database: {e}")
        if os.path.exists("_init_db.py"):
            os.remove("_init_db.py")
        return False


def check_frontend():
    """Check if frontend dependencies are installed"""
    print_header("Checking Frontend")
    
    frontend_path = Path("frontend")
    node_modules = frontend_path / "node_modules"
    
    if not frontend_path.exists():
        print("⚠️  Frontend directory not found")
        return False
    
    if not node_modules.exists():
        print("⚠️  Frontend dependencies not installed")
        print("\nRun: cd frontend && npm install")
        return False
    
    print("✅ Frontend ready")
    return True


def print_next_steps(env_ready, db_ready):
    """Print next steps for the user"""
    print_header("Next Steps")
    
    if not env_ready:
        print("1. Edit .env file and add your OPENAI_API_KEY")
        print("   Get one from: https://platform.openai.com/api-keys")
        print()
    
    if env_ready and db_ready:
        print("✅ System is ready to run!")
        print()
        print("To start the backend:")
        print("  uvicorn app.main:app --reload")
        print()
        print("To start the frontend:")
        print("  cd frontend && npm run dev")
        print()
        print("To populate knowledge base:")
        print("  python bootstrap_knowledge.py")
        print()
        print("To run tests:")
        print("  python test_e2e_workflow.py")
        print()
        print("Access the application:")
        print("  Frontend: http://localhost:3000")
        print("  Backend API: http://127.0.0.1:8000")
        print("  API Docs: http://127.0.0.1:8000/docs")
    else:
        print("⚠️  Complete the steps above, then run this script again")


def main():
    """Main setup function"""
    print_header("LifeFlow.ai Setup")
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Check/create .env
    env_ready = check_env_file()
    
    # Setup virtual environment
    if not setup_venv():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Setup database
    db_ready = setup_database()
    
    # Check frontend
    check_frontend()
    
    # Print next steps
    print_next_steps(env_ready, db_ready)
    
    print("\n" + "="*80)
    print("  Setup Complete!")
    print("="*80 + "\n")


if __name__ == "__main__":
    main()
