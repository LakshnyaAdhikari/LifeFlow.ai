# LifeFlow.ai

**Next-Generation Procedural Intelligence Platform for Legal & Administrative Guidance**

LifeFlow.ai is an advanced AI system designed to navigate complex legal and administrative frameworks. By leveraging Retrieval-Augmented Generation (RAG) and Machine Learning, it transforms bureaucratic complexity into clear, actionable guidance.

---

## 🚀 Overview

Unlike traditional rule-based chatbots, LifeFlow.ai utilizes a dynamic intelligence engine to understand user situations in real-time. It retrieves authoritative knowledge from verified government sources and synthesizes it into personalized, step-by-step action plans.

### Key Capabilities

-   **Intelligent Domain Classification**: Automatically detects the legal or administrative domain of a user's query (e.g., Insurance, Taxation, Identity Documents) with high-confidence machine learning models.
-   **RAG-Driven Guidance**: Retrieves real-time information from a curated vector database of authoritative documents, ensuring accurately cited and relevant advice.
-   **Persistent Situation Management**: Tracks ongoing life events across multiple sessions, maintaining context and progress over time.
-   **Contextual Clarification**: Dynamically generates follow-up questions to resolve ambiguities before providing advice.
-   **Safety & Compliance**: Integrated legal safety filters ensure all guidance is non-advisory and compliant with regulatory standards.

---

## 🛠️ Architecture

LifeFlow.ai is built on a modern, scalable microservices architecture:

1.  **Frontend**: Next.js (React) for a responsive, high-performance user interface.
2.  **Backend API**: FastAPI (Python) for high-concurrency request handling.
3.  **Intelligence Layer**:
    *   **LLM Integration**: powered by advanced Large Language Models (Gemini/OpenAI) for reasoning and generation.
    *   **Vector Database**: FAISS for millisecond-latency semantic search.
    *   **Orchestration**: Custom graph-based workflow engine for managing complex processes.

---

## 💻 Tech Stack

### Core Infrastructure
*   **Language**: Python 3.9+, TypeScript
*   **Frameworks**: FastAPI, Next.js 14
*   **Database**: SQLAlchemy (ORM), SQLite/PostgreSQL
*   **AI/ML**: LangChain, SentenceTransformers, Google Gemini / OpenAI

### DevOps & Tooling
*   **Containerization**: Docker support
*   **Linting/Formatting**: ESLint, Black, Ruff
*   **Testing**: Pytest, Jest

---

## ⚡ Getting Started

Follow these steps to set up the LifeFlow.ai development environment.

### Prerequisites
*   Python 3.9 or higher
*   Node.js 16 or higher

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/lifeflow.ai.git
    cd lifeflow.ai
    ```

2.  **Backend Setup**
    ```bash
    # Install dependencies
    pip install -r requirements.txt

    # Initialize database
    python setup.py
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    ```

4.  **Running the Application**
    *   **Backend**: `uvicorn app.main:app --reload`
    *   **Frontend**: `npm run dev`

Access the application at `http://localhost:3000`.

---

## 📄 Documentation

Detailed documentation is available in the `/docs` directory and via the API swagger interface at `/docs` when running the backend.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
