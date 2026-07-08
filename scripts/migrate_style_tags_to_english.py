"""
Migrate legacy Korean style tag JSON keys to the current English style taxonomy.

Usage:
  .venv312/bin/python scripts/migrate_style_tags_to_english.py --dry-run
  .venv312/bin/python scripts/migrate_style_tags_to_english.py
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from supabase import create_client


DEFAULT_TABLE = "products"

STYLE_TAGS = [
    "casual",
    "minimal",
    "street",
    "classic",
    "vintage",
    "lovely_romantic",
    "sporty",
    "workwear_gorpcore",
    "chic_modern",
    "glam_sexy",
]

LEGACY_STYLE_TAG_MAP = {
    "캐주얼": "casual",
    "미니멀": "minimal",
    "스트릿": "street",
    "클래식": "classic",
    "빈티지": "vintage",
    "레트로": "vintage",
    "로맨틱": "lovely_romantic",
    "스포티": "sporty",
    "프레피": "classic",
    "워크웨어": "workwear_gorpcore",
}

TAG_COLUMNS = ["style_tags", "human_style_tags"]
EVIDENCE_COLUMNS = ["style_tags_evidence", "human_style_tags_evidence"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Migrate style tag JSON keys to English taxonomy.")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    return parser.parse_args()


def load_env() -> dict[str, str]:
    load_dotenv(Path.cwd() / ".env.local")
    load_dotenv(Path.cwd() / ".env")

    supabase_url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    table = os.getenv("SUPABASE_PRODUCTS_TABLE", DEFAULT_TABLE).strip() or DEFAULT_TABLE
    missing = [
        name
        for name, value in {
            "SUPABASE_URL": supabase_url,
            "SUPABASE_SERVICE_ROLE_KEY": service_role_key,
        }.items()
        if not value
    ]
    if missing:
        raise RuntimeError(f"Missing required .env value(s): {', '.join(missing)}")

    return {
        "supabase_url": supabase_url,
        "service_role_key": service_role_key,
        "table": table,
    }


def normalize_score_tags(value: Any) -> dict[str, float] | None:
    if value is None:
        return None
    if not isinstance(value, dict):
        return {tag: 0.0 for tag in STYLE_TAGS}

    output = {tag: 0.0 for tag in STYLE_TAGS}
    for raw_key, raw_score in value.items():
        key = str(raw_key or "").strip()
        target_key = key if key in STYLE_TAGS else LEGACY_STYLE_TAG_MAP.get(key)
        if not target_key:
            continue
        if isinstance(raw_score, bool):
            continue
        try:
            score = float(raw_score)
        except (TypeError, ValueError):
            continue
        if 0.0 <= score <= 1.0:
            output[target_key] = max(output[target_key], score)

    return output


def normalize_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    output = []
    for item in value:
        text = str(item or "").strip()
        if text:
            output.append(text[:240])
    return output[:12]


def normalize_evidence(value: Any) -> dict[str, list[str]] | None:
    if value is None:
        return None
    if not isinstance(value, dict):
        return {tag: [] for tag in STYLE_TAGS}

    output = {tag: [] for tag in STYLE_TAGS}
    for raw_key, raw_items in value.items():
        key = str(raw_key or "").strip()
        target_key = key if key in STYLE_TAGS else LEGACY_STYLE_TAG_MAP.get(key)
        if not target_key:
            continue
        merged = [*output[target_key], *normalize_string_list(raw_items)]
        seen = set()
        output[target_key] = [
            item
            for item in merged
            if item and not (item in seen or seen.add(item))
        ][:12]

    return output


def build_update_payload(row: dict[str, Any]) -> dict[str, Any]:
    payload: dict[str, Any] = {}

    for column in TAG_COLUMNS:
        if column in row:
            normalized = normalize_score_tags(row.get(column))
            if normalized is not None and normalized != row.get(column):
                payload[column] = normalized

    for column in EVIDENCE_COLUMNS:
        if column in row:
            normalized = normalize_evidence(row.get(column))
            if normalized is not None and normalized != row.get(column):
                payload[column] = normalized

    return payload


def main() -> int:
    args = parse_args()
    env = load_env()
    client = create_client(env["supabase_url"], env["service_role_key"])

    query = (
        client.table(env["table"])
        .select("id,style_tags,style_tags_evidence,human_style_tags,human_style_tags_evidence")
        .order("id", desc=False)
    )
    if args.limit > 0:
        query = query.limit(args.limit)

    rows = list(query.execute().data or [])
    changed = 0
    updated = 0
    failed = 0

    for row in rows:
        product_id = row.get("id")
        payload = build_update_payload(row)
        if not payload:
            continue

        changed += 1
        print(f"product_id={product_id} columns={','.join(payload.keys())}")

        if args.dry_run:
            continue

        try:
            client.table(env["table"]).update(payload).eq("id", product_id).execute()
            updated += 1
        except Exception as exc:
            failed += 1
            print(f"  failed: {exc}")

    print(
        f"Complete. scanned={len(rows)}, changed={changed}, "
        f"updated={updated}, failed={failed}, dry_run={args.dry_run}"
    )
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
