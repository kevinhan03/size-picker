"""Read-only cohesion analysis of legacy style tags inside axes-primary clusters."""
from __future__ import annotations

import os
from collections import Counter
from pathlib import Path
from typing import Any

import numpy as np
from dotenv import load_dotenv
from supabase import create_client

VERSION_ID = "e5bca123-0a3b-42d0-85d5-59f0f3265ae8"
TAGS = ["casual", "minimal", "street", "classic", "vintage", "lovely_romantic", "sporty", "workwear_gorpcore", "chic_modern", "glam_sexy"]
RNG = np.random.default_rng(42)


def unit(values: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(values)
    return values / norm if norm else np.zeros_like(values)


def cohesion(values: np.ndarray) -> float:
    if len(values) < 2: return float("nan")
    normalized = np.vstack([unit(value) for value in values])
    return float((normalized @ normalized.T)[np.triu_indices(len(values), 1)].mean())


def main() -> None:
    load_dotenv(Path.cwd() / ".env")
    client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    scores = client.table("product_style_cluster_scores").select("product_id,cluster_probabilities").eq("model_version_id", VERSION_ID).execute().data or []
    product_ids = [score["product_id"] for score in scores]
    products = client.table("products").select("id,category,style_tags").in_("id", product_ids).execute().data or []
    products_by_id = {str(product["id"]): product for product in products}
    rows = []
    for score in scores:
        product = products_by_id.get(str(score["product_id"])); tags = product.get("style_tags") if product else None
        if not isinstance(tags, dict) or not all(key in tags for key in TAGS): continue
        ordinal, probability = max(score["cluster_probabilities"].items(), key=lambda item: float(item[1]))
        rows.append({"cluster": int(ordinal), "category": product["category"], "probability": float(probability), "vector": np.array([float(tags[key] or 0) for key in TAGS])})
    pools: dict[str, np.ndarray] = {}
    for category in {row["category"] for row in rows}:
        pools[category] = np.vstack([row["vector"] for row in rows if row["category"] == category])
    global_cohesion = cohesion(np.vstack([row["vector"] for row in rows]))
    print(f"products={len(rows)} global_pairwise_cosine={global_cohesion:.4f}")
    for ordinal in sorted({row["cluster"] for row in rows}):
        members = [row for row in rows if row["cluster"] == ordinal]
        vectors = np.vstack([row["vector"] for row in members]); observed = cohesion(vectors)
        counts = Counter(row["category"] for row in members)
        # Same category composition, sampled repeatedly: tests whether cohesion is
        # above what category mix alone would explain.
        baseline = []
        for _ in range(500):
            sampled = np.vstack([pools[category][RNG.choice(len(pools[category]), size=count, replace=len(pools[category]) < count)] for category, count in counts.items()])
            baseline.append(cohesion(sampled))
        mean = vectors.mean(axis=0); std = vectors.std(axis=0)
        top = sorted(range(len(TAGS)), key=lambda index: mean[index], reverse=True)[:3]
        print({
            "cluster": ordinal + 1,
            "n": len(members),
            "categories": dict(counts),
            "legacy_cosine": round(observed, 4),
            "matched_category_baseline": round(float(np.mean(baseline)), 4),
            "lift": round(observed - float(np.mean(baseline)), 4),
            "mean_max_probability": round(float(np.mean([row["probability"] for row in members])), 4),
            "top_tags": [{"tag": TAGS[index], "mean": round(float(mean[index]), 3), "std": round(float(std[index]), 3)} for index in top],
        })


if __name__ == "__main__":
    main()
