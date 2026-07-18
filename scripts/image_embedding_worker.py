"""Private HTTP worker for product image embeddings.

Run locally with:
  uvicorn scripts.image_embedding_worker:app --host 127.0.0.1 --port 8001

The worker keeps the FashionSigLIP model warm and writes the same 768-dimension
pgvector value used by the existing batch embedding script.
"""

from __future__ import annotations

import hmac
import os
import threading
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from supabase import create_client

from scripts.batch_embed_pants import (
    DEFAULT_BUCKET,
    DEFAULT_TABLE,
    download_product_image,
    embed_image,
    load_model,
    vector_literal,
)


load_dotenv()
WORKER_SECRET = os.getenv("IMAGE_EMBEDDING_WORKER_SECRET", "").strip()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
PRODUCTS_TABLE = os.getenv("SUPABASE_PRODUCTS_TABLE", DEFAULT_TABLE).strip() or DEFAULT_TABLE
STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", DEFAULT_BUCKET).strip() or DEFAULT_BUCKET

model_state: dict[str, Any] = {}
embedding_lock = threading.Lock()


def assert_configuration() -> None:
    if not WORKER_SECRET:
        raise RuntimeError("IMAGE_EMBEDDING_WORKER_SECRET is required")
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")


@asynccontextmanager
async def lifespan(_: FastAPI):
    assert_configuration()
    processor, model, device = load_model()
    model_state.update({"processor": processor, "model": model, "device": device})
    yield
    model_state.clear()


app = FastAPI(title="Size Picker image embedding worker", lifespan=lifespan)


class EmbedProductRequest(BaseModel):
    product_id: str = Field(alias="productId", min_length=1, max_length=128)


def authorize(value: str | None) -> None:
    if not value or not hmac.compare_digest(value, WORKER_SECRET):
        raise HTTPException(status_code=401, detail="unauthorized")


def fetch_product(client: Any, product_id: str) -> dict[str, Any] | None:
    response = (
        client.table(PRODUCTS_TABLE)
        .select("id,image_path,image_embedding")
        .eq("id", product_id)
        .limit(1)
        .execute()
    )
    rows = list(response.data or [])
    return rows[0] if rows else None


def embed_product(product_id: str) -> dict[str, Any]:
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    product = fetch_product(client, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="product_not_found")
    if product.get("image_embedding"):
        return {"ok": True, "status": "skipped", "productId": product_id}

    image_path = str(product.get("image_path") or "").strip()
    if not image_path:
        raise HTTPException(status_code=422, detail="missing_image_path")

    image = download_product_image(client, SUPABASE_URL, STORAGE_BUCKET, image_path, 3600)
    with embedding_lock:
        embedding = embed_image(model_state["processor"], model_state["model"], model_state["device"], image)
    client.table(PRODUCTS_TABLE).update({"image_embedding": vector_literal(embedding)}).eq("id", product_id).execute()
    return {"ok": True, "status": "embedded", "productId": product_id}


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": bool(model_state)}


@app.post("/v1/product-image-embeddings")
def create_product_image_embedding(
    payload: EmbedProductRequest,
    x_embedding_worker_secret: str | None = Header(default=None),
) -> dict[str, Any]:
    authorize(x_embedding_worker_secret)
    return embed_product(payload.product_id.strip())
