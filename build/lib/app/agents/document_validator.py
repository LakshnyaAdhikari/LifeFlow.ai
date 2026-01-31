from typing import Dict, Any, List
# This would use an LLM in a real scenario
# For MVP, we use rule-based checks or mocked LLM calls

class DocumentValidatorAgent:
    def validate_document(self, evidence_data: Dict[str, Any], requirements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates the submitted evidence against requirements.
        Returns: {"status": "VALID"|"INVALID", "reason": "..."}
        """
        # MVP Logic: Check if required keys exist
        missing_fields = []
        for req in requirements.get("required_fields", []):
            if req not in evidence_data:
                missing_fields.append(req)
        
        if missing_fields:
            return {
                "status": "INVALID",
                "reason": f"Missing required fields: {', '.join(missing_fields)}"
            }
        
        return {
            "status": "VALID",
            "reason": "All structural checks passed."
        }

document_validator = DocumentValidatorAgent()
