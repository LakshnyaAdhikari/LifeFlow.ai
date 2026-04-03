"""
Evaluate trained lightweight router with per-label confusion outputs.

Usage:
    python scripts/evaluate_router.py
    python scripts/evaluate_router.py --input router_dataset.jsonl --model-dir data/router
"""

from __future__ import annotations

import argparse
import json
import pickle
from pathlib import Path
from typing import Dict, List, Tuple


def _import_metrics():
    try:
        from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
    except Exception as e:
        raise RuntimeError(
            "scikit-learn is required to evaluate router models. "
            "Install with: pip install scikit-learn"
        ) from e

    return {
        "accuracy_score": accuracy_score,
        "classification_report": classification_report,
        "confusion_matrix": confusion_matrix,
        "f1_score": f1_score,
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
    return rows


def load_model(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Model file missing: {path}")
    with path.open("rb") as f:
        return pickle.load(f)


def build_confusion_payload(confusion_matrix_values, labels: List[str]) -> Dict:
    matrix_rows = confusion_matrix_values.tolist()
    return {
        "labels": labels,
        "matrix": matrix_rows,
    }


def evaluate_label(
    model,
    X: List[str],
    y_true: List[str],
    *,
    label_name: str,
    metrics: Dict
) -> Dict:
    y_pred = model.predict(X)
    labels = sorted(set(y_true))
    cm = metrics["confusion_matrix"](y_true, y_pred, labels=labels)

    return {
        "label_name": label_name,
        "accuracy": float(metrics["accuracy_score"](y_true, y_pred)),
        "macro_f1": float(metrics["f1_score"](y_true, y_pred, average="macro")),
        "report": metrics["classification_report"](y_true, y_pred, output_dict=True, zero_division=0),
        "confusion": build_confusion_payload(cm, labels),
    }


def top_confusions(confusion_payload: Dict, top_k: int = 10) -> List[Tuple[str, str, int]]:
    labels = confusion_payload["labels"]
    matrix = confusion_payload["matrix"]
    confusions: List[Tuple[str, str, int]] = []
    for i, row in enumerate(matrix):
        for j, value in enumerate(row):
            if i == j or value <= 0:
                continue
            confusions.append((labels[i], labels[j], int(value)))
    confusions.sort(key=lambda x: x[2], reverse=True)
    return confusions[:top_k]


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate trained lightweight router")
    parser.add_argument("--input", type=Path, default=Path("router_dataset.jsonl"))
    parser.add_argument("--model-dir", type=Path, default=Path("data/router"))
    parser.add_argument("--output", type=Path, default=Path("data/router/eval_report.json"))
    args = parser.parse_args()

    metrics = _import_metrics()
    rows = load_jsonl(args.input)
    if not rows:
        raise ValueError("Dataset is empty.")

    X = [row["query_text"] for row in rows]
    y_domain = [row["domain_label"] for row in rows]
    y_intent = [row["intent_label"] for row in rows]
    y_clarification = [bool(row["needs_clarification"]) for row in rows]

    domain_model = load_model(args.model_dir / "domain_router.pkl")
    intent_model = load_model(args.model_dir / "intent_router.pkl")
    clarification_model = load_model(args.model_dir / "clarification_router.pkl")

    domain_eval = evaluate_label(
        domain_model, X, y_domain, label_name="domain_label", metrics=metrics
    )
    intent_eval = evaluate_label(
        intent_model, X, y_intent, label_name="intent_label", metrics=metrics
    )
    clarification_eval = evaluate_label(
        clarification_model, X, y_clarification, label_name="needs_clarification", metrics=metrics
    )

    payload = {
        "dataset_path": str(args.input),
        "model_dir": str(args.model_dir),
        "rows": len(rows),
        "domain_eval": domain_eval,
        "intent_eval": intent_eval,
        "clarification_eval": clarification_eval,
        "top_domain_confusions": top_confusions(domain_eval["confusion"]),
        "top_intent_confusions": top_confusions(intent_eval["confusion"]),
        "top_clarification_confusions": top_confusions(clarification_eval["confusion"]),
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    print("Router evaluation complete.")
    print(f"Saved: {args.output}")
    print(f"Domain accuracy: {domain_eval['accuracy']:.4f} | macro_f1: {domain_eval['macro_f1']:.4f}")
    print(f"Intent accuracy: {intent_eval['accuracy']:.4f} | macro_f1: {intent_eval['macro_f1']:.4f}")
    print(
        "Clarification accuracy: "
        f"{clarification_eval['accuracy']:.4f} | macro_f1: {clarification_eval['macro_f1']:.4f}"
    )
    print("Top domain confusions:")
    for actual, predicted, count in payload["top_domain_confusions"]:
        print(f"  {actual} -> {predicted}: {count}")
    print("Top intent confusions:")
    for actual, predicted, count in payload["top_intent_confusions"]:
        print(f"  {actual} -> {predicted}: {count}")
    print("Top clarification confusions:")
    for actual, predicted, count in payload["top_clarification_confusions"]:
        print(f"  {actual} -> {predicted}: {count}")


if __name__ == "__main__":
    main()
