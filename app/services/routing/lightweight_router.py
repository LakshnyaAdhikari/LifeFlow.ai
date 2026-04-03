"""
Lightweight intent + domain router inference.

Loads local ML artifacts (if present) and provides fast predictions
for orchestration paths that should not depend on LLM latency.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional
import pickle
import re

from loguru import logger


DEFAULT_MODEL_DIR = Path("data/router")
DOMAIN_MODEL_FILE = "domain_router.pkl"
INTENT_MODEL_FILE = "intent_router.pkl"
CLARIFICATION_MODEL_FILE = "clarification_router.pkl"

ALLOWED_INTENTS = {
    "doc_requirements",
    "fees",
    "timeline",
    "status",
    "escalation",
    "steps",
    "summary",
    "general",
}


@dataclass
class RouterPrediction:
    query_text: str
    domain_label: str
    domain_confidence: float
    intent_label: str
    intent_confidence: float
    needs_clarification: bool
    clarification_confidence: float
    clarification_reason: Optional[str] = None


class LightweightRouter:
    """
    Local classifier-backed router.
    If artifacts are unavailable, this router degrades gracefully and returns None.
    """

    def __init__(self, model_dir: Path = DEFAULT_MODEL_DIR):
        self.model_dir = model_dir
        self.domain_model = None
        self.intent_model = None
        self.clarification_model = None
        self.available = False
        self._load_models()

    def _load_models(self) -> None:
        domain_path = self.model_dir / DOMAIN_MODEL_FILE
        intent_path = self.model_dir / INTENT_MODEL_FILE
        clarification_path = self.model_dir / CLARIFICATION_MODEL_FILE

        if not domain_path.exists() or not intent_path.exists():
            logger.warning(
                "Lightweight router artifacts not found at {}. "
                "Run scripts/train_router.py to enable local routing.",
                self.model_dir,
            )
            return

        try:
            with domain_path.open("rb") as f:
                self.domain_model = pickle.load(f)
            with intent_path.open("rb") as f:
                self.intent_model = pickle.load(f)
            if clarification_path.exists():
                with clarification_path.open("rb") as f:
                    self.clarification_model = pickle.load(f)
            self.available = True
            logger.info("Lightweight router loaded from {}", self.model_dir)
        except Exception as e:
            logger.error("Failed to load lightweight router artifacts: {}", e)
            self.domain_model = None
            self.intent_model = None
            self.clarification_model = None
            self.available = False

    def predict(self, query_text: str) -> Optional[RouterPrediction]:
        if not self.available or not query_text or not query_text.strip():
            return None

        try:
            domain_label, domain_conf = self._predict_label_and_confidence(self.domain_model, query_text)
            intent_label, intent_conf = self._predict_label_and_confidence(self.intent_model, query_text)

            if intent_label not in ALLOWED_INTENTS:
                # Hard safety: avoid propagating unknown intent labels.
                intent_label = "general"
                intent_conf = min(intent_conf, 0.5)

            needs_clarification, clarification_confidence, reason = self._predict_needs_clarification(
                query_text=query_text,
                domain_confidence=domain_conf,
                intent_confidence=intent_conf,
            )

            return RouterPrediction(
                query_text=query_text,
                domain_label=domain_label,
                domain_confidence=domain_conf,
                intent_label=intent_label,
                intent_confidence=intent_conf,
                needs_clarification=needs_clarification,
                clarification_confidence=clarification_confidence,
                clarification_reason=reason,
            )
        except Exception as e:
            logger.error("Lightweight router prediction failed: {}", e)
            return None

    def _predict_label_and_confidence(self, model: Any, text: str) -> tuple[str, float]:
        label = str(model.predict([text])[0])
        confidence = 0.5

        if hasattr(model, "predict_proba"):
            probs = model.predict_proba([text])[0]
            confidence = float(max(probs))
        elif hasattr(model, "decision_function"):
            scores = model.decision_function([text])
            if hasattr(scores, "__len__"):
                # Convert margin to pseudo confidence in a bounded range.
                # This keeps thresholds stable even when probabilities are unavailable.
                margin = float(max(scores[0])) if hasattr(scores[0], "__len__") else float(scores[0])
                confidence = max(0.0, min(1.0, 0.5 + (margin / 10.0)))

        return label, confidence

    def _predict_needs_clarification(
        self,
        query_text: str,
        domain_confidence: float,
        intent_confidence: float,
    ) -> tuple[bool, float, Optional[str]]:
        tokens = re.findall(r"\w+", query_text.lower())

        # Prefer trained clarification classifier when available.
        if self.clarification_model is not None:
            try:
                if hasattr(self.clarification_model, "predict_proba"):
                    proba = self.clarification_model.predict_proba([query_text])[0]
                    classes = list(self.clarification_model.classes_)
                    if True in classes:
                        idx = classes.index(True)
                    elif 1 in classes:
                        idx = classes.index(1)
                    else:
                        idx = int(len(proba) - 1)
                    clarification_prob = float(proba[idx])
                else:
                    pred = self.clarification_model.predict([query_text])[0]
                    clarification_prob = 1.0 if bool(pred) else 0.0

                # Extremely short queries still force clarification.
                if len(tokens) <= 2:
                    return True, max(clarification_prob, 0.9), "query_too_short"

                return clarification_prob >= 0.5, clarification_prob, "router_classifier"
            except Exception as e:
                logger.warning("Clarification classifier failed, using heuristic fallback: {}", e)

        # Heuristic fallback if clarification classifier is unavailable.
        if len(tokens) <= 2:
            return True, 0.9, "query_too_short"
        if domain_confidence < 0.55:
            return True, 0.7, "low_domain_confidence"
        if intent_confidence < 0.5:
            return True, 0.65, "low_intent_confidence"
        return False, 0.3, "heuristic_confident"


_router_instance: Optional[LightweightRouter] = None


def get_lightweight_router() -> LightweightRouter:
    global _router_instance
    if _router_instance is None:
        _router_instance = LightweightRouter()
    return _router_instance
