"""Create a comparison-only style candidate with linear category directions removed."""
from __future__ import annotations

import os
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score
from supabase import create_client

from train_style_cluster_axis_first_candidates import base_data, choose, features, load_rows, persist, unit

WEIGHTS = {"image": 0.20, "axes": 0.65, "facts": 0.15}


def main() -> None:
    load_dotenv(Path.cwd() / ".env")
    client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    rows = load_rows(client)
    pca, reduced, vocabulary, category_means, axis_means, axis_scales = base_data(rows)
    X = features(rows, reduced, vocabulary, category_means, axis_means, axis_scales, WEIGHTS)
    y = np.array([row["category"] for row in rows])
    classifier = LogisticRegression(max_iter=3000, class_weight="balanced", C=1.0, random_state=42)
    folds = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    before = float(cross_val_score(classifier, X, y, cv=folds).mean())
    classifier.fit(X, y)
    _, singular, right = np.linalg.svd(classifier.coef_, full_matrices=False)
    rank = int((singular > singular.max() * 1e-8).sum())
    # Orthogonal complement of the linear category-prediction subspace.
    projection = np.eye(X.shape[1]) - right[:rank].T @ right[:rank]
    projected = np.vstack([unit(vector @ projection) for vector in X])
    after = float(cross_val_score(classifier, projected, y, cv=folds).mean())
    selection, model, labels, metrics = choose(projected, rows)
    version_id = persist(client, rows, projected, pca, vocabulary, category_means, axis_means, axis_scales, "axes-primary-category-nullspace", WEIGHTS, model, labels, selection, {**metrics, "category_classifier_accuracy_before": before, "category_classifier_accuracy_after": after, "removed_category_dimensions": rank})
    version = client.table("style_cluster_model_versions").select("feature_config,training_stats").eq("id", version_id).single().execute().data
    client.table("style_cluster_model_versions").update({"is_operational": False, "feature_config": {**version["feature_config"], "comparison_only": True, "category_projection": "linear_nullspace", "category_projection_matrix": projection.tolist()}, "training_stats": {**version["training_stats"], "category_classifier_accuracy_before": before, "category_classifier_accuracy_after": after, "removed_category_dimensions": rank}}).eq("id", version_id).execute()
    print({"version_id": version_id, "clusters": int(model.n_clusters), "category_accuracy_before": before, "category_accuracy_after": after, "removed_dimensions": rank, **metrics})


if __name__ == "__main__": main()
