"""Create comparable draft style-cluster candidates; never activates a model."""
from __future__ import annotations

import os
from collections import Counter
from pathlib import Path
from typing import Any

import numpy as np
from dotenv import load_dotenv
from sklearn.cluster import HDBSCAN, KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.mixture import GaussianMixture
from supabase import create_client

CORE = {"Top", "Bottom", "Outer", "DressSkirt", "Shoes"}
AXES = ["formality", "refinement", "technicality", "historical_orientation", "visual_boldness", "affective_softness", "unconventionality", "sensuality"]
FACTS = ["primary_color", "accent_colors", "color_saturation", "primary_material", "pattern", "surface_finish", "surface_character", "surface_treatment"]
TAGS = ["casual", "minimal", "street", "classic", "vintage", "lovely_romantic", "sporty", "workwear_gorpcore", "chic_modern", "glam_sexy"]
WEIGHTS = {"image": 0.65, "axes": 0.20, "facts": 0.15}


def unit(value: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(value)
    return value / norm if norm else np.zeros_like(value)


def parse_embedding(value: Any) -> list[float]:
    if isinstance(value, list): return [float(item) for item in value]
    if isinstance(value, str): return [float(item) for item in value.strip("[]").split(",") if item.strip()]
    return []


def effective(row: dict[str, Any], human: str, ai: str) -> Any:
    return row.get(human) if row.get("tag_review_status") in {"approved", "edited"} and row.get(human) else row.get(ai)


def load_rows(client: Any) -> list[dict[str, Any]]:
    response = client.table(os.getenv("SUPABASE_PRODUCTS_TABLE", "products")).select("id,category,image_embedding,style_axes,human_style_axes,style_attributes,human_style_attributes,tag_review_status").execute()
    return [row for row in response.data or [] if row.get("category") in CORE and parse_embedding(row.get("image_embedding")) and effective(row, "human_style_axes", "style_axes")]


def make_features(rows: list[dict[str, Any]]) -> tuple[np.ndarray, PCA, list[str]]:
    vocabulary = sorted({f"{key}:{value}" for row in rows for key in FACTS for raw in [(effective(row, "human_style_attributes", "style_attributes") or {}).get(key)] for value in (raw if isinstance(raw, list) else [raw]) if isinstance(value, str) and value})
    images = np.array([parse_embedding(row["image_embedding"]) for row in rows])
    pca = PCA(n_components=min(64, len(rows) - 1, images.shape[1]), random_state=42).fit(images)
    reduced = pca.transform(images)
    features = []
    for index, row in enumerate(rows):
        axes = effective(row, "human_style_axes", "style_axes")
        facts = effective(row, "human_style_attributes", "style_attributes") or {}
        axis_vector = np.array([(float(axes.get(key, 4)) - 4) / 3 for key in AXES])
        fact_vector = np.array([float(entry.split(":", 1)[1] in (facts.get(entry.split(":", 1)[0]) if isinstance(facts.get(entry.split(":", 1)[0]), list) else [facts.get(entry.split(":", 1)[0])])) for entry in vocabulary])
        features.append(unit(np.concatenate([unit(reduced[index]) * np.sqrt(WEIGHTS["image"]), unit(axis_vector) * np.sqrt(WEIGHTS["axes"]), unit(fact_vector) * np.sqrt(WEIGHTS["facts"])])))
    return np.vstack(features), pca, vocabulary


def choose_fixed(X: np.ndarray, algorithm: str) -> tuple[np.ndarray, np.ndarray, float, dict[str, Any]]:
    candidates = []
    for k in range(8, 15):
        if algorithm == "spherical_kmeans":
            fitted = KMeans(n_clusters=k, n_init=30, random_state=42).fit(X); labels = fitted.labels_; centers = fitted.cluster_centers_; extra = {}
        else:
            fitted = GaussianMixture(n_components=k, covariance_type="diag", n_init=10, random_state=42).fit(X); labels = fitted.predict(X); centers = fitted.means_; extra = {"bic": float(fitted.bic(X))}
        counts = np.bincount(labels, minlength=k)
        if counts.min() < 10: continue
        score = float(silhouette_score(X, labels, metric="cosine"))
        candidates.append((score, centers, labels, extra))
    if not candidates: raise RuntimeError(f"{algorithm} produced no candidate with at least 10 products per cluster")
    return max(candidates, key=lambda item: item[0])[1], max(candidates, key=lambda item: item[0])[2], max(candidates, key=lambda item: item[0])[0], max(candidates, key=lambda item: item[0])[3]


def hdbscan_candidate(X: np.ndarray) -> tuple[np.ndarray, np.ndarray, float, dict[str, Any]]:
    labels = HDBSCAN(min_cluster_size=10, min_samples=5, metric="euclidean", allow_single_cluster=False).fit_predict(X)
    active = sorted(label for label in set(labels) if label >= 0)
    if len(active) < 2: raise RuntimeError("HDBSCAN found fewer than two stable clusters")
    remap = {label: index for index, label in enumerate(active)}
    remapped = np.array([remap.get(label, -1) for label in labels])
    centers = np.vstack([unit(X[remapped == index].mean(axis=0)) for index in range(len(active))])
    clustered = remapped >= 0
    score = float(silhouette_score(X[clustered], remapped[clustered], metric="cosine")) if clustered.sum() > len(active) else -1.0
    return centers, remapped, score, {"noise_count": int((~clustered).sum()), "noise_ratio": float((~clustered).mean())}


def persist(client: Any, rows: list[dict[str, Any]], X: np.ndarray, pca: PCA, vocabulary: list[str], algorithm: str, centers: np.ndarray, labels: np.ndarray, score: float, extra: dict[str, Any]) -> str:
    operational = algorithm == "spherical_kmeans"
    version = client.table("style_cluster_model_versions").insert({"status": "draft", "algorithm": algorithm, "is_operational": operational, "selection_score": score, "feature_config": {"image_dimensions": int(pca.n_components_), "fact_vocabulary": vocabulary, "weights": WEIGHTS, "core_categories": sorted(CORE), "axis_keys": AXES, "comparison_only": not operational}, "pca_mean": pca.mean_.tolist(), "pca_components": pca.components_.tolist(), "temperature": 0.12, "training_stats": {"eligible_products": len(rows), "cluster_count": len(centers), "silhouette": score, **extra}}).execute().data[0]
    clusters = []
    for ordinal, center in enumerate(centers):
        indices = np.where(labels == ordinal)[0]
        axes = [effective(rows[index], "human_style_axes", "style_axes") for index in indices]
        facts = [effective(rows[index], "human_style_attributes", "style_attributes") or {} for index in indices]
        clusters.append({"model_version_id": version["id"], "ordinal": ordinal, "centroid": center.tolist(), "product_count": int(len(indices)), "mean_distance": float(np.mean(1 - X[indices] @ center)) if len(indices) else None, "axis_summary": {key: float(np.mean([float(item.get(key, 4)) for item in axes])) for key in AXES}, "fact_summary": {key: [value for value, _ in Counter(value for item in facts for value in (item.get(key) if isinstance(item.get(key), list) else [item.get(key)]) if value).most_common(3)] for key in FACTS}})
    client.table("style_clusters").insert(clusters).execute()
    distances = 1 - X @ centers.T; weights = np.exp(-distances / 0.12); weights /= weights.sum(axis=1, keepdims=True)
    client.table("product_style_cluster_scores").upsert([{"product_id": int(row["id"]), "model_version_id": version["id"], "cluster_probabilities": {str(index): float(value) for index, value in enumerate(weights[row_index])}, "derived_style_tags": {tag: 0.0 for tag in TAGS}, "nearest_distance": float(distances[row_index].min()), "status": "scored"} for row_index, row in enumerate(rows)]).execute()
    return version["id"]


def main() -> None:
    load_dotenv(Path.cwd() / ".env")
    client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    rows = load_rows(client); X, pca, vocabulary = make_features(rows)
    created = []
    for algorithm in ("spherical_kmeans", "gaussian_mixture"):
        centers, labels, score, extra = choose_fixed(X, algorithm)
        created.append({"algorithm": algorithm, "version_id": persist(client, rows, X, pca, vocabulary, algorithm, centers, labels, score, extra), "clusters": len(centers), "score": score})
    centers, labels, score, extra = hdbscan_candidate(X)
    created.append({"algorithm": "hdbscan", "version_id": persist(client, rows, X, pca, vocabulary, "hdbscan", centers, labels, score, extra), "clusters": len(centers), "score": score, **extra})
    print(created)


if __name__ == "__main__": main()
