"""
Clarification Question Generator
Generates structured questions to clarify user intent before RAG execution.
Uses fast model (gemini-2.5-flash-lite) for low latency (<3s).
"""

from typing import List, Optional
from pydantic import BaseModel
from loguru import logger

from app.services.llm.client import get_llm_client

class ClarificationQuestion(BaseModel):
    id: str
    text: str
    type: str  # "choice" or "text"
    options: Optional[List[str]] = None

class ClarificationResponse(BaseModel):
    questions: List[ClarificationQuestion]


# Domain-specific MCQ templates for deterministic fallback.
# These are intentionally high-signal to narrow user intent.
DOMAIN_MCQ_TEMPLATES = {
    "Identity Documents": [
        {
            "id": "identity_doc_type",
            "text": "Which document is this about?",
            "options": ["Aadhaar", "PAN", "Passport", "Voter ID", "Driving License", "Other / Not sure"],
        },
        {
            "id": "identity_request_type",
            "text": "What exactly do you need to do?",
            "options": ["New application", "Correction/update", "Reissue/duplicate", "Status tracking", "Complaint/escalation", "Other / Not sure"],
        },
        {
            "id": "identity_urgency",
            "text": "When do you need this resolved?",
            "options": ["Within 7 days", "Within 30 days", "No strict deadline", "Other / Not sure"],
        },
    ],
    "Insurance": [
        {
            "id": "insurance_type",
            "text": "Which insurance policy is this related to?",
            "options": ["Health", "Motor", "Life", "Property", "Travel", "Other / Not sure"],
        },
        {
            "id": "insurance_stage",
            "text": "What stage are you at right now?",
            "options": ["Buying/renewing policy", "Claim submitted", "Claim rejected/delayed", "Need escalation/ombudsman", "Other / Not sure"],
        },
        {
            "id": "insurance_document_readiness",
            "text": "Do you have core documents ready (policy, claim refs, communications)?",
            "options": ["Yes, all ready", "Some missing", "Not sure", "Other / Not sure"],
        },
    ],
    "Property": [
        {
            "id": "property_case_type",
            "text": "What is the primary property issue?",
            "options": ["Registration/sale deed", "Mutation/records", "Rental/tenant issue", "Ownership dispute", "Builder/RERA complaint", "Other / Not sure"],
        },
        {
            "id": "property_location",
            "text": "Where is the property located?",
            "options": ["Metro city", "Non-metro urban", "Rural area", "Outside India", "Other / Not sure"],
        },
        {
            "id": "property_stage",
            "text": "What stage are you currently in?",
            "options": ["Planning/verification", "Documentation pending", "Already submitted", "Dispute/escalation ongoing", "Other / Not sure"],
        },
    ],
    "Taxation": [
        {
            "id": "tax_persona",
            "text": "Which taxpayer profile best matches you?",
            "options": ["Salaried individual", "Freelancer/professional", "Business owner", "Senior citizen", "Other / Not sure"],
        },
        {
            "id": "tax_area",
            "text": "What tax matter is this about?",
            "options": ["ITR filing", "Refund/status", "Notice response", "TDS mismatch", "GST registration/return", "Other / Not sure"],
        },
        {
            "id": "tax_timeframe",
            "text": "Is there a deadline or notice date involved?",
            "options": ["Yes, in 7 days", "Yes, in 30 days", "No fixed deadline", "Not sure", "Other / Not sure"],
        },
    ],
    "Employment": [
        {
            "id": "employment_role",
            "text": "Which best describes your employment context?",
            "options": ["Current employee", "Former employee", "Job seeker", "Employer/HR", "Other / Not sure"],
        },
        {
            "id": "employment_issue",
            "text": "What is the main issue?",
            "options": ["Salary/dues", "Termination/resignation", "PF/ESI", "Offer/contract", "Workplace grievance", "Other / Not sure"],
        },
        {
            "id": "employment_resolution_stage",
            "text": "Have you already raised this with employer/authority?",
            "options": ["Not yet", "Raised with employer", "Filed complaint with authority", "Awaiting response", "Other / Not sure"],
        },
    ],
    "Business Compliance": [
        {
            "id": "business_type",
            "text": "What type of business setup is this?",
            "options": ["Sole proprietorship", "Partnership/LLP", "Private limited company", "Startup (new)", "Other / Not sure"],
        },
        {
            "id": "business_compliance_area",
            "text": "Which compliance area needs help?",
            "options": ["Registration/incorporation", "GST", "Licenses/permits", "ROC filings", "Annual compliance", "Other / Not sure"],
        },
        {
            "id": "business_deadline",
            "text": "Is there a filing or compliance deadline soon?",
            "options": ["Within 7 days", "Within 30 days", "No immediate deadline", "Not sure", "Other / Not sure"],
        },
    ],
    "Family & Legal": [
        {
            "id": "family_matter_type",
            "text": "Which family/legal matter is this about?",
            "options": ["Marriage-related", "Divorce/separation", "Child custody/support", "Will/succession", "Domestic violence/protection", "Other / Not sure"],
        },
        {
            "id": "family_case_stage",
            "text": "What is the current stage?",
            "options": ["Need initial guidance", "Drafting documents", "Already filed case", "Hearing/order pending", "Other / Not sure"],
        },
        {
            "id": "family_urgency",
            "text": "How urgent is the matter?",
            "options": ["Emergency/immediate", "Within a week", "Within a month", "No immediate urgency", "Other / Not sure"],
        },
    ],
    "Consumer Protection": [
        {
            "id": "consumer_purchase_type",
            "text": "Was this a product or service issue?",
            "options": ["Product purchase", "Service subscription", "Online marketplace order", "Financial service", "Other / Not sure"],
        },
        {
            "id": "consumer_issue_type",
            "text": "What is the main problem?",
            "options": ["Defective item/service", "No delivery/no service", "Refund not given", "Misleading terms/charges", "Warranty denied", "Other / Not sure"],
        },
        {
            "id": "consumer_complaint_stage",
            "text": "Have you already complained to seller/provider?",
            "options": ["Not yet", "Yes, waiting for reply", "Rejected/no response", "Escalated to grievance forum", "Other / Not sure"],
        },
    ],
    "Vehicle & Transport": [
        {
            "id": "transport_service_type",
            "text": "Which transport service is this about?",
            "options": ["Driving license", "Vehicle registration (RC)", "Ownership transfer", "E-challan/fine", "Permit/fitness", "Other / Not sure"],
        },
        {
            "id": "transport_vehicle_category",
            "text": "What vehicle category applies here?",
            "options": ["Two-wheeler", "Private car", "Commercial vehicle", "No specific vehicle yet", "Other / Not sure"],
        },
        {
            "id": "transport_stage",
            "text": "What stage are you currently at?",
            "options": ["Need process steps", "Application submitted", "Verification pending", "Rejected/blocked", "Other / Not sure"],
        },
    ],
    "Banking & Finance": [
        {
            "id": "banking_product",
            "text": "Which financial product is involved?",
            "options": ["Bank account/KYC", "Loan/EMI", "Credit card", "UPI/digital payment", "Investment/deposit", "Other / Not sure"],
        },
        {
            "id": "banking_issue",
            "text": "What is the primary issue?",
            "options": ["Transaction failure/fraud", "Account freeze/KYC issue", "Charges/dispute", "Loan restructuring/default", "Complaint escalation", "Other / Not sure"],
        },
        {
            "id": "banking_stage",
            "text": "Have you contacted the bank/NBFC already?",
            "options": ["Not yet", "Complaint filed with bank", "No response/rejected", "Escalated to ombudsman", "Other / Not sure"],
        },
    ],
}

DEFAULT_MCQ_TEMPLATE = [
    {
        "id": "general_case_type",
        "text": "Which category best matches your issue?",
        "options": ["Application/update", "Status delay", "Rejection/dispute", "Compliance/documentation", "Other / Not sure"],
    },
    {
        "id": "general_stage",
        "text": "What stage are you currently in?",
        "options": ["Need first-time guidance", "Preparing documents", "Already submitted request", "Following up/escalating", "Other / Not sure"],
    },
    {
        "id": "general_deadline",
        "text": "Do you have a deadline for this?",
        "options": ["Within 7 days", "Within 30 days", "No strict deadline", "Not sure", "Other / Not sure"],
    },
]


class ClarificationGenerator:
    def __init__(self):
        self.llm_client = get_llm_client()
        # Ensure we use the fast model
        # Note: Client defaults to gemini-2.5-flash-lite which is perfect

    async def generate_questions(self, query: str, domain: str) -> List[ClarificationQuestion]:
        """
        Generate 2-3 high-signal clarifying questions
        """
        logger.info(f"Generating clarification questions for: {query} ({domain})")
        
        prompt = f"""
You are an expert intake specialist for: {domain}.
The user has asked: "{query}"

Your goal is to ask 2-3 short, high-signal multiple-choice questions to clarify their situation so we can give better guidance.
Answers should help narrow down: Jurisdiction, specific process type, and current stage.

Refuse to ask about PII (Name, Phone, etc).
All questions MUST be "choice" type.
Do NOT return any "text" type question.
Each question must have 3-6 concise options.
At least one question should identify current stage/progress.
At least one question should identify specific sub-type of request.
Use simple user-facing wording.

Return a JSON object strictly following this schema:
{{
  "questions": [
    {{
      "id": "unique_id",
      "text": "The question text?",
      "type": "choice", 
      "options": ["Option A", "Option B", "Other"]
    }},
    ...
  ]
}}

Generate exactly 2 or 3 questions.
"""
        
        try:
            # We use generate_json directly
            # Note: For Gemini, we must ensure the prompt asks for JSON (which it does above)
            response_dict = await self.llm_client.generate_json(
                prompt=prompt,
                temperature=0.3 # Low temp for consistency
            )
            
            # Parse into Pydantic models for validation
            validated = ClarificationResponse(**response_dict)
            normalized = self._normalize_questions(validated.questions)
            if len(normalized) >= 2:
                return normalized[:3]

            # If LLM output is weak (e.g., text-only), blend in deterministic MCQs.
            fallback = self._build_domain_fallback(domain)
            merged = normalized + [q for q in fallback if q.id not in {n.id for n in normalized}]
            return merged[:3]
            
        except Exception as e:
            logger.error(f"Failed to generate questions: {e}")
            # Deterministic fallback to domain-tuned MCQs
            return self._build_domain_fallback(domain)

    def _build_domain_fallback(self, domain: str) -> List[ClarificationQuestion]:
        template = DOMAIN_MCQ_TEMPLATES.get(domain, DEFAULT_MCQ_TEMPLATE)
        return [
            ClarificationQuestion(
                id=item["id"],
                text=item["text"],
                type="choice",
                options=item["options"],
            )
            for item in template
        ]

    def _normalize_questions(
        self,
        questions: List[ClarificationQuestion]
    ) -> List[ClarificationQuestion]:
        normalized: List[ClarificationQuestion] = []
        seen_text = set()

        for idx, question in enumerate(questions):
            text = (question.text or "").strip()
            if not text:
                continue

            options = []
            for raw_option in question.options or []:
                option = (raw_option or "").strip()
                if option and option not in options:
                    options.append(option)

            # Keep only meaningful MCQ questions.
            if question.type != "choice" or len(options) < 2:
                continue

            has_other = any(
                opt.lower() in {"other", "other / not sure", "not sure", "other/not sure"}
                for opt in options
            )
            if not has_other and len(options) < 6:
                options.append("Other / Not sure")

            dedupe_key = text.lower()
            if dedupe_key in seen_text:
                continue
            seen_text.add(dedupe_key)

            normalized.append(
                ClarificationQuestion(
                    id=question.id or f"clarify_{idx + 1}",
                    text=text,
                    type="choice",
                    options=options[:6],
                )
            )

        return normalized

_generator: Optional[ClarificationGenerator] = None

def get_clarification_generator() -> ClarificationGenerator:
    global _generator
    if not _generator:
        _generator = ClarificationGenerator()
    return _generator
