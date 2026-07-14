"""
Batch-tag Bottom product images with Gemini style confidence scores.

Usage:
  python scripts/batch_tag_pants.py
  python scripts/batch_tag_pants.py --limit 5
  python scripts/batch_tag_pants.py --force
  python scripts/batch_tag_pants.py --dry-run --limit 3
  python scripts/batch_tag_pants.py --category 바지
  python scripts/batch_tag_pants.py --max-images 4
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
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
DEFAULT_GEMINI_TIMEOUT_SECONDS = 60
DEFAULT_MAX_IMAGES = 4
DEFAULT_REVIEW_EXAMPLE_LIMIT = 6

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
    "워크웨어": "workwear_gorpcore",
}

STYLE_TAG_SCHEMA = {
    "type": "object",
    "properties": {tag: {"type": "number"} for tag in STYLE_TAGS},
    "required": STYLE_TAGS,
}

STYLE_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "style_tags": STYLE_TAG_SCHEMA,
        "style_attributes": {
            "type": "object",
            "properties": {
                "fit": {"type": "string"},
                "silhouette": {"type": "string"},
                "material": {"type": "string"},
                "color": {"type": "string"},
                "wash_texture": {"type": "string"},
                "formality": {"type": "string"},
                "utility_level": {"type": "string"},
                "sportiness": {"type": "string"},
                "decoration_level": {"type": "string"},
                "era_signal": {"type": "string"},
                "details": {"type": "array", "items": {"type": "string"}},
            },
            "required": [
                "fit",
                "silhouette",
                "material",
                "color",
                "wash_texture",
                "details",
                "formality",
                "utility_level",
                "sportiness",
                "decoration_level",
                "era_signal",
            ],
        },
        "evidence": {
            "type": "object",
            "properties": {tag: {"type": "array", "items": {"type": "string"}} for tag in STYLE_TAGS},
        },
        "confidence": {"type": "number"},
    },
    "required": ["style_tags", "style_attributes", "evidence", "confidence"],
}

PROMPT_TEMPLATE = """
당신은 패션 상품 이미지를 분석해서 스타일을 태깅하는 전문가입니다.

주어진 상품 이미지를 보고, 아래 10개의 스타일 태그 각각에 대해
이 상품이 해당 스타일에 얼마나 부합하는지 0.0~1.0 사이의 confidence score를 매겨주세요.

[태그 목록]
casual, minimal, street, classic, vintage, lovely_romantic, sporty, workwear_gorpcore, chic_modern, glam_sexy

[참고 정보]
브랜드: {brand_name}
상품명: {product_name}
상품 상세 후보 텍스트:
{metadata_context}

[사람 검수 예시]
아래 예시는 이전에 AI가 만든 결과를 사람이 검수해 수정/승인한 기준 데이터입니다.
현재 상품과 비슷한 속성이 있으면 이 예시의 "사람 정답"과 "수정 이유"를 일반 규칙보다 더 강하게 참고하세요.
단, 예시와 현재 상품의 시각적 속성이 다르면 억지로 같은 점수를 복사하지 마세요.
{review_examples_context}

[먼저 분석할 객관 속성]
- fit: slim / straight / wide / relaxed / tapered / bootcut / balloon 등
- silhouette: clean / structured / loose / voluminous / draped 등
- material: 이미지와 상품명/상세 텍스트를 함께 보고 반드시 추론하세요.
  denim / washed denim / cotton twill / wool blend / nylon / corduroy / sweat jersey / leather / synthetic blend / unknown 중 가장 가까운 값을 쓰세요.
  비워두면 안 됩니다. 확실하지 않아도 가장 가능성이 높은 소재를 쓰고, 정말 판단 불가일 때만 unknown을 쓰세요.
- color: black / blue / beige / gray / white / washed / vivid 등
- wash_texture: clean / faded / distressed / raw / garment-dyed 등
- details: pleats, cargo pockets, drawstring, elastic waist, side line, hammer loop, crease 등
- formality: casual / smart-casual / formal
- utility_level: none / light / strong
- sportiness: none / light / strong
- decoration_level: low / medium / high
- era_signal: modern / vintage-worn / retro-70s / retro-90s

[10개 대분류 스타일 태그 기준]
1. casual
- 정의: 일상적이고 편안하며 쉽게 입을 수 있는 스타일. 특별히 포멀하거나 화려하거나 강한 무드가 아니라 데일리하게 입기 좋은 옷.
- 대표 근거: 편안한 실루엣, 과하지 않은 디자인, 일상적 소재, 기본 컬러, 활동성, 낮은 포멀함.
- 구분: minimal은 절제가 핵심, casual은 편안함이 핵심. street는 오버핏/그래픽/유스컬처가 더 강함. sporty는 운동복/기능성 디테일이 명확함.
- 판단 질문: 특정 무드가 강하지 않고 편하게 매일 입을 수 있는가?

2. minimal
- 정의: 장식과 디테일을 덜어낸 절제된 스타일. 단순한 형태, 차분한 컬러, 깨끗한 실루엣이 핵심.
- 대표 근거: 무지 또는 낮은 패턴, 무채색/뉴트럴 컬러, 간결한 실루엣, 로고/그래픽 없음, 디테일 적음, 차분함.
- 구분: casual은 편안함이 핵심. classic은 전통적 아이템 코드가 있음. chic_modern은 더 도시적이고 날카로운 긴장감이 있음.
- 판단 질문: 덜어낸 디자인과 조용한 분위기가 핵심인가?

3. street
- 정의: 도시적이고 젊은 유스컬처 기반 스타일. 스케이트, 힙합, 그래픽, 오버핏, 트렌디한 무드가 강함.
- 대표 근거: 오버핏, 그래픽/로고, 강한 프린트, 와이드 실루엣, 스니커즈 무드, 도시적 느낌, 트렌디함.
- 구분: casual보다 강한 그래픽/오버핏/문화 코드가 있음. sporty는 운동복 출처, street는 도시/유스컬처 출처. workwear_gorpcore는 기능성과 러기드함이 더 강함.
- 판단 질문: 그냥 편한 옷이 아니라 도시적이고 유스컬처적인 인상이 강한가?

4. classic
- 정의: 시간이 지나도 유효한 단정하고 전통적인 스타일. 테일러링, 셔츠, 코트, 로퍼 같은 오래된 정제감이 핵심.
- 대표 근거: 정돈된 실루엣, 테일러드 구조, 전통적 아이템, 과하지 않은 고급스러움, 낮은 트렌드성, 단정함.
- 구분: minimal은 절제 중심. chic_modern은 더 현대적이고 날카로움. preppy는 별도 대분류가 아니라 추후 보조 무드로만 봄.
- 판단 질문: 유행을 덜 타는 전통적 단정함이 있는가?

5. vintage
- 정의: 과거 시대감, 낡은 질감, 세컨핸드 무드, 복고적 인상을 주는 스타일.
- 대표 근거: 워싱, 페이드 컬러, 낡은 질감, 레트로 그래픽, 헤리티지 패턴, 오래된 실루엣, 70s/80s/90s 무드.
- 구분: classic은 오래 입을 수 있는 단정함, vintage는 과거/낡은 무드. 헤리티지 워크웨어는 workwear_gorpcore와 같이 점수를 줄 수 있음.
- 판단 질문: 새 옷이라도 오래된 시대감이나 세컨핸드 느낌이 나는가?

6. lovely_romantic
- 정의: 부드럽고 사랑스럽고 섬세한 장식적 무드. 곡선, 플로럴, 리본, 레이스, 프릴 등이 핵심.
- 대표 근거: 리본, 레이스, 프릴/러플, 플로럴 패턴, 파스텔 컬러, 흐르는 실루엣, 곡선적 디테일, 부드러운 분위기.
- 구분: glam_sexy는 몸선/노출/화려함이 핵심. classic은 장식보다 단정함이 핵심. 플로럴/레이스가 과거풍이면 vintage와 함께 줄 수 있음.
- 판단 질문: 사랑스럽고 부드러운 장식성이 핵심인가?

7. sporty
- 정의: 운동복, 액티브웨어, 스포츠 경기복에서 온 스타일. 움직임과 기능성이 핵심.
- 대표 근거: 기능성 소재, 라인 디테일, 저지/트랙 디자인, 운동복 실루엣, 활동성, 팀/경기복 무드, 테니스/러닝/축구 코드.
- 구분: casual보다 운동복 출처가 명확함. street화된 저지는 street와 함께 가능. workwear_gorpcore는 아웃도어 장비감, sporty는 운동/경기복.
- 판단 질문: 스포츠나 운동 기능에서 온 디자인인가?

8. workwear_gorpcore
- 정의: 기능성, 실용성, 내구성, 아웃도어/작업복 무드가 강한 스타일.
- 대표 근거: 큰 포켓, 지퍼/스트랩, 방수/나일론 소재, 튼튼한 원단, 아웃도어 디테일, 러기드함, 장비 같은 느낌, 실용적 구조.
- 구분: street는 도시/트렌드, workwear_gorpcore는 기능/작업복/아웃도어가 핵심. sporty는 운동, workwear_gorpcore는 아웃도어/하이킹/작업복.
- 판단 질문: 옷이 장비처럼 보이는가, 작업복/아웃도어의 기능성이 보이는가?

9. chic_modern
- 정의: 도시적이고 세련되며 현대적인 스타일. 차갑고 날카로운 정제감, 블랙/모노톤, 구조적인 실루엣이 핵심.
- 대표 근거: 블랙/모노톤, 샤프한 라인, 슬림하거나 구조적인 실루엣, 도시적 분위기, 세련됨, 차분하지만 강한 인상, 나이트아웃 가능성.
- 구분: minimal은 조용한 절제, chic_modern은 세련된 긴장감. classic은 전통적, chic_modern은 현대적. glam_sexy는 몸선/노출/화려함이 더 강함.
- 판단 질문: 도시적이고 세련된 긴장감이 있는가?

10. glam_sexy
- 정의: 관능적이고 화려하며 몸선을 강조하는 스타일. 파티, 클럽, 나이트아웃, 드레스업 무드가 강함.
- 대표 근거: 몸선 강조, 노출, 광택 소재, 시스루, 슬릿, 크롭, 오프숄더, 미니 기장, 드라마틱한 실루엣, 파티 무드.
- 구분: chic_modern은 세련됨, glam_sexy는 관능/화려함이 핵심. lovely_romantic은 부드럽고 사랑스러움. 단순한 슬림핏만으로 glam_sexy를 높게 주지 않음.
- 판단 질문: 몸선, 노출, 광택, 파티/나이트아웃 무드가 핵심인가?

[중요 규칙]
1. 하나의 상품은 여러 태그에 동시에 높은 점수를 받을 수 있습니다 (다중 라벨).
   예: 카고팬츠는 workwear_gorpcore 0.75, street 0.45, casual 0.4가 동시에 나올 수 있음.
2. 확신이 없으면 낮은 점수(0.1~0.2)를 주세요. 억지로 모든 태그에 높은 점수를 주지 마세요.
3. 이미지에서 직접 보이는 시각적 특징(실루엣, 색감, 소재감, 디테일)을 우선 근거로 판단하고,
   브랜드/상품명 텍스트는 보조 참고자료로만 활용하세요.
4. 브랜드 인지도, 가격대, 성별로 판단하지 마세요.
5. 먼저 객관 속성을 분석한 뒤, 그 속성만 근거로 스타일 태그 점수를 매기세요.
6. 점수 기준:
   - 0.75~1.0: 그래프에 강하게 연결할 수 있는 주된 스타일
   - 0.45~0.75: 약한 연결 또는 보조 스타일
   - 0.30~0.45: 내부 저장/낮은 신뢰도
   - 0.0~0.30: 그래프 연결 제외 수준
7. preppy, american_casual, y2k, old_money, normcore, balletcore, punk, goth, bohemian 등은 대분류 태그가 아닙니다.
   이런 무드가 보여도 가장 가까운 위 10개 대분류에만 점수화하세요.
8. 색상, 소재, 핏, 패턴, 기장, 디테일 등 객관 속성은 style_attributes에만 기록하고, 대분류 스타일 태그와 혼동하지 마세요.
9. 단순히 기본 아이템이라는 이유만으로 casual/minimal을 높게 주지 마세요. 각 태그 정의의 핵심 질문을 통과할 때만 높게 주세요.
10. 하나의 상품에서 0.75 이상 태그는 보통 1~2개만 나오게 하세요. 시각적 근거가 매우 명확할 때만 3개까지 허용하세요.
11. 0.7 이상을 준 태그는 evidence에 반드시 시각적 근거를 1개 이상 넣으세요.
12. 반드시 JSON 형식으로만 답하세요. 다른 설명은 절대 추가하지 마세요.

[출력 형식]
{{
  "style_tags": {{"casual": 0.0, "minimal": 0.0, "street": 0.0, "classic": 0.0, "vintage": 0.0, "lovely_romantic": 0.0, "sporty": 0.0, "workwear_gorpcore": 0.0, "chic_modern": 0.0, "glam_sexy": 0.0}},
  "style_attributes": {{"fit": "", "silhouette": "", "material": "", "color": "", "wash_texture": "", "details": [], "formality": "", "utility_level": "", "sportiness": "", "decoration_level": "", "era_signal": ""}},
  "evidence": {{"casual": [], "minimal": [], "street": [], "classic": [], "vintage": [], "lovely_romantic": [], "sporty": [], "workwear_gorpcore": [], "chic_modern": [], "glam_sexy": []}},
  "confidence": 0.0
}}
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Tag Supabase product images into products.style_tags."
    )
    parser.add_argument("--category", default=DEFAULT_CATEGORY)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--missing-only", action="store_true", help="Fetch only rows where style_tags is null.")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--bucket", default="")
    parser.add_argument("--signed-url-ttl", type=int, default=DEFAULT_SIGNED_URL_TTL_SECONDS)
    parser.add_argument("--delay-seconds", type=float, default=DEFAULT_DELAY_SECONDS)
    parser.add_argument("--max-images", type=int, default=DEFAULT_MAX_IMAGES)
    parser.add_argument("--gemini-timeout", type=int, default=DEFAULT_GEMINI_TIMEOUT_SECONDS)
    parser.add_argument("--review-examples", type=int, default=DEFAULT_REVIEW_EXAMPLE_LIMIT)
    parser.add_argument(
        "--exclude-ids",
        default="",
        help="Comma-separated product IDs to skip even when --force is used.",
    )
    return parser.parse_args()


def parse_id_set(value: str) -> set[str]:
    return {
        item.strip()
        for item in str(value or "").split(",")
        if item.strip()
    }


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
    load_dotenv(Path.cwd() / ".env.local")
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
    normalized_category = str(category or "").strip()
    query = (
        client.table(table)
        .select("id,brand,name,category,image_path,style_tags,product_metadata")
        .order("id", desc=False)
    )
    if normalized_category.lower() not in {"", "all", "*"}:
        query = query.eq("category", normalized_category)
    if limit > 0:
        query = query.limit(limit)

    response = query.execute()
    return list(response.data or [])


def fetch_review_examples(client: Any, table: str, category: str, limit: int) -> list[dict[str, Any]]:
    if limit <= 0:
        return []

    normalized_category = str(category or "").strip()
    query = (
        client.table(table)
        .select(
            "id,brand,name,category,style_tags,style_attributes,"
            "human_style_tags,human_style_attributes,tag_review_status,tag_review_note,reviewed_at"
        )
        .in_("tag_review_status", ["approved", "edited"])
        .order("reviewed_at", desc=True)
        .limit(max(limit * 3, limit))
    )
    if normalized_category.lower() not in {"", "all", "*"}:
        query = query.eq("category", normalized_category)
    response = query.execute()
    rows = list(response.data or [])
    examples = []
    for row in rows:
        if not isinstance(row.get("human_style_tags"), dict):
            continue
        examples.append(row)
        if len(examples) >= limit:
            break
    return examples


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


def normalize_style_tags_for_context(value: Any) -> dict[str, float]:
    if not isinstance(value, dict):
        return {}
    normalized = {tag: 0.0 for tag in STYLE_TAGS}
    for key, score in value.items():
        tag = key if key in STYLE_TAGS else LEGACY_STYLE_TAG_MAP.get(str(key))
        if not tag:
            continue
        try:
            numeric_score = float(score)
        except (TypeError, ValueError):
            continue
        if 0.0 <= numeric_score <= 1.0:
            normalized[tag] = max(normalized[tag], numeric_score)
    return normalized


def normalize_string_list(value: Any, limit: int = 12) -> list[str]:
    if not isinstance(value, list):
        return []
    output = []
    for item in value:
        text = str(item or "").strip()
        if text:
            output.append(text[:240])
    return output[:limit]


def normalize_style_attributes(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        return {}
    allowed_string_keys = [
        "fit",
        "silhouette",
        "material",
        "color",
        "wash_texture",
        "formality",
        "utility_level",
        "sportiness",
        "decoration_level",
        "era_signal",
    ]
    normalized: dict[str, Any] = {}
    for key in allowed_string_keys:
        normalized[key] = str(value.get(key) or "").strip()[:160]
    normalized["details"] = normalize_string_list(value.get("details"), limit=16)
    return normalized


def normalize_evidence(value: Any) -> dict[str, list[str]]:
    if not isinstance(value, dict):
        return {tag: [] for tag in STYLE_TAGS}
    return {tag: normalize_string_list(value.get(tag), limit=5) for tag in STYLE_TAGS}


def normalize_style_analysis(value: Any) -> dict[str, Any]:
    if isinstance(value, dict) and "style_tags" not in value:
        return {
            "style_tags": normalize_style_tags(value),
            "style_attributes": {},
            "style_tags_evidence": {tag: [] for tag in STYLE_TAGS},
            "confidence": None,
        }
    if not isinstance(value, dict):
        raise RuntimeError("Gemini response JSON is not an object")
    confidence = value.get("confidence")
    if isinstance(confidence, bool):
        raise RuntimeError("confidence must be numeric, got boolean")
    numeric_confidence = (
        float(confidence)
        if isinstance(confidence, (int, float, str)) and str(confidence).strip()
        else None
    )
    if numeric_confidence is not None and not 0.0 <= numeric_confidence <= 1.0:
        raise RuntimeError(f"confidence {numeric_confidence} is outside 0.0-1.0")
    return {
        "style_tags": normalize_style_tags(value.get("style_tags")),
        "style_attributes": normalize_style_attributes(value.get("style_attributes")),
        "style_tags_evidence": normalize_evidence(value.get("evidence")),
        "confidence": numeric_confidence,
    }


def parse_style_analysis(raw_text: str) -> dict[str, Any]:
    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        parsed = json.loads(extract_json_object(raw_text))
    return normalize_style_analysis(parsed)


def build_metadata_context(product_metadata: Any) -> str:
    if not isinstance(product_metadata, dict):
        return "없음"
    candidates = product_metadata.get("tagging_text_candidates") or product_metadata.get("raw_text_candidates") or []
    blocks = []
    for text in normalize_string_list(candidates, limit=10):
        if text:
            blocks.append(f"- {text}")
    return "\n".join(blocks) if blocks else "없음"


def format_score_summary(value: Any, limit: int = 5) -> str:
    value = normalize_style_tags_for_context(value)
    if not value:
        return "없음"
    pairs = []
    for tag, score in sorted(value.items(), key=lambda item: float(item[1] or 0), reverse=True):
        try:
            numeric_score = float(score)
        except (TypeError, ValueError):
            continue
        pairs.append(f"{tag} {numeric_score:.2f}")
        if len(pairs) >= limit:
            break
    return ", ".join(pairs) if pairs else "없음"


def format_attributes_summary(value: Any) -> str:
    if not isinstance(value, dict):
        return "없음"
    keys = ["fit", "silhouette", "material", "color", "wash_texture", "details"]
    parts = []
    for key in keys:
        raw = value.get(key)
        if isinstance(raw, list):
            text = ", ".join(str(item).strip() for item in raw if str(item).strip())
        else:
            text = str(raw or "").strip()
        if text:
            parts.append(f"{key}: {text[:120]}")
    return "; ".join(parts) if parts else "없음"


def build_review_examples_context(
    examples: list[dict[str, Any]],
    exclude_product_id: Any = None,
) -> str:
    excluded_id = str(exclude_product_id or "").strip()
    effective_examples = [
        example
        for example in examples
        if not excluded_id or str(example.get("id") or "").strip() != excluded_id
    ]
    if not effective_examples:
        return "아직 사람 검수 예시 없음"

    blocks = []
    for index, example in enumerate(effective_examples, start=1):
        ai_tags = format_score_summary(example.get("style_tags"), limit=5)
        human_tags = format_score_summary(example.get("human_style_tags"), limit=5)
        ai_attributes = format_attributes_summary(example.get("style_attributes"))
        human_attributes = format_attributes_summary(example.get("human_style_attributes"))
        note = str(example.get("tag_review_note") or "").strip()[:280] or "수정 이유 없음"
        brand = str(example.get("brand") or "").strip()
        name = str(example.get("name") or "").strip()
        status = str(example.get("tag_review_status") or "").strip()
        blocks.append(
            "\n".join([
                f"예시 {index} ({status})",
                f"- 상품: {brand} / {name}",
                f"- AI 수정 전 점수: {ai_tags}",
                f"- 사람 정답 점수: {human_tags}",
                f"- AI 분석 속성: {ai_attributes}",
                f"- 사람 수정 속성: {human_attributes}",
                f"- 사람이 남긴 수정 이유: {note}",
            ])
        )
    return "\n\n".join(blocks)


def get_tagging_image_paths(product: dict[str, Any], max_images: int) -> list[str]:
    product_metadata = product.get("product_metadata")
    candidates = []
    image_path = str(product.get("image_path") or "").strip()
    if image_path:
        candidates.append(image_path)
    if isinstance(product_metadata, dict):
        candidates.extend(product_metadata.get("tagging_image_urls") or [])
        candidates.extend(product_metadata.get("image_candidates") or [])

    seen = set()
    output = []
    for candidate in candidates:
        normalized = str(candidate or "").strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        output.append(normalized)
        if len(output) >= max(1, max_images):
            break
    return output


def tag_product_images(
    model: Any,
    images: list[Image.Image],
    brand: str,
    name: str,
    metadata_context: str,
    review_examples_context: str,
    gemini_timeout: int,
) -> dict[str, Any]:
    prompt = PROMPT_TEMPLATE.format(
        brand_name=brand,
        product_name=name,
        metadata_context=metadata_context,
        review_examples_context=review_examples_context,
    )
    response = model.generate_content(
        [prompt, *images],
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": STYLE_ANALYSIS_SCHEMA,
        },
        request_options={"timeout": max(1, int(gemini_timeout or DEFAULT_GEMINI_TIMEOUT_SECONDS))},
    )
    return parse_style_analysis(extract_response_text(response))


def update_style_analysis(client: Any, table: str, product_id: Any, analysis: dict[str, Any]) -> None:
    payload = {
        "style_tags": analysis["style_tags"],
        "style_attributes": analysis.get("style_attributes") or {},
        "style_tags_evidence": analysis.get("style_tags_evidence") or {},
        "style_tags_confidence": analysis.get("confidence"),
        "tagging_status": "tagged",
        "tagging_error": None,
        "tagged_at": datetime.now(timezone.utc).isoformat(),
    }
    client.table(table).update(payload).eq("id", product_id).execute()


def update_tagging_error(client: Any, table: str, product_id: Any, error: Exception) -> None:
    client.table(table).update({
        "tagging_status": "failed",
        "tagging_error": str(error)[:1000],
    }).eq("id", product_id).execute()


def summarize_analysis(analysis: dict[str, Any]) -> str:
    style_tags = analysis.get("style_tags") or {}
    top_tags = sorted(style_tags.items(), key=lambda item: item[1], reverse=True)[:3]
    top_tag_text = ", ".join(f"{tag}={score:.2f}" for tag, score in top_tags)
    attributes = analysis.get("style_attributes") or {}
    material = str(attributes.get("material") or "unknown").strip() or "unknown"
    fit = str(attributes.get("fit") or "unknown").strip() or "unknown"
    return f"top=[{top_tag_text}] material={material} fit={fit}"


def main() -> int:
    args = parse_args()
    env = load_env()
    bucket = args.bucket.strip() or env["storage_bucket"]
    excluded_ids = parse_id_set(args.exclude_ids)
    client = create_client(env["supabase_url"], env["service_role_key"])

    genai.configure(api_key=env["gemini_api_key"])
    model = genai.GenerativeModel(MODEL_NAME)

    review_examples = fetch_review_examples(
        client,
        env["products_table"],
        args.category,
        max(0, int(args.review_examples or 0)),
    )
    products = fetch_products(client, env["products_table"], args.category, args.limit)
    if args.missing_only:
        products = [product for product in products if product.get("style_tags") is None]
    total = len(products)
    if total == 0:
        print(f"No products found for category={args.category!r}.")
        return 0

    print(
        f"Found {total} products category={args.category!r}, bucket={bucket!r}, "
        f"bucket_public={env['bucket_public']}, dry_run={args.dry_run}, force={args.force}, "
        f"review_examples={len(review_examples)}."
    , flush=True)

    tagged_count = 0
    skipped_count = 0
    failed_count = 0

    for index, product in enumerate(products, start=1):
        product_id = product.get("id")
        brand = str(product.get("brand") or "").strip()
        name = str(product.get("name") or "").strip()
        image_paths = get_tagging_image_paths(product, args.max_images)

        if str(product_id) in excluded_ids:
            skipped_count += 1
            print(f"{index}/{total} 처리 완료 product_id={product_id} status=excluded", flush=True)
            continue

        if should_skip(product, args.force):
            skipped_count += 1
            print(f"{index}/{total} 처리 완료 product_id={product_id} status=skipped", flush=True)
            continue

        if not image_paths:
            failed_count += 1
            print(f"{index}/{total} 처리 실패 product_id={product_id} reason=missing image_path", flush=True)
            continue

        try:
            images = []
            image_failures = []
            for image_path in image_paths:
                try:
                    images.append(download_product_image(
                        client,
                        env["supabase_url"],
                        bucket,
                        image_path,
                        env["bucket_public"],
                        args.signed_url_ttl,
                    ))
                except Exception as image_exc:
                    image_failures.append(f"{image_path}: {image_exc}")
            if not images:
                raise RuntimeError("; ".join(image_failures) or "no usable tagging images")

            metadata_context = build_metadata_context(product.get("product_metadata"))
            review_examples_context = build_review_examples_context(review_examples, product_id)
            analysis = tag_product_images(
                model,
                images,
                brand,
                name,
                metadata_context,
                review_examples_context,
                args.gemini_timeout,
            )
            if not args.dry_run:
                update_style_analysis(client, env["products_table"], product_id, analysis)
            tagged_count += 1
            status = "태깅 완료(dry-run)" if args.dry_run else "태깅 완료"
            print(
                f"{index}/{total} {status} product_id={product_id} images={len(images)} "
                f"{summarize_analysis(analysis)}",
                flush=True,
            )
        except Exception as exc:
            failed_count += 1
            if not args.dry_run:
                try:
                    update_tagging_error(client, env["products_table"], product_id, exc)
                except Exception:
                    pass
            print(f"{index}/{total} 처리 실패 product_id={product_id} reason={exc}", flush=True)

        delay_seconds = max(0.0, float(args.delay_seconds or 0.0))
        if delay_seconds > 0 and index < total:
            time.sleep(delay_seconds)

    print(
        "Complete. "
        f"tagged={tagged_count}, skipped={skipped_count}, failed={failed_count}, total={total}"
    , flush=True)
    return 1 if failed_count else 0


if __name__ == "__main__":
    sys.exit(main())
