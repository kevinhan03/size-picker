"""Create axis-first global-style draft candidates without activating them."""
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
    ("axes-only-baseline", {"image": 0.00, "axes": 1.00, "facts": 0.00}),
    ("axes-primary", {"image": 0.20, "axes": 0.65, "facts": 0.15}),
    ("axes-max", {"image": 0.15, "axes": 0.75, "facts": 0.10}),
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
    categories = sorted(CORE); max_entropy = np.log(len(categories)); total = len(rows); entropy = 0.0; purity = 0.0
    for label in sorted(set(labels)):
        indices = np.where(labels == label)[0]; counts = Counter(rows[index]["category"] for index in indices)
        proportions = np.array(list(counts.values()), dtype=float) / len(indices)
        entropy += len(indices) / total * float(-(proportions * np.log(proportions)).sum() / max_entropy)
        purity += len(indices) / total * float(proportions.max())
    return {"category_mix_entropy": entropy, "category_purity": purity}


def load_rows(client: Any) -> list[dict[str, Any]]:
    response = client.table(os.getenv("SUPABASE_PRODUCTS_TABLE", "products")).select("id,category,image_embedding,style_axes,human_style_axes,style_attributes,human_style_attributes,tag_review_status").execute()
    return [row for row in response.data or [] if row.get("category") in CORE and embedding(row.get("image_embedding")) and effective(row, "human_style_axes", "style_axes")]


def base_data(rows: list[dict[str, Any]]) -> tuple[PCA, np.ndarray, list[str], dict[str, np.ndarray], np.ndarray, np.ndarray]:
    images = np.array([embedding(row["image_embedding"]) for row in rows], dtype=float)
    pca = PCA(n_components=min(64, len(rows) - 1, images.shape[1]), random_state=42).fit(images)
    reduced = pca.transform(images)
    category_means = {category: reduced[[index for index, row in enumerate(rows) if row["category"] == category]].mean(axis=0) for category in CORE}
    vocabulary = sorted({f"{key}:{value}" for row in rows for key in FACTS for raw in [(effective(row, "human_style_attributes", "style_attributes") or {}).get(key)] for value in (raw if isinstance(raw, list) else [raw]) if isinstance(value, str) and value})
    raw_axes = np.array([[float(effective(row, "human_style_axes", "style_axes").get(key, 4)) for key in AXES] for row in rows])
    axis_means = raw_axes.mean(axis=0); axis_scales = raw_axes.std(axis=0); axis_scales[axis_scales == 0] = 1
    return pca, reduced, vocabulary, category_means, axis_means, axis_scales


def features(rows: list[dict[str, Any]], reduced: np.ndarray, vocabulary: list[str], category_means: dict[str, np.ndarray], axis_means: np.ndarray, axis_scales: np.ndarray, weights: dict[str, float]) -> np.ndarray:
    output = []
    for index, row in enumerate(rows):
        axes = effective(row, "human_style_axes", "style_axes"); facts = effective(row, "human_style_attributes", "style_attributes") or {}
        standardized_axes = np.array([(float(axes.get(key, 4)) - axis_means[axis_index]) / axis_scales[axis_index] for axis_index, key in enumerate(AXES)])
        fact_vector = np.array([float(option in (facts.get(key) if isinstance(facts.get(key), list) else [facts.get(key)])) for key, option in (entry.split(":", 1) for entry in vocabulary)])
        visual_residual = reduced[index] - category_means[row["category"]]
        blocks = []
        if weights["image"]: blocks.append(unit(visual_residual) * np.sqrt(weights["image"]))
        if weights["axes"]: blocks.append(standardized_axes * np.sqrt(weights["axes"]))
        if weights["facts"]: blocks.append(unit(fact_vector) * np.sqrt(weights["facts"]))
        output.append(unit(np.concatenate(blocks)))
    return np.vstack(output)


def choose(X: np.ndarray, rows: list[dict[str, Any]]) -> tuple[KMeans, np.ndarray, float, dict[str, float]]:
    candidates = []
    for k in range(8, 15):
        model = KMeans(n_clusters=k, n_init=50, random_state=42).fit(X); labels = model.labels_
        if np.bincount(labels, minlength=k).min() < 10: continue
        metrics = category_metrics(rows, labels); silhouette = float(silhouette_score(X, labels, metric="cosine"))
        candidates.append((silhouette + 0.25 * metrics["category_mix_entropy"], model, labels, {"silhouette": silhouette, **metrics}))
    if not candidates: raise RuntimeError("no axis-first candidate met the 10-product minimum")
    return max(candidates, key=lambda item: item[0])


def persist(client: Any, rows: list[dict[str, Any]], X: np.ndarray, pca: PCA, vocabulary: list[str], category_means: dict[str, np.ndarray], axis_means: np.ndarray, axis_scales: np.ndarray, profile: str, weights: dict[str, float], model: KMeans, labels: np.ndarray, selection: float, metrics: dict[str, float]) -> str:
    centers = np.vstack([unit(center) for center in model.cluster_centers_])
    version = client.table("style_cluster_model_versions").insert({"status": "draft", "algorithm": "spherical_kmeans", "is_operational": True, "selection_score": selection, "feature_config": {"profile_name": profile, "image_dimensions": int(pca.n_components_), "fact_vocabulary": vocabulary, "weights": weights, "core_categories": sorted(CORE), "axis_keys": AXES, "image_transform": "category_mean_residual", "category_image_means": {key: value.tolist() for key, value in category_means.items()}, "axis_transform": "global_zscore", "axis_means": axis_means.tolist(), "axis_scales": axis_scales.tolist()}, "pca_mean": pca.mean_.tolist(), "pca_components": pca.components_.tolist(), "temperature": 0.12, "training_stats": {"eligible_products": len(rows), "cluster_count": int(model.n_clusters), "selection_score": selection, **metrics}}).execute().data[0]
    clusters = []
    for ordinal, center in enumerate(centers):
        indices = np.where(labels == ordinal)[0]; axes = [effective(rows[index], "human_style_axes", "style_axes") for index in indices]; facts = [effective(rows[index], "human_style_attributes", "style_attributes") or {} for index in indices]
        clusters.append({"model_version_id": version["id"], "ordinal": ordinal, "centroid": center.tolist(), "product_count": int(len(indices)), "mean_distance": float(np.mean(1 - X[indices] @ center)), "axis_summary": {key: float(np.mean([float(item.get(key, 4)) for item in axes])) for key in AXES}, "fact_summary": {key: [value for value, _ in Counter(value for item in facts for value in (item.get(key) if isinstance(item.get(key), list) else [item.get(key)]) if value).most_common(3)] for key in FACTS}})
    client.table("style_clusters").insert(clusters).execute()
    distances = 1 - X @ centers.T; probabilities = np.exp(-distances / 0.12); probabilities /= probabilities.sum(axis=1, keepdims=True)
    client.table("product_style_cluster_scores").upsert([{"product_id": int(row["id"]), "model_version_id": version["id"], "cluster_probabilities": {str(index): float(value) for index, value in enumerate(probabilities[row_index])}, "derived_style_tags": {tag: 0.0 for tag in TAGS}, "nearest_distance": float(distances[row_index].min()), "status": "scored"} for row_index, row in enumerate(rows)]).execute()
    return version["id"]


def main() -> None:
    load_dotenv(Path.cwd() / ".env"); client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"]); rows = load_rows(client)
    pca, reduced, vocabulary, category_means, axis_means, axis_scales = base_data(rows); created = []
    for profile, weights in PROFILES:
        X = features(rows, reduced, vocabulary, category_means, axis_means, axis_scales, weights); selection, model, labels, metrics = choose(X, rows)
        created.append({"profile": profile, "version_id": persist(client, rows, X, pca, vocabulary, category_means, axis_means, axis_scales, profile, weights, model, labels, selection, metrics), "clusters": int(model.n_clusters), "selection_score": selection, **metrics})
    print(created)


if __name__ == "__main__": main()
