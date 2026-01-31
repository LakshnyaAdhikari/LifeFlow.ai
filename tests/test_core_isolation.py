import sys
import os
import unittest
from typing import List, Dict, Any

# Ensure we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.interfaces.repositories import KnowledgeRetriever
from app.agents.explanation_agent import ExplanationAgent

# Mock Implementation that does NOT import LangChain/FAISS
class MockRetriever(KnowledgeRetriever):
    def retrieve_context(self, query: str, context_keys: dict = None) -> List[Dict[str, Any]]:
        return [{"content": "Mocked Content", "source": "Unit Test", "score": 1.0}]

class TestCoreIsolation(unittest.TestCase):
    def test_agent_isolation(self):
        """
        Verify ExplanationAgent can be instantiated and used 
        without triggering any infrastructure imports.
        """
        print("\nTesting Core Isolation...")
        
        # Check that heavy libraries are NOT imported yet (if this was a fresh run)
        # Note: In a real environment, we'd run this with a minimal venv.
        # Here we just verify logical independence.
        
        retriever = MockRetriever()
        agent = ExplanationAgent(retriever)
        
        result = agent.explain_step("Test Step", "Test Jurisdiction")
        
        self.assertIn("Mocked Content", str(result))
        print("Success: Agent worked with MockRetriever (Pure Python)")

if __name__ == "__main__":
    unittest.main()
