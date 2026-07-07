"""
Batch-embed Bottom product images with Marqo/marqo-fashionSigLIP.

Usage:
  python scripts/batch_embed_pants.py
  python scripts/batch_embed_pants.py --limit 5
  python scripts/batch_embed_pants.py --force
  python scripts/batch_embed_pants.py --dry-run --limit 3
"""

from __future__ import annotations

import argparse
import os
import sys
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests
import torch
from dotenv import load_dotenv
from PIL import Image, UnidentifiedImageError
from supabase import create_client
from tqdm import tqdm
from transformers import AutoModel, AutoProcessor


MODEL_NAME = "Marqo/marqo-fashionSigLIP"
EMBEDDING_DIM = 768
DEFAULT_CATEGORY = "Bottom"
DEFAULT_BUCKET = "product-assets"
DEFAULT_TABLE = "products"
REQUEST_TIMEOUT_SECONDS = 30


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Embed Supabase Bottom product images into products.image_embedding."
    )
    parser.add_argument("--category", default=DEFAULT_CATEGORY)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--bucket", default="")
    parser.add_argument("--signed-url-ttl", type=int, default=3600)
    return parser.parse_args()


def load_env() -> dict[str, str]:
    load_dotenv(Path.cwd() / ".env")
    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    products_table = os.getenv("SUPABASE_PRODUCTS_TABLE", DEFAULT_TABLE).strip() or DEFAULT_TABLE
    storage_bucket = os.getenv("SUPABASE_STORAGE_BUCKET", DEFAULT_BUCKET).strip() or DEFAULT_BUCKET

    if not supabase_url or not service_role_key:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")

    return {
        "supabase_url": supabase_url.rstrip("/"),
        "service_role_key": service_role_key,
        "products_table": products_table,
        "storage_bucket": storage_bucket,
    }


def is_http_url(value: str) -> bool:
    normalized = str(value or "").strip().lower()
    return normalized.startswith("http://") or normalized.startswith("https://")


def get_public_storage_url(supabase_url: str, bucket: str, image_path: str) -> str:
    encoded_path = quote(image_path.strip().lstrip("/"), safe="/")
    encoded_bucket = quote(bucket.strip(), safe="")
    return f"{supabase_url}/storage/v1/object/public/{encoded_bucket}/{encoded_path}"


def extract_signed_url(response: Any) -> str:
    if isinstance(response, str):
        return response
    if isinstance(response, dict):
        signed_url = response.get("signedURL") or response.get("signed_url") or response.get("url")
        if signed_url:
            return str(signed_url)
        data = response.get("data")
        if isinstance(data, dict):
            signed_url = data.get("signedURL") or data.get("signed_url") or data.get("url")
            if signed_url:
                return str(signed_url)
    signed_url = getattr(response, "signed_url", None) or getattr(response, "signedURL", None)
    if signed_url:
        return str(signed_url)
    raise RuntimeError(f"Could not read signed URL from Supabase response: {response!r}")


def create_signed_storage_url(client: Any, bucket: str, image_path: str, ttl: int) -> str:
    response = client.storage.from_(bucket).create_signed_url(image_path.strip().lstrip("/"), ttl)
    return extract_signed_url(response)


def download_image(url: str) -> Image.Image:
    response = requests.get(
        url,
        timeout=REQUEST_TIMEOUT_SECONDS,
        headers={
            "Accept": "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
            "User-Agent": "size-picker-image-embedding/1.0",
        },
    )
    response.raise_for_status()
    try:
        return Image.open(BytesIO(response.content)).convert("RGB")
    except UnidentifiedImageError as exc:
        raise RuntimeError("Downloaded file is not a valid image") from exc


def download_product_image(
    client: Any,
    supabase_url: str,
    bucket: str,
    image_path: str,
    signed_url_ttl: int,
) -> Image.Image:
    if is_http_url(image_path):
        return download_image(image_path)

    public_url = get_public_storage_url(supabase_url, bucket, image_path)
    try:
        return download_image(public_url)
    except Exception as public_error:
        signed_url = create_signed_storage_url(client, bucket, image_path, signed_url_ttl)
        try:
            return download_image(signed_url)
        except Exception as signed_error:
            raise RuntimeError(
                f"public download failed: {public_error}; signed download failed: {signed_error}"
            ) from signed_error


def load_model() -> tuple[Any, Any, torch.device]:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    processor = AutoProcessor.from_pretrained(MODEL_NAME, trust_remote_code=True)
    original_module_to = torch.nn.Module.to

    def patched_module_to(module: torch.nn.Module, *args: Any, **kwargs: Any) -> torch.nn.Module:
        try:
            return original_module_to(module, *args, **kwargs)
        except NotImplementedError as exc:
            if "meta tensor" not in str(exc):
                raise
            target_device = kwargs.get("device")
            if target_device is None and args:
                target_device = args[0]
            return module.to_empty(device=target_device or "cpu")

    torch.nn.Module.to = patched_module_to
    try:
        model = AutoModel.from_pretrained(MODEL_NAME, trust_remote_code=True)
    finally:
        torch.nn.Module.to = original_module_to
    model.to(device)
    model.eval()
    return processor, model, device


def embed_image(processor: Any, model: Any, device: torch.device, image: Image.Image) -> list[float]:
    processed = processor(images=image, return_tensors="pt")
    pixel_values = processed["pixel_values"].to(device)

    with torch.no_grad():
        features = model.get_image_features(pixel_values, normalize=True)

    embedding = features.detach().cpu().float().squeeze(0).tolist()
    if len(embedding) != EMBEDDING_DIM:
        raise RuntimeError(f"Expected {EMBEDDING_DIM}-dim embedding, got {len(embedding)}")
    return [float(value) for value in embedding]


def vector_literal(embedding: list[float]) -> str:
    return "[" + ",".join(f"{value:.9g}" for value in embedding) + "]"


def fetch_products(client: Any, table: str, category: str, limit: int) -> list[dict[str, Any]]:
    query = (
        client.table(table)
        .select("id,brand,name,category,image_path,image_embedding")
        .eq("category", category)
        .order("id", desc=False)
    )
    if limit > 0:
        query = query.limit(limit)

    response = query.execute()
    return list(response.data or [])


def should_skip(product: dict[str, Any], force: bool) -> bool:
    if force:
        return False
    return bool(product.get("image_embedding"))


def update_embedding(client: Any, table: str, product_id: Any, embedding: list[float]) -> None:
    payload = {
        "image_embedding": vector_literal(embedding),
    }
    client.table(table).update(payload).eq("id", product_id).execute()


def main() -> int:
    args = parse_args()
    env = load_env()
    bucket = args.bucket.strip() or env["storage_bucket"]
    client = create_client(env["supabase_url"], env["service_role_key"])

    products = fetch_products(client, env["products_table"], args.category, args.limit)
    total = len(products)
    if total == 0:
        print(f"No products found for category={args.category!r}.")
        return 0

    print(
        f"Found {total} products category={args.category!r}, bucket={bucket!r}, "
        f"dry_run={args.dry_run}, force={args.force}."
    )
    print(f"Loading model {MODEL_NAME}...")
    processor, model, device = load_model()
    print(f"Model loaded on device={device}.")

    embedded_count = 0
    skipped_count = 0
    failed_count = 0

    for index, product in enumerate(tqdm(products, total=total), start=1):
        product_id = product.get("id")
        image_path = str(product.get("image_path") or "").strip()

        if should_skip(product, args.force):
            skipped_count += 1
            print(f"{index}/{total} processed product_id={product_id} status=skipped")
            continue

        if not image_path:
            failed_count += 1
            print(f"{index}/{total} processed product_id={product_id} status=failed reason=missing image_path")
            continue

        try:
            image = download_product_image(
                client,
                env["supabase_url"],
                bucket,
                image_path,
                args.signed_url_ttl,
            )
            embedding = embed_image(processor, model, device, image)
            if not args.dry_run:
                update_embedding(client, env["products_table"], product_id, embedding)
            embedded_count += 1
            status = "embedded_dry_run" if args.dry_run else "embedded"
            print(f"{index}/{total} processed product_id={product_id} status={status}")
        except Exception as exc:
            failed_count += 1
            print(f"{index}/{total} processed product_id={product_id} status=failed reason={exc}")

    print(
        "Complete. "
        f"embedded={embedded_count}, skipped={skipped_count}, failed={failed_count}, total={total}"
    )
    return 1 if failed_count else 0


if __name__ == "__main__":
    sys.exit(main())
