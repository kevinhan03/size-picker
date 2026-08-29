"""Read-only diagnostic report for the three category-debiased draft models."""
from __future__ import annotations

import os
from collections import Counter, defaultdict
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client


def main() -> None:
    load_dotenv(Path.cwd() / ".env")
    client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    versions = client.table("style_cluster_model_versions").select("id,feature_config,training_stats").in_("id", ["1c5a1b3f-6d97-4237-a045-8afec8fdf02f"]).execute().data or []
    ids = [version["id"] for version in versions]
    scores = client.table("product_style_cluster_scores").select("product_id,model_version_id,cluster_probabilities").in_("model_version_id", ids).execute().data or []
    products = client.table("products").select("id,name,brand,category").in_("id", list({score["product_id"] for score in scores})).execute().data or []
    product_by_id = {str(product["id"]): product for product in products}
    for version in sorted(versions, key=lambda item: item["feature_config"]["profile_name"]):
        assignments: dict[int, list[tuple[dict, float]]] = defaultdict(list)
        for score in scores:
            if score["model_version_id"] != version["id"]: continue
            ordinal, probability = max(score["cluster_probabilities"].items(), key=lambda item: float(item[1]))
            product = product_by_id.get(str(score["product_id"]))
            if product: assignments[int(ordinal)].append((product, float(probability)))
        print("\n" + "=" * 80)
        print(version["feature_config"]["profile_name"], version["training_stats"])
        for ordinal, entries in sorted(assignments.items()):
            counts = Counter(product["category"] for product, _ in entries)
            representative = sorted(entries, key=lambda item: item[1], reverse=True)[:3]
            names = " | ".join(f"{product['category']}:{product.get('brand', '')} {product.get('name', '')}" for product, _ in representative)
            print(f"C{ordinal + 1}: {len(entries)} | {dict(counts)} | {names}")


if __name__ == "__main__":
    main()
