"""Agent 3: PRICER — 단가 DB 조회 + 금액 산출 (Supabase / JSON fallback)"""
from db.supabase_prices import get_prices_supabase


def _load_prices() -> dict:
    return get_prices_supabase()


# 카테고리별 fallback 기본 단가 (단가 매칭 실패 시)
_CATEGORY_DEFAULTS = {
    "철거/해체": 20000,
    "바닥": 45000,
    "벽체/도장": 15000,
    "천장": 22000,
    "창호": 400000,
    "전기": 40000,
    "설비/배관": 50000,
    "주방": 400000,
    "냉난방": 1200000,
    "마감/기타": 10000,
}


def run_pricer(work_items: list[dict], tier: str = "standard") -> dict:
    """단가 DB 조회 후 공종별 금액 산출

    Args:
        work_items: ESTIMATOR 출력 공종 항목 리스트
        tier: "budget" → price_min, "standard" → price_base (기본), "premium" → price_max
    """
    prices = _load_prices()
    priced_items = []
    breakdown: dict[str, int] = {}

    # tier에 따라 사용할 단가 컬럼 결정
    _TIER_MULTIPLIER = {"budget": 0.80, "standard": 1.0, "premium": 1.25}
    tier_mult = _TIER_MULTIPLIER.get(tier, 1.0)

    for item in work_items:
        category = item.get("category", "")
        item_name = item.get("item", "")
        quantity = float(item.get("quantity", 0))

        base_price = _find_price(prices, category, item_name)
        unit_price = int(base_price * tier_mult)
        total_price = int(quantity * unit_price)

        priced_items.append({
            **item,
            "unit_price": unit_price,
            "total_price": total_price,
        })

        breakdown[category] = breakdown.get(category, 0) + total_price

    subtotal = sum(breakdown.values())
    return {
        "priced_items": priced_items,
        "breakdown": breakdown,
        "subtotal": subtotal,
        "min_cost": int(subtotal * 0.90),
        "max_cost": int(subtotal * 1.15),
    }


def _find_price(prices: dict, category: str, item_name: str) -> int:
    """단가 DB 3단계 매칭 (정확 → 전체 검색 → 부분 매칭 → 카테고리 기본값)"""
    # 1. 정확 카테고리 + 정확 항목명
    if category in prices and item_name in prices[category]:
        val = prices[category][item_name]["base"]
        return int(val) if isinstance(val, (int, float)) else int(str(val))

    # 2. 전체 카테고리에서 항목명 검색
    for cat, items in prices.items():
        if item_name in items:
            val = items[item_name]["base"]
            return int(val) if isinstance(val, (int, float)) else int(str(val))

    # 3. 부분 문자열 매칭
    for cat, items in prices.items():
        for key, val in items.items():
            if item_name in key or key in item_name:
                base = val["base"]
                return int(base) if isinstance(base, (int, float)) else int(str(base))

    # 4. 카테고리 기본값
    for key, val in _CATEGORY_DEFAULTS.items():
        if key in category or category in key:
            return val

    return 30000  # 최종 fallback
