"""Train and persist a draft vector-space style model.

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env and Python packages
numpy, scikit-learn, and supabase.  It never activates a model.
"""
from __future__ import annotations

import argparse
import json
import os
from collections import Counter
from pathlib import Path
from typing import Any

import numpy as np
from dotenv import load_dotenv
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import adjusted_rand_score, silhouette_score
from supabase import create_client

CORE = {"Top", "Bottom", "Outer", "DressSkirt", "Shoes"}
TAGS = ["casual", "minimal", "street", "classic", "vintage", "lovely_romantic", "sporty", "workwear_gorpcore", "chic_modern", "glam_sexy"]
AXES = ["formality", "refinement", "technicality", "historical_orientation", "visual_boldness", "affective_softness", "unconventionality", "sensuality"]
FACTS = ["primary_color", "accent_colors", "color_saturation", "primary_material", "pattern", "surface_finish", "surface_character", "surface_treatment"]
WEIGHTS = {"image": 0.65, "axes": 0.20, "facts": 0.15}


def unit(values: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(values)
    return values / norm if norm else np.zeros_like(values)


def embedding(value: Any) -> list[float]:
    if isinstance(value, list): return [float(x) for x in value]
    if isinstance(value, str): return [float(x) for x in value.strip("[]").split(",") if x.strip()]
    return []


def vocabulary(rows: list[dict[str, Any]]) -> list[str]:
    values: set[str] = set()
    for row in rows:
        attrs = effective(row, "human_style_attributes", "style_attributes") or {}
        for key in FACTS:
            raw = attrs.get(key)
            for value in raw if isinstance(raw, list) else [raw]:
                if isinstance(value, str) and value: values.add(f"{key}:{value}")
    return sorted(values)


def effective(row: dict[str, Any], human: str, ai: str) -> Any:
    return row.get(human) if row.get("tag_review_status") in {"approved", "edited"} and row.get(human) else row.get(ai)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    load_dotenv(Path.cwd() / ".env")
    client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    response = client.table(os.getenv("SUPABASE_PRODUCTS_TABLE", "products")).select(
        "id,category,image_embedding,style_axes,human_style_axes,style_attributes,human_style_attributes,tag_review_status"
    ).execute()
    rows = [row for row in response.data or [] if row.get("category") in CORE and embedding(row.get("image_embedding")) and effective(row, "human_style_axes", "style_axes")]
    if len(rows) < 240: raise RuntimeError("at least 240 eligible core-category products are required")
    vocab = vocabulary(rows)
    images = np.array([embedding(row["image_embedding"]) for row in rows], dtype=float)
    if len({len(row) for row in images}) != 1: raise RuntimeError("image embeddings have inconsistent dimensions")
    pca = PCA(n_components=min(64, len(rows) - 1, images.shape[1]), random_state=42).fit(images)
    reduced = pca.transform(images)
    features: list[np.ndarray] = []
    for index, row in enumerate(rows):
        axes = effective(row, "human_style_axes", "style_axes")
        attrs = effective(row, "human_style_attributes", "style_attributes") or {}
        axis = np.array([(float(axes.get(key, 4)) - 4) / 3 for key in AXES])
        fact_values = []
        for part in vocab:
            key, option = part.split(":", 1)
            raw = attrs.get(key)
            values = raw if isinstance(raw, list) else [raw]
            fact_values.append(float(option in values))
        facts = np.array(fact_values)
        combined = np.concatenate([unit(reduced[index]) * np.sqrt(WEIGHTS["image"]), unit(axis) * np.sqrt(WEIGHTS["axes"]), unit(facts) * np.sqrt(WEIGHTS["facts"])])
        features.append(unit(combined))
    X = np.vstack(features)
    upper = min(30, len(rows) // 20)
    candidates = range(12, upper + 1)
    if not list(candidates): raise RuntimeError("not enough products for a 12-cluster model")
    best: tuple[float, KMeans, np.ndarray] | None = None
    for k in candidates:
        model = KMeans(n_clusters=k, n_init=20, random_state=42).fit(X)
        labels = model.labels_
        counts = np.bincount(labels, minlength=k)
        if counts.min() < 20: continue
        stability = []
        for seed in (7, 19, 31):
            sample = np.random.default_rng(seed).choice(len(X), size=len(X), replace=True)
            boot = KMeans(n_clusters=k, n_init=10, random_state=seed).fit(X[sample])
            stability.append(adjusted_rand_score(labels[sample], boot.labels_))
        score = silhouette_score(X, labels, metric="cosine") + float(np.mean(stability))
        if best is None or score > best[0]: best = (score, model, labels)
    if best is None:
        diagnostics = []
        for k in candidates:
            labels = KMeans(n_clusters=k, n_init=20, random_state=42).fit_predict(X)
            diagnostics.append(f"k={k}: smallest={int(np.bincount(labels, minlength=k).min())}")
        raise RuntimeError(f"no candidate satisfied the minimum cluster size; eligible={len(rows)}; {'; '.join(diagnostics)}")
    _, model, labels = best
    if args.dry_run:
        print(json.dumps({"eligible": len(rows), "clusters": int(model.n_clusters), "vocabulary": len(vocab)}))
        return 0
    version = client.table("style_cluster_model_versions").insert({
        "status": "draft", "feature_config": {"image_dimensions": int(pca.n_components_), "fact_vocabulary": vocab, "weights": WEIGHTS, "core_categories": sorted(CORE), "axis_keys": AXES},
        "pca_mean": pca.mean_.tolist(), "pca_components": pca.components_.tolist(), "temperature": 0.12,
        "training_stats": {"eligible_products": len(rows), "cluster_count": int(model.n_clusters)},
    }).execute().data[0]
    clusters = []
    for ordinal in range(model.n_clusters):
        indices = np.where(labels == ordinal)[0]
        distances = 1 - X[indices] @ model.cluster_centers_[ordinal]
        axes = [effective(rows[i], "human_style_axes", "style_axes") for i in indices]
        attrs = [effective(rows[i], "human_style_attributes", "style_attributes") or {} for i in indices]
        axis_summary = {key: float(np.mean([float(item.get(key, 4)) for item in axes])) for key in AXES}
        fact_summary = {key: [value for value, _ in Counter(v for item in attrs for v in (item.get(key) if isinstance(item.get(key), list) else [item.get(key)]) if v).most_common(3)] for key in FACTS}
        clusters.append({"model_version_id": version["id"], "ordinal": ordinal, "centroid": model.cluster_centers_[ordinal].tolist(), "product_count": int(len(indices)), "mean_distance": float(np.mean(distances)), "axis_summary": axis_summary, "fact_summary": fact_summary})
    client.table("style_clusters").insert(clusters).execute()
    probabilities = np.exp((X @ model.cluster_centers_.T - 1) / 0.12)
    probabilities = probabilities / probabilities.sum(axis=1, keepdims=True)
    client.table("product_style_cluster_scores").upsert([
        {"product_id": int(row["id"]), "model_version_id": version["id"],
         "cluster_probabilities": {str(i): float(value) for i, value in enumerate(probabilities[index])},
         "derived_style_tags": {tag: 0.0 for tag in TAGS},
         "nearest_distance": float(1 - np.max(X[index] @ model.cluster_centers_.T)), "status": "scored"}
        for index, row in enumerate(rows)
    ]).execute()
    print(json.dumps({"model_version_id": version["id"], "clusters": len(clusters)}))
    return 0


if __name__ == "__main__": raise SystemExit(main())
