"""
Train lightweight domain + intent router models from router_dataset.jsonl.

Usage:
    python scripts/train_router.py
    python scripts/train_router.py --input router_dataset.jsonl --output data/router
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import pickle
from typing import Dict, List


def _import_ml_dependencies():
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.metrics import accuracy_score, classification_report, f1_score
        from sklearn.model_selection import train_test_split
        from sklearn.pipeline import Pipeline
    except Exception as e:
        raise RuntimeError(
            "scikit-learn is required to train router models. "
            "Install with: pip install scikit-learn"
        ) from e

    return {
        "TfidfVectorizer": TfidfVectorizer,
        "LogisticRegression": LogisticRegression,
        "accuracy_score": accuracy_score,
        "classification_report": classification_report,
        "f1_score": f1_score,
        "train_test_split": train_test_split,
        "Pipeline": Pipeline,
    }


def load_jsonl(path: Path) -> List[Dict]:
    rows: List[Dict] = []
    for idx, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON at line {idx}: {e}") from e
    if not rows:
        raise ValueError("Dataset is empty.")
    return rows


def validate_rows(rows: List[Dict]) -> None:
    required = {
        "query_text",
        "intent_label",
        "domain_label",
        "service_label",
        "needs_clarification",
        "clarification_question",
    }
    for i, row in enumerate(rows, start=1):
        missing = required.difference(row.keys())
        if missing:
            raise ValueError(f"Row {i} is missing required keys: {sorted(missing)}")
        if not isinstance(row["query_text"], str) or not row["query_text"].strip():
            raise ValueError(f"Row {i} has empty query_text.")
        needs_clarification = row["needs_clarification"]
        clarification_question = row["clarification_question"]
        if needs_clarification and not clarification_question:
            raise ValueError(f"Row {i} needs_clarification=true but clarification_question is missing.")
        if (not needs_clarification) and clarification_question is not None:
            raise ValueError(f"Row {i} needs_clarification=false but clarification_question is not null.")


def build_pipeline(TfidfVectorizer, LogisticRegression, Pipeline):
    return Pipeline(
        steps=[
            (
                "vectorizer",
                TfidfVectorizer(
                    analyzer="char_wb",
                    ngram_range=(3, 5),
                    min_df=1,
                    lowercase=True,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    max_iter=3000,
                    class_weight="balanced",
                    random_state=42,
                ),
            ),
        ]
    )


def train_and_evaluate(
    X: List[str],
    y: List[str],
    *,
    label_name: str,
    deps: Dict,
):
    split = deps["train_test_split"](
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )
    X_train, X_test, y_train, y_test = split

    model = build_pipeline(deps["TfidfVectorizer"], deps["LogisticRegression"], deps["Pipeline"])
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    metrics = {
        "label_name": label_name,
        "test_size": len(X_test),
        "accuracy": float(deps["accuracy_score"](y_test, y_pred)),
        "macro_f1": float(deps["f1_score"](y_test, y_pred, average="macro")),
        "report": deps["classification_report"](y_test, y_pred, output_dict=True, zero_division=0),
    }
    return model, metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train lightweight intent+domain router")
    parser.add_argument("--input", type=Path, default=Path("router_dataset.jsonl"))
    parser.add_argument("--output", type=Path, default=Path("data/router"))
    args = parser.parse_args()

    deps = _import_ml_dependencies()
    rows = load_jsonl(args.input)
    validate_rows(rows)

    X = [row["query_text"] for row in rows]
    y_domain = [row["domain_label"] for row in rows]
    y_intent = [row["intent_label"] for row in rows]
    y_clarification = [bool(row["needs_clarification"]) for row in rows]

    domain_model, domain_metrics = train_and_evaluate(
        X, y_domain, label_name="domain_label", deps=deps
    )
    intent_model, intent_metrics = train_and_evaluate(
        X, y_intent, label_name="intent_label", deps=deps
    )
    clarification_model, clarification_metrics = train_and_evaluate(
        X, y_clarification, label_name="needs_clarification", deps=deps
    )

    args.output.mkdir(parents=True, exist_ok=True)
    with (args.output / "domain_router.pkl").open("wb") as f:
        pickle.dump(domain_model, f)
    with (args.output / "intent_router.pkl").open("wb") as f:
        pickle.dump(intent_model, f)
    with (args.output / "clarification_router.pkl").open("wb") as f:
        pickle.dump(clarification_model, f)

    metadata = {
        "dataset_path": str(args.input),
        "rows": len(rows),
        "labels": {
            "domains": sorted(set(y_domain)),
            "intents": sorted(set(y_intent)),
        },
        "metrics": {
            "domain": domain_metrics,
            "intent": intent_metrics,
            "clarification": clarification_metrics,
        },
    }
    (args.output / "metrics.json").write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print("Router training complete.")
    print(f"Saved: {args.output / 'domain_router.pkl'}")
    print(f"Saved: {args.output / 'intent_router.pkl'}")
    print(f"Saved: {args.output / 'clarification_router.pkl'}")
    print(f"Saved: {args.output / 'metrics.json'}")
    print(f"Domain accuracy: {domain_metrics['accuracy']:.4f} | macro_f1: {domain_metrics['macro_f1']:.4f}")
    print(f"Intent accuracy: {intent_metrics['accuracy']:.4f} | macro_f1: {intent_metrics['macro_f1']:.4f}")
    print(
        "Clarification accuracy: "
        f"{clarification_metrics['accuracy']:.4f} | macro_f1: {clarification_metrics['macro_f1']:.4f}"
    )


if __name__ == "__main__":
    main()
