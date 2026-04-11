"""
Supabase 단가 DB 연동 모듈 (Wave 3)

테이블 스키마 (Supabase SQL Editor에서 실행):

  CREATE TABLE unit_prices (
    id          SERIAL PRIMARY KEY,
    category    TEXT NOT NULL,
    item_name   TEXT NOT NULL,
    unit        TEXT NOT NULL,
    price_min   INTEGER NOT NULL,
    price_max   INTEGER NOT NULL,
    price_base  INTEGER NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (category, item_name)
  );

  CREATE INDEX idx_unit_prices_category ON unit_prices(category);
  CREATE INDEX idx_unit_prices_item ON unit_prices(item_name);

사용법:
  from db.supabase_prices import get_prices_supabase
  prices = get_prices_supabase()   # unit_prices.json과 동일한 구조 반환
"""
import json
import os
from pathlib import Path
from typing import Optional

_CACHE: Optional[dict] = None


def _supabase_available() -> bool:
    return bool(os.getenv("SUPABASE_URL")) and bool(os.getenv("SUPABASE_ANON_KEY"))


def get_prices_supabase() -> dict:
    """
    Supabase에서 단가 조회.
    연결 불가 시 JSON 파일 fallback.
    """
    global _CACHE
    if _CACHE is not None:
        return _CACHE

    if _supabase_available():
        data = _fetch_from_supabase()
        if data:
            _CACHE = data
            return _CACHE

    # JSON fallback
    _CACHE = _load_json_prices()
    return _CACHE


def _fetch_from_supabase() -> Optional[dict]:
    """Supabase REST API로 단가 조회"""
    try:
        import httpx

        url = os.getenv("SUPABASE_URL", "").rstrip("/")
        key = os.getenv("SUPABASE_ANON_KEY", "")

        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }

        resp = httpx.get(
            f"{url}/rest/v1/unit_prices?select=*&order=category,item_name",
            headers=headers,
            timeout=5.0,
        )

        if resp.status_code != 200:
            return None

        rows = resp.json()
        return _rows_to_dict(rows)

    except Exception:
        return None


def _rows_to_dict(rows: list[dict]) -> dict:
    """DB 행 목록 → unit_prices.json과 동일한 구조로 변환"""
    result: dict = {}
    for row in rows:
        cat = row["category"]
        name = row["item_name"]
        if cat not in result:
            result[cat] = {}
        result[cat][name] = {
            "unit":  row["unit"],
            "min":   row["price_min"],
            "max":   row["price_max"],
            "base":  row["price_base"],
        }
    return result


def _load_json_prices() -> dict:
    """로컬 JSON 파일 로드"""
    path = Path(__file__).parent.parent / "data" / "unit_prices.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def invalidate_cache():
    """단가 캐시 초기화 (단가 업데이트 후 호출)"""
    global _CACHE
    _CACHE = None


# ── Supabase 초기 데이터 적재 스크립트 ─────────────────────

def seed_supabase_from_json() -> int:
    """
    unit_prices.json → Supabase unit_prices 테이블로 upsert.
    반환값: 적재된 행 수.

    실행: python -c "from db.supabase_prices import seed_supabase_from_json; seed_supabase_from_json()"
    """
    if not _supabase_available():
        print("⚠ SUPABASE_URL / SUPABASE_ANON_KEY 환경변수 미설정")
        return 0

    import httpx

    prices = _load_json_prices()
    rows = []
    for category, items in prices.items():
        for item_name, vals in items.items():
            rows.append({
                "category":   category,
                "item_name":  item_name,
                "unit":       vals["unit"],
                "price_min":  vals["min"],
                "price_max":  vals["max"],
                "price_base": vals["base"],
            })

    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_ANON_KEY", "")
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",  # upsert
    }

    # 100개씩 청크 업로드
    chunk_size = 100
    total = 0
    for i in range(0, len(rows), chunk_size):
        chunk = rows[i : i + chunk_size]
        resp = httpx.post(
            f"{url}/rest/v1/unit_prices",
            headers=headers,
            json=chunk,
            timeout=15.0,
        )
        if resp.status_code in (200, 201):
            total += len(chunk)
            print(f"  {i + len(chunk)}/{len(rows)} 적재 완료")
        else:
            print(f"  ✗ 오류: {resp.status_code} {resp.text[:100]}")

    print(f"\n총 {total}개 단가 항목 Supabase 적재 완료")
    return total
