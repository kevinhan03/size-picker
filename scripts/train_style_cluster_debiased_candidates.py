"""Train category-debiased, global-style K-Means draft candidates.

This keeps the original image embedding intact.  It removes only the mean visual
signal associated with each category in PCA space, then clusters a separate
style representation.  It never activates or labels a model.
"""
from __future__ import annotations

import os
from collections import Counter
from pathlib import Path
from typing import Any

import numpy as np
from dotenv import load_dotenv
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from supabase import create_client

CORE = {"Top", "Bottom", "Outer", "DressSkirt", "Shoes"}
AXES = ["formality", "refinement", "technicality", "historical_orientation", "visual_boldness", "affective_softness", "unconventionality", "sensuality"]
FACTS = ["primary_color", "accent_colors", "color_saturation", "primary_material", "pattern", "surface_finish", "surface_character", "surface_treatment"]
TAGS = ["casual", "minimal", "street", "classic", "vintage", "lovely_romantic", "sporty", "workwear_gorpcore", "chic_modern", "glam_sexy"]
PROFILES = [
    ("debiased-balanced", {"image": 0.40, "axes": 0.35, "facts": 0.25}),
    ("debiased-visual", {"image": 0.45, "axes": 0.35, "facts": 0.20}),
    ("debiased-axes", {"image": 0.35, "axes": 0.40, "facts": 0.25}),
]


def unit(value: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(value)
    return value / norm if norm else np.zeros_like(value)


def embedding(value: Any) -> list[float]:
    if isinstance(value, list): return [float(item) for item in value]
    if isinstance(value, str): return [float(item) for item in value.strip("[]").split(",") if item.strip()]
    return []


def effective(row: dict[str, Any], human: str, ai: str) -> Any:
    return row.get(human) if row.get("tag_review_status") in {"approved", "edited"} and row.get(human) else row.get(ai)


def category_metrics(rows: list[dict[str, Any]], labels: np.ndarray) -> dict[str, float]:
    total = len(rows); categories = sorted(CORE); maximum_entropy = np.log(len(categories))
    entropies = []; pure = 0
    for label in sorted(set(labels)):
        indices = np.where(labels == label)[0]
        counts = Counter(rows[index]["category"] for index in indices)
        proportions = np.array(list(counts.values()), dtype=float) / len(indices)
        entropies.append((len(indices) / total) * float(-(proportions * np.log(proportions)).sum() / maximum_entropy))
        pure += len(indices) / total * max(proportions)
    return {"category_mix_entropy": float(sum(entropies)), "category_purity": float(pure)}


def make_features(rows: list[dict[str, Any]], weights: dict[str, float]) -> tuple[np.ndarray, PCA, list[str], dict[str, list[float]]]:
    vocabulary = sorted({f"{key}:{value}" for row in rows for key in FACTS for raw in [(effective(row, "human_style_attributes", "style_attributes") or {}).get(key)] for value in (raw if isinstance(raw, list) else [raw]) if isinstance(value, str) and value})
    images = np.array([embedding(row["image_embedding"]) for row in rows], dtype=float)
    if len({len(image) for image in images}) != 1: raise RuntimeError("image embeddings have inconsistent dimensions")
    pca = PCA(n_components=min(64, len(rows) - 1, images.shape[1]), random_state=42).fit(images)
    reduced = pca.transform(images)
    means = {category: reduced[[index for index, row in enumerate(rows) if row["category"] == category]].mean(axis=0) for category in CORE}
    features = []
    for index, row in enumerate(rows):
        axes = effective(row, "human_style_axes", "style_axes")
        facts = effective(row, "human_style_attributes", "style_attributes") or {}
        axis_vector = np.array([(float(axes.get(key, 4)) - 4) / 3 for key in AXES])
        fact_vector = np.array([float(option in (facts.get(key) if isinstance(facts.get(key), list) else [facts.get(key)])) for key, option in (entry.split(":", 1) for entry in vocabulary)])
        visual_residual = reduced[index] - means[row["category"]]
        features.append(unit(np.concatenate([unit(visual_residual) * np.sqrt(weights["image"]), unit(axis_vector) * np.sqrt(weights["axes"]), unit(fact_vector) * np.sqrt(weights["facts"])])))
    return np.vstack(features), pca, vocabulary, {key: value.tolist() for key, value in means.items()}


def choose_model(X: np.ndarray, rows: list[dict[str, Any]]) -> tuple[KMeans, np.ndarray, float, dict[str, float]]:
    candidates = []
    for k in range(8, 15):
        model = KMeans(n_clusters=k, n_init=40, random_state=42).fit(X); labels = model.labels_
        if np.bincount(labels, minlength=k).min() < 10: continue
        silhouette = float(silhouette_score(X, labels, metric="cosine")); metrics = category_metrics(rows, labels)
        # Prefer coherent clusters, but explicitly penalize category-dominated partitions.
        selection = silhouette + 0.20 * metrics["category_mix_entropy"]
        candidates.append((selection, model, labels, {"silhouette": silhouette, **metrics}))
    if not candidates: raise RuntimeError("no candidate met the 10-product minimum cluster size")
    selection, model, labels, metrics = max(candidates, key=lambda item: item[0])
    return model, labels, float(selection), metrics


def persist(client: Any, rows: list[dict[str, Any]], X: np.ndarray, pca: PCA, vocabulary: list[str], means: dict[str, list[float]], profile: str, weights: dict[str, float], model: KMeans, labels: np.ndarray, selection: float, metrics: dict[str, float]) -> str:
    version = client.table("style_cluster_model_versions").insert({"status": "draft", "algorithm": "spherical_kmeans", "is_operational": True, "selection_score": selection, "feature_config": {"profile_name": profile, "image_dimensions": int(pca.n_components_), "fact_vocabulary": vocabulary, "weights": weights, "core_categories": sorted(CORE), "axis_keys": AXES, "image_transform": "category_mean_residual", "category_image_means": means}, "pca_mean": pca.mean_.tolist(), "pca_components": pca.components_.tolist(), "temperature": 0.12, "training_stats": {"eligible_products": len(rows), "cluster_count": int(model.n_clusters), "selection_score": selection, **metrics}}).execute().data[0]
    clusters = []
    for ordinal in range(model.n_clusters):
        indices = np.where(labels == ordinal)[0]; center = unit(model.cluster_centers_[ordinal])
        axes = [effective(rows[index], "human_style_axes", "style_axes") for index in indices]
        facts = [effective(rows[index], "human_style_attributes", "style_attributes") or {} for index in indices]
        clusters.append({"model_version_id": version["id"], "ordinal": ordinal, "centroid": center.tolist(), "product_count": int(len(indices)), "mean_distance": float(np.mean(1 - X[indices] @ center)), "axis_summary": {key: float(np.mean([float(item.get(key, 4)) for item in axes])) for key in AXES}, "fact_summary": {key: [value for value, _ in Counter(value for item in facts for value in (item.get(key) if isinstance(item.get(key), list) else [item.get(key)]) if value).most_common(3)] for key in FACTS}})
    client.table("style_clusters").insert(clusters).execute()
    centers = np.vstack([unit(center) for center in model.cluster_centers_]); distances = 1 - X @ centers.T; probabilities = np.exp(-distances / 0.12); probabilities /= probabilities.sum(axis=1, keepdims=True)
    client.table("product_style_cluster_scores").upsert([{"product_id": int(row["id"]), "model_version_id": version["id"], "cluster_probabilities": {str(index): float(value) for index, value in enumerate(probabilities[row_index])}, "derived_style_tags": {tag: 0.0 for tag in TAGS}, "nearest_distance": float(distances[row_index].min()), "status": "scored"} for row_index, row in enumerate(rows)]).execute()
    return version["id"]


def main() -> None:
    load_dotenv(Path.cwd() / ".env")
    client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    response = client.table(os.getenv("SUPABASE_PRODUCTS_TABLE", "products")).select("id,category,image_embedding,style_axes,human_style_axes,style_attributes,human_style_attributes,tag_review_status").execute()
    rows = [row for row in response.data or [] if row.get("category") in CORE and embedding(row.get("image_embedding")) and effective(row, "human_style_axes", "style_axes")]
    if len(rows) < 100: raise RuntimeError("at least 100 eligible products are required")
    created = []
    for profile, weights in PROFILES:
        X, pca, vocabulary, means = make_features(rows, weights); model, labels, selection, metrics = choose_model(X, rows)
        created.append({"profile": profile, "version_id": persist(client, rows, X, pca, vocabulary, means, profile, weights, model, labels, selection, metrics), "clusters": int(model.n_clusters), "selection_score": selection, **metrics})
    print(created)


if __name__ == "__main__": main()
