"""
Batch-tag Bottom product images with Gemini style confidence scores.

Usage:
  python scripts/batch_tag_pants.py
  python scripts/batch_tag_pants.py --limit 5
  python scripts/batch_tag_pants.py --force
  python scripts/batch_tag_pants.py --dry-run --limit 3
  python scripts/batch_tag_pants.py --category 바지
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import quote, unquote, urlparse

import google.generativeai as genai
import requests
from dotenv import load_dotenv
from PIL import Image, UnidentifiedImageError
from supabase import create_client


MODEL_NAME = "gemini-3.1-flash-lite"
DEFAULT_CATEGORY = "Bottom"
DEFAULT_BUCKET = "product-assets"
DEFAULT_TABLE = "products"
DEFAULT_SIGNED_URL_TTL_SECONDS = 60
DEFAULT_DELAY_SECONDS = 0.75
REQUEST_TIMEOUT_SECONDS = 30

STYLE_TAGS = [
    "캐주얼",
    "미니멀",
    "스트릿",
    "클래식",
    "빈티지",
    "레트로",
    "로맨틱",
    "스포티",
    "프레피",
    "워크웨어",
]

STYLE_TAG_SCHEMA = {
    "type": "object",
    "properties": {tag: {"type": "number"} for tag in STYLE_TAGS},
    "required": STYLE_TAGS,
}

PROMPT_TEMPLATE = """
당신은 패션 상품 이미지를 분석해서 스타일을 태깅하는 전문가입니다.

주어진 상품 이미지를 보고, 아래 10개의 스타일 태그 각각에 대해
이 상품이 해당 스타일에 얼마나 부합하는지 0.0~1.0 사이의 confidence score를 매겨주세요.

[태그 목록]
캐주얼, 미니멀, 스트릿, 클래식, 빈티지, 레트로, 로맨틱, 스포티, 프레피, 워크웨어

[참고 정보]
브랜드: {brand_name}
상품명: {product_name}

[중요 규칙]
1. 하나의 상품은 여러 태그에 동시에 높은 점수를 받을 수 있습니다 (다중 라벨).
   예: 카고팬츠는 워크웨어 0.7, 스포티 0.6, 스트릿 0.4가 동시에 나올 수 있음.
2. 확신이 없으면 낮은 점수(0.1~0.2)를 주세요. 억지로 모든 태그에 높은 점수를 주지 마세요.
3. 이미지에서 직접 보이는 시각적 특징(실루엣, 색감, 소재감, 디테일)을 우선 근거로 판단하고,
   브랜드/상품명 텍스트는 보조 참고자료로만 활용하세요.
4. "빈티지"와 "레트로"는 다르게 판단하세요.
   - 빈티지: 실제 옛날 옷 같은 워싱/색바램/오래된 느낌
   - 레트로: 과거 시대 디자인을 현대적으로 재해석한 느낌
5. 반드시 아래 JSON 형식으로만 답하세요. 다른 설명은 절대 추가하지 마세요.

[출력 형식]
{{"캐주얼": 0.0, "미니멀": 0.0, "스트릿": 0.0, "클래식": 0.0, "빈티지": 0.0, "레트로": 0.0, "로맨틱": 0.0, "스포티": 0.0, "프레피": 0.0, "워크웨어": 0.0}}
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Tag Supabase Bottom product images into products.style_tags."
    )
    parser.add_argument("--category", default=DEFAULT_CATEGORY)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--bucket", default="")
    parser.add_argument("--signed-url-ttl", type=int, default=DEFAULT_SIGNED_URL_TTL_SECONDS)
    parser.add_argument("--delay-seconds", type=float, default=DEFAULT_DELAY_SECONDS)
    return parser.parse_args()


def parse_bool(value: str, default: bool = True) -> bool:
    normalized = str(value or "").strip().lower()
    if not normalized:
        return default
    if normalized in {"1", "true", "yes", "y", "on"}:
        return True
    if normalized in {"0", "false", "no", "n", "off"}:
        return False
    raise RuntimeError(f"Invalid boolean value: {value!r}")


def load_env() -> dict[str, Any]:
    load_dotenv(Path.cwd() / ".env")
    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    products_table = os.getenv("SUPABASE_PRODUCTS_TABLE", DEFAULT_TABLE).strip() or DEFAULT_TABLE
    storage_bucket = os.getenv("SUPABASE_STORAGE_BUCKET", DEFAULT_BUCKET).strip() or DEFAULT_BUCKET
    bucket_public = parse_bool(os.getenv("SUPABASE_BUCKET_PUBLIC", "true"), default=True)

    missing = [
        name
        for name, value in {
            "GEMINI_API_KEY": gemini_api_key,
            "SUPABASE_URL": supabase_url,
            "SUPABASE_SERVICE_ROLE_KEY": service_role_key,
        }.items()
        if not value
    ]
    if missing:
        raise RuntimeError(f"Missing required .env value(s): {', '.join(missing)}")

    return {
        "gemini_api_key": gemini_api_key,
        "supabase_url": supabase_url.rstrip("/"),
        "service_role_key": service_role_key,
        "products_table": products_table,
        "storage_bucket": storage_bucket,
        "bucket_public": bucket_public,
    }


def is_http_url(value: str) -> bool:
    normalized = str(value or "").strip().lower()
    return normalized.startswith("http://") or normalized.startswith("https://")


def get_public_storage_url(supabase_url: str, bucket: str, image_path: str) -> str:
    encoded_path = quote(image_path.strip().lstrip("/"), safe="/")
    encoded_bucket = quote(bucket.strip(), safe="")
    return f"{supabase_url}/storage/v1/object/public/{encoded_bucket}/{encoded_path}"


def extract_storage_path_from_url(url: str, bucket: str) -> str:
    parsed = urlparse(url)
    path_parts = [unquote(part) for part in parsed.path.split("/") if part]
    try:
        object_index = path_parts.index("object")
    except ValueError as exc:
        raise RuntimeError("URL is not a Supabase Storage object URL") from exc

    remaining = path_parts[object_index + 1 :]
    if remaining and remaining[0] in {"public", "sign", "authenticated"}:
        remaining = remaining[1:]
    if not remaining:
        raise RuntimeError("URL does not include a storage bucket")

    url_bucket = remaining[0]
    if url_bucket != bucket:
        raise RuntimeError(f"URL bucket {url_bucket!r} does not match configured bucket {bucket!r}")

    storage_path = "/".join(remaining[1:]).strip().lstrip("/")
    if not storage_path:
        raise RuntimeError("URL does not include a storage object path")
    return storage_path


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
    normalized_path = image_path.strip().lstrip("/")
    response = client.storage.from_(bucket).create_signed_url(normalized_path, ttl)
    return extract_signed_url(response)


def download_image_bytes(url: str) -> bytes:
    response = requests.get(
        url,
        timeout=REQUEST_TIMEOUT_SECONDS,
        headers={
            "Accept": "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
            "User-Agent": "size-picker-style-tagging/1.0",
        },
    )
    response.raise_for_status()
    if not response.content:
        raise RuntimeError("Downloaded image is empty")
    return response.content


def download_product_image(
    client: Any,
    supabase_url: str,
    bucket: str,
    image_path: str,
    bucket_public: bool,
    signed_url_ttl: int,
) -> Image.Image:
    normalized_path = image_path.strip()
    if is_http_url(normalized_path):
        if bucket_public:
            image_bytes = download_image_bytes(normalized_path)
        else:
            try:
                storage_path = extract_storage_path_from_url(normalized_path, bucket)
                signed_url = create_signed_storage_url(client, bucket, storage_path, signed_url_ttl)
                image_bytes = download_image_bytes(signed_url)
            except Exception as signed_error:
                try:
                    image_bytes = download_image_bytes(normalized_path)
                except Exception as direct_error:
                    raise RuntimeError(
                        f"signed URL download failed: {signed_error}; direct download failed: {direct_error}"
                    ) from direct_error
    else:
        if bucket_public:
            image_url = get_public_storage_url(supabase_url, bucket, normalized_path)
        else:
            image_url = create_signed_storage_url(client, bucket, normalized_path, signed_url_ttl)
        image_bytes = download_image_bytes(image_url)

    try:
        return Image.open(BytesIO(image_bytes)).convert("RGB")
    except UnidentifiedImageError as exc:
        raise RuntimeError("Downloaded file is not a valid image") from exc


def fetch_products(client: Any, table: str, category: str, limit: int) -> list[dict[str, Any]]:
    query = (
        client.table(table)
        .select("id,brand,name,category,image_path,style_tags")
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
    return product.get("style_tags") is not None


def extract_response_text(response: Any) -> str:
    text = getattr(response, "text", None)
    if isinstance(text, str) and text.strip():
        return text.strip()
    candidates = getattr(response, "candidates", None) or []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", None) or []
        for part in parts:
            part_text = getattr(part, "text", None)
            if isinstance(part_text, str) and part_text.strip():
                return part_text.strip()
    raise RuntimeError("Gemini returned empty text")


def extract_json_object(raw_text: str) -> str:
    stripped = raw_text.strip()
    if stripped.startswith("{") and stripped.endswith("}"):
        return stripped

    start = stripped.find("{")
    if start < 0:
        raise RuntimeError("No JSON object found in Gemini response")

    depth = 0
    in_string = False
    escaped = False
    for index in range(start, len(stripped)):
        char = stripped[index]
        if escaped:
            escaped = False
            continue
        if char == "\\":
            escaped = True
            continue
        if char == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return stripped[start : index + 1]

    raise RuntimeError("JSON object in Gemini response is not balanced")


def normalize_style_tags(value: Any) -> dict[str, float]:
    if not isinstance(value, dict):
        raise RuntimeError("Gemini response JSON is not an object")

    missing = [tag for tag in STYLE_TAGS if tag not in value]
    extra = [key for key in value.keys() if key not in STYLE_TAGS]
    if missing:
        raise RuntimeError(f"Gemini response is missing style tag(s): {', '.join(missing)}")
    if extra:
        raise RuntimeError(f"Gemini response contains unexpected key(s): {', '.join(map(str, extra))}")

    normalized: dict[str, float] = {}
    for tag in STYLE_TAGS:
        score = value[tag]
        if isinstance(score, bool):
            raise RuntimeError(f"Style tag {tag!r} score must be numeric, got boolean")
        number = float(score)
        if not 0.0 <= number <= 1.0:
            raise RuntimeError(f"Style tag {tag!r} score {number} is outside 0.0-1.0")
        normalized[tag] = number

    return normalized


def parse_style_tags(raw_text: str) -> dict[str, float]:
    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        parsed = json.loads(extract_json_object(raw_text))
    return normalize_style_tags(parsed)


def tag_product_image(model: Any, image: Image.Image, brand: str, name: str) -> dict[str, float]:
    prompt = PROMPT_TEMPLATE.format(brand_name=brand, product_name=name)
    response = model.generate_content(
        [prompt, image],
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": STYLE_TAG_SCHEMA,
        },
    )
    return parse_style_tags(extract_response_text(response))


def update_style_tags(client: Any, table: str, product_id: Any, style_tags: dict[str, float]) -> None:
    client.table(table).update({"style_tags": style_tags}).eq("id", product_id).execute()


def main() -> int:
    args = parse_args()
    env = load_env()
    bucket = args.bucket.strip() or env["storage_bucket"]
    client = create_client(env["supabase_url"], env["service_role_key"])

    genai.configure(api_key=env["gemini_api_key"])
    model = genai.GenerativeModel(MODEL_NAME)

    products = fetch_products(client, env["products_table"], args.category, args.limit)
    total = len(products)
    if total == 0:
        print(f"No products found for category={args.category!r}.")
        return 0

    print(
        f"Found {total} products category={args.category!r}, bucket={bucket!r}, "
        f"bucket_public={env['bucket_public']}, dry_run={args.dry_run}, force={args.force}."
    )

    tagged_count = 0
    skipped_count = 0
    failed_count = 0

    for index, product in enumerate(products, start=1):
        product_id = product.get("id")
        brand = str(product.get("brand") or "").strip()
        name = str(product.get("name") or "").strip()
        image_path = str(product.get("image_path") or "").strip()

        if should_skip(product, args.force):
            skipped_count += 1
            print(f"{index}/{total} 처리 완료 product_id={product_id} status=skipped")
            continue

        if not image_path:
            failed_count += 1
            print(f"{index}/{total} 처리 실패 product_id={product_id} reason=missing image_path")
            continue

        try:
            image = download_product_image(
                client,
                env["supabase_url"],
                bucket,
                image_path,
                env["bucket_public"],
                args.signed_url_ttl,
            )
            style_tags = tag_product_image(model, image, brand, name)
            if not args.dry_run:
                update_style_tags(client, env["products_table"], product_id, style_tags)
            tagged_count += 1
            status = "태깅 완료(dry-run)" if args.dry_run else "태깅 완료"
            print(f"{index}/{total} {status} product_id={product_id}")
        except Exception as exc:
            failed_count += 1
            print(f"{index}/{total} 처리 실패 product_id={product_id} reason={exc}")

        delay_seconds = max(0.0, float(args.delay_seconds or 0.0))
        if delay_seconds > 0 and index < total:
            time.sleep(delay_seconds)

    print(
        "Complete. "
        f"tagged={tagged_count}, skipped={skipped_count}, failed={failed_count}, total={total}"
    )
    return 1 if failed_count else 0


if __name__ == "__main__":
    sys.exit(main())
