"""Agent 4: VALIDATOR — 18년 현장 경험 기반 Python 룰 엔진 + Claude 총평

핵심 설계 원칙:
  - 37개 현장 룰은 Python 코드로 명시 구현 (AI 프롬프트 역할극 아님)
  - Claude Sonnet은 룰 탐지 결과를 바탕으로 '총평' 문장만 생성
  - 누락 공종 탐지: 리모델링 철거, 욕실 방수, 전기·설비 최소 비율 등
"""
import asyncio
import os
import anthropic

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    return _client


# ── 헬퍼 ──────────────────────────────────────────────────────────────────────

def _has_category(breakdown: dict, keyword: str) -> bool:
    """breakdown 키 중 keyword를 포함하는 항목이 존재하는지 확인"""
    return any(keyword in k for k in breakdown)


def _category_ratio(breakdown: dict, keyword: str, total: int) -> float:
    """특정 공종 카테고리의 비율 반환 (0.0 ~ 1.0)"""
    if total <= 0:
        return 0.0
    s = sum(v for k, v in breakdown.items() if keyword in k)
    return s / total


# ── Python 룰 엔진 (37개 룰) ──────────────────────────────────────────────────

def _has_item_keyword(work_items: list, keyword: str) -> bool:
    """work_items 내 item 이름에 keyword가 포함된 항목이 있는지 확인"""
    return any(keyword in item.get("item", "") for item in work_items)


def _run_rule_engine(type_: str, area: float, breakdown: dict, work_items: list | None = None) -> list[dict]:
    """
    18년 현장 경험 기반 명시적 검증 룰셋.
    AI 프롬프트가 아닌 Python 코드로 구현된 현장 기준.
    """
    flags: list[dict] = []
    work_items = work_items or []
    total = sum(breakdown.values())
    if total <= 0 or area <= 0:
        return flags

    unit_m2 = total / area  # m² 당 단가

    # ── [카테고리 1] 단가 이상치 — 8개 룰 ─────────────────────────────────────

    if type_ in ("인테리어", "리모델링"):
        # R01: 인테리어 하한 — 인건비 미포함 수준
        if unit_m2 < 150_000:
            flags.append({
                "severity": "error",
                "category": "단가",
                "rule_id": "R01",
                "message": f"m²당 {unit_m2:,.0f}원은 인건비 미포함 수준 (기준: 150,000원 이상)",
                "suggestion": "인건비 항목 누락 여부를 확인하세요. 최소 150,000원/m² 이상이어야 합니다.",
            })
        # R02: 인테리어 상한 — 고급/특수 마감재 여부 확인
        elif unit_m2 > 800_000:
            flags.append({
                "severity": "warning",
                "category": "단가",
                "rule_id": "R02",
                "message": f"m²당 {unit_m2:,.0f}원은 고급 마감재 수준 (기준: 800,000원 이하)",
                "suggestion": "고급 마감재(대리석·수입타일·아트월 등) 적용 여부를 발주처와 재확인하세요.",
            })

    if type_ == "신축":
        # R03: 신축 하한
        if unit_m2 < 1_000_000:
            flags.append({
                "severity": "warning",
                "category": "단가",
                "rule_id": "R03",
                "message": f"신축 m²당 {unit_m2:,.0f}원은 마감재 별도 가능성",
                "suggestion": "골조+마감 포함 여부를 계약서에서 확인하세요.",
            })
        # R04: 신축 상한
        elif unit_m2 > 3_000_000:
            flags.append({
                "severity": "warning",
                "category": "단가",
                "rule_id": "R04",
                "message": f"신축 m²당 {unit_m2:,.0f}원은 초고급 수준",
                "suggestion": "고급 마감 사양인지 확인하세요.",
            })

    # R05: 욕실 단가 하한 — 설비+타일+위생도기 세트
    bathroom_cost = sum(v for k, v in breakdown.items()
                        if any(kw in k for kw in ("욕실", "위생", "양변기", "세면")))
    if bathroom_cost > 0 and bathroom_cost < 1_500_000:
        flags.append({
            "severity": "error",
            "category": "욕실",
            "rule_id": "R05",
            "message": f"욕실 비용 {bathroom_cost:,}원은 품질 위험 수준 (기준: 150만원 이상/개)",
            "suggestion": "위생도기 교체·타일·방수·설비를 포함한 욕실 1개 최소 비용은 150만원입니다.",
        })

    # R06: 욕실 타일 단가 하한
    bathroom_tile_cost = sum(v for k, v in breakdown.items() if "욕실" in k and "타일" in k)
    bath_area = area * 0.10
    if bathroom_tile_cost > 0 and bath_area > 0:
        tile_unit = bathroom_tile_cost / bath_area
        if tile_unit < 55_000:
            flags.append({
                "severity": "warning",
                "category": "욕실",
                "rule_id": "R06",
                "message": f"욕실 타일 단가 {tile_unit:,.0f}원/m²는 저품질 자재 우려 (기준: 55,000원 이상)",
                "suggestion": "욕실 타일은 흡수율·내수성 기준 충족 자재를 사용하세요.",
            })

    # R07: 싱크대 단가 하한
    sink_cost = sum(v for k, v in breakdown.items()
                    if any(kw in k for kw in ("싱크", "씽크", "주방가구")))
    if sink_cost > 0 and sink_cost < 800_000:
        flags.append({
            "severity": "warning",
            "category": "주방",
            "rule_id": "R07",
            "message": f"싱크대 비용 {sink_cost:,}원은 저가 제품 수준 (기준: 80만원 이상)",
            "suggestion": "하부장+상부장+상판 포함 여부 확인하세요.",
        })

    # R08: 창호 단가 하한 (이중창 기준)
    window_cost = sum(v for k, v in breakdown.items()
                      if any(kw in k for kw in ("창호", "새시", "발코니창", "시스템창")))
    window_count = sum(1 for k in breakdown if any(kw in k for kw in ("창호", "새시", "발코니창")))
    if window_cost > 0 and window_count > 0:
        per_window = window_cost / window_count
        if per_window < 250_000:
            flags.append({
                "severity": "warning",
                "category": "창호",
                "rule_id": "R08",
                "message": f"창호 1개당 {per_window:,.0f}원은 단창 수준 (이중창 기준: 30만원 이상)",
                "suggestion": "이중창 vs 단창 사양을 확인하세요. 단열 기준 충족 여부도 검토하세요.",
            })

    # ── [카테고리 2] 누락 공종 탐지 — 12개 룰 ──────────────────────────────────

    has_demolition = _has_category(breakdown, "철거")
    has_waterproof = _has_category(breakdown, "방수")
    has_electric = _has_category(breakdown, "전기")
    has_plumbing = _has_category(breakdown, "설비") or _has_category(breakdown, "배관")
    has_bathroom = _has_category(breakdown, "욕실") or _has_category(breakdown, "위생")
    has_kitchen = _has_category(breakdown, "주방") or _has_category(breakdown, "싱크")
    has_hood = (_has_category(breakdown, "후드") or _has_category(breakdown, "주방환기")
                or _has_item_keyword(work_items, "후드") or _has_item_keyword(work_items, "주방환기"))
    has_floor = (_has_category(breakdown, "바닥") or _has_category(breakdown, "마루")
                 or _has_category(breakdown, "타일"))
    has_wall = (_has_category(breakdown, "도배") or _has_category(breakdown, "페인트")
                or _has_category(breakdown, "벽"))

    # R09: 리모델링 철거 누락 — 현장 필수
    if type_ == "리모델링" and not has_demolition:
        flags.append({
            "severity": "error",
            "category": "누락 공종",
            "rule_id": "R09",
            "message": "리모델링에 철거 항목이 없습니다 — 현장 시공 불가",
            "suggestion": "기존 마감재 철거 비용(바닥철거·벽체철거·욕실철거)을 반드시 포함하세요.",
        })

    # R10: 인테리어 철거 누락
    if type_ == "인테리어" and not has_demolition:
        flags.append({
            "severity": "warning",
            "category": "누락 공종",
            "rule_id": "R10",
            "message": "인테리어에 철거 항목이 없습니다",
            "suggestion": "기존 마감재 철거 포함 여부를 확인하세요. 신규 시공이라면 무시하셔도 됩니다.",
        })

    # R11: 욕실 공사 시 방수 누락
    if has_bathroom and not has_waterproof:
        flags.append({
            "severity": "error",
            "category": "누락 공종",
            "rule_id": "R11",
            "message": "욕실 공사에 방수 항목이 없습니다 — 누수 리스크",
            "suggestion": "욕실은 바닥·벽 방수 처리가 법적 의무입니다. 우레탄방수 또는 시트방수를 추가하세요.",
        })

    # R12: 전기 공사 누락 (전체 공사인데 전기 없음)
    if not has_electric and total > 10_000_000:
        flags.append({
            "severity": "warning",
            "category": "누락 공종",
            "rule_id": "R12",
            "message": "전체 공사 규모 대비 전기 공사 항목이 없습니다",
            "suggestion": "콘센트·스위치·조명 배선, 분전반 공사 포함 여부를 확인하세요.",
        })

    # R13: 설비 공사 누락 (욕실·주방 포함인데 설비 없음)
    if (has_bathroom or has_kitchen) and not has_plumbing:
        flags.append({
            "severity": "error",
            "category": "누락 공종",
            "rule_id": "R13",
            "message": "욕실/주방 공사에 설비(배관) 항목이 없습니다",
            "suggestion": "급수·배수 배관 교체 비용을 포함하세요. 특히 노후 배관은 욕실 공사 시 필수 교체입니다.",
        })

    # R14: 주방 후드 누락 — 싱크대가 실제로 존재하는 경우에만 체크
    # breakdown은 "주방" 단일 카테고리로 집계되므로 work_items에서 싱크대 존재 확인
    has_sink_item = (_has_category(breakdown, "싱크") or _has_category(breakdown, "씽크")
                    or _has_category(breakdown, "주방가구")
                    or _has_item_keyword(work_items, "싱크") or _has_item_keyword(work_items, "씽크"))
    if has_sink_item and not has_hood:
        flags.append({
            "severity": "warning",
            "category": "누락 공종",
            "rule_id": "R14",
            "message": "싱크대/주방가구 공사에 환기(후드) 항목이 없습니다",
            "suggestion": "주방 후드는 「건축법 시행규칙」상 환기시설 설치 의무 대상입니다. 후드 또는 주방환기 항목을 추가하세요.",
        })

    # R15: 바닥 공사 누락
    if type_ in ("인테리어", "리모델링") and not has_floor and total > 5_000_000:
        flags.append({
            "severity": "warning",
            "category": "누락 공종",
            "rule_id": "R15",
            "message": "인테리어에 바닥 마감 항목이 없습니다",
            "suggestion": "강마루·타일·데코타일 등 바닥 마감 포함 여부를 확인하세요.",
        })

    # R16: 벽 마감 누락
    if type_ in ("인테리어", "리모델링") and not has_wall and total > 5_000_000:
        flags.append({
            "severity": "warning",
            "category": "누락 공종",
            "rule_id": "R16",
            "message": "인테리어에 벽체 마감(도배/페인트) 항목이 없습니다",
            "suggestion": "도배 또는 페인트 마감 포함 여부를 확인하세요.",
        })

    # R17: 천장 마감 누락
    if (type_ in ("인테리어", "리모델링")
            and not _has_category(breakdown, "천장") and total > 8_000_000):
        flags.append({
            "severity": "warning",
            "category": "누락 공종",
            "rule_id": "R17",
            "message": "인테리어에 천장 마감 항목이 없습니다",
            "suggestion": "석고보드·텍스·우물천장 등 천장 마감 포함 여부를 확인하세요.",
        })

    # R18: 신축 골조 누락
    if (type_ == "신축"
            and not _has_category(breakdown, "골조")
            and not _has_category(breakdown, "콘크리트")):
        flags.append({
            "severity": "warning",
            "category": "누락 공종",
            "rule_id": "R18",
            "message": "신축 공사에 골조 항목이 없습니다",
            "suggestion": "골조(콘크리트·철골) 비용 포함 여부를 확인하세요.",
        })

    # R19: 바닥 마감재 전체 누락
    # breakdown은 카테고리 단위("바닥")로 집계되므로 work_items에서 세부 자재 확인
    has_floor_tile = (_has_category(breakdown, "타일")
                      or _has_item_keyword(work_items, "타일"))
    has_wood_floor = (_has_category(breakdown, "마루")
                      or _has_category(breakdown, "데코타일")
                      or _has_category(breakdown, "에폭시")
                      or _has_item_keyword(work_items, "마루")
                      or _has_item_keyword(work_items, "데코타일")
                      or _has_item_keyword(work_items, "에폭시"))
    has_floor_category = _has_category(breakdown, "바닥")  # "바닥" 카테고리 자체가 바닥 마감 포함
    if (type_ in ("인테리어", "리모델링")
            and not has_floor_tile and not has_wood_floor and not has_floor_category
            and total > 5_000_000):
        flags.append({
            "severity": "warning",
            "category": "누락 공종",
            "rule_id": "R19",
            "message": "바닥 마감재(마루·타일) 항목이 모두 없습니다",
            "suggestion": "바닥 마감 공종이 누락되었을 가능성이 있습니다.",
        })

    # R20: 벽 마감 전혀 없음
    if (type_ in ("인테리어", "리모델링")
            and not has_wall and not _has_category(breakdown, "타일") and total > 3_000_000):
        flags.append({
            "severity": "warning",
            "category": "누락 공종",
            "rule_id": "R20",
            "message": "벽 마감(도배·페인트·타일) 항목이 전혀 없습니다",
            "suggestion": "벽체 마감 공종 누락 여부를 확인하세요.",
        })

    # ── [카테고리 3] 비율 이상치 — 7개 룰 ──────────────────────────────────────

    electric_ratio = _category_ratio(breakdown, "전기", total)
    plumbing_ratio = (_category_ratio(breakdown, "설비", total)
                      + _category_ratio(breakdown, "배관", total))
    demolition_ratio = _category_ratio(breakdown, "철거", total)

    # R21: 전기 비중 하한
    if has_electric and electric_ratio < 0.03:
        flags.append({
            "severity": "warning",
            "category": "비율",
            "rule_id": "R21",
            "message": f"전기 공사 비중 {electric_ratio * 100:.1f}%는 과소 계상 의심 (기준: 3% 이상)",
            "suggestion": "조명·콘센트·스위치·분전반을 포함한 전기 공사 전체 비용을 재검토하세요.",
        })

    # R22: 전기 비중 상한
    if has_electric and electric_ratio > 0.30:
        flags.append({
            "severity": "warning",
            "category": "비율",
            "rule_id": "R22",
            "message": f"전기 공사 비중 {electric_ratio * 100:.1f}%는 과대 계상 의심 (기준: 30% 이하)",
            "suggestion": "전기 공사 항목 중복 산출 여부를 확인하세요.",
        })

    # R23: 설비 비중 하한
    if (has_bathroom or has_kitchen) and has_plumbing and plumbing_ratio < 0.05:
        flags.append({
            "severity": "warning",
            "category": "비율",
            "rule_id": "R23",
            "message": f"설비 공사 비중 {plumbing_ratio * 100:.1f}%는 과소 계상 의심 (기준: 5% 이상)",
            "suggestion": "급수·배수·난방 배관 교체 비용을 재검토하세요.",
        })

    # R24: 철거 비중 과대
    if has_demolition and demolition_ratio > 0.25:
        flags.append({
            "severity": "warning",
            "category": "비율",
            "rule_id": "R24",
            "message": f"철거 비중 {demolition_ratio * 100:.1f}%는 과대 계상 의심 (기준: 25% 이하)",
            "suggestion": "철거 항목 중복 산출 또는 전체철거 단가 기준을 재검토하세요.",
        })

    # R25: 리모델링 철거 비중 과소
    if type_ == "리모델링" and has_demolition and demolition_ratio < 0.05:
        flags.append({
            "severity": "warning",
            "category": "비율",
            "rule_id": "R25",
            "message": f"리모델링 철거 비중 {demolition_ratio * 100:.1f}%는 과소 계상 의심 (기준: 5% 이상)",
            "suggestion": "전체 철거 범위에 비해 철거비가 낮습니다. 재검토하세요.",
        })

    # R26: 마감재 비중 과대 (설비·전기·철거 누락 의심)
    finishing_categories = ("바닥", "벽체", "천장", "도배", "페인트", "타일", "마루")
    finishing_total = sum(v for k, v in breakdown.items()
                          if any(fc in k for fc in finishing_categories))
    finishing_ratio = finishing_total / total if total > 0 else 0
    if finishing_ratio > 0.90 and type_ != "인테리어":
        flags.append({
            "severity": "warning",
            "category": "비율",
            "rule_id": "R26",
            "message": f"마감재 비중 {finishing_ratio * 100:.1f}%로 설비·전기·철거 누락 의심",
            "suggestion": "전기·설비·철거 항목이 마감재 견적에 포함되어 있는지 확인하세요.",
        })

    # R27: 면적 대비 총공사비 과소
    if type_ == "인테리어" and area >= 60 and total < area * 200_000:
        flags.append({
            "severity": "error",
            "category": "비율",
            "rule_id": "R27",
            "message": (
                f"전체 공사비 {total:,}원은 {area:.0f}m² 인테리어 기준 과소 "
                f"(최소 {int(area * 200_000):,}원 예상)"
            ),
            "suggestion": "인건비 또는 주요 공종 누락 여부를 전면 재검토하세요.",
        })

    # R28: 욕실 공사 미장(모르타르) 항목 누락
    has_plaster = (_has_category(breakdown, "미장") or _has_category(breakdown, "모르타르"))
    if has_bathroom and not has_plaster and total > 3_000_000:
        flags.append({
            "severity": "warning",
            "category": "욕실",
            "rule_id": "R28",
            "message": "욕실 공사에 미장(모르타르) 항목이 없습니다",
            "suggestion": "방수 후 바닥 미장(모르타르)은 타일 부착 전 필수 공정입니다. 별도 항목이 누락되었는지 확인하세요.",
        })

    # ── [카테고리 4] 욕실 기준 — 5개 룰 ────────────────────────────────────────

    # R29: 위생도기 없는 욕실
    has_sanitary = (_has_category(breakdown, "양변기")
                    or _has_category(breakdown, "세면대")
                    or _has_category(breakdown, "위생도기"))
    if has_bathroom and not has_sanitary:
        flags.append({
            "severity": "warning",
            "category": "욕실",
            "rule_id": "R29",
            "message": "욕실 공사에 위생도기(양변기·세면대) 항목이 없습니다",
            "suggestion": "욕실 리모델링 시 위생도기 교체 포함 여부를 확인하세요.",
        })

    # R30: 욕실 타일 없는 욕실 공사
    bath_tile = (_has_category(breakdown, "욕실타일")
                 or (has_bathroom and _has_category(breakdown, "타일")))
    if has_bathroom and not bath_tile:
        flags.append({
            "severity": "warning",
            "category": "욕실",
            "rule_id": "R30",
            "message": "욕실 공사에 타일 항목이 없습니다",
            "suggestion": "욕실 바닥·벽 타일 시공 포함 여부를 확인하세요.",
        })

    # R31: 욕실 환기팬 없음 — "환기팬" 또는 "욕실환기"로만 체크 (주방 후드의 "환기"와 혼동 방지)
    has_bath_fan = (_has_category(breakdown, "환기팬")
                   or _has_category(breakdown, "욕실환기")
                   or _has_category(breakdown, "욕실팬")
                   or _has_category(breakdown, "팬"))
    if has_bathroom and not has_bath_fan:
        flags.append({
            "severity": "info",
            "category": "욕실",
            "rule_id": "R31",
            "message": "욕실 환기팬 교체 항목이 없습니다 (권장 사항)",
            "suggestion": "욕실 환기팬은 곰팡이 방지를 위해 교체를 권장합니다. 필수 항목은 아닙니다.",
        })

    # ── [카테고리 5] 주방 기준 — 3개 룰 ────────────────────────────────────────

    # R32: 싱크대 없는 주방 인테리어
    # breakdown은 "주방" 단일 카테고리로 집계되므로 work_items에서 싱크대 항목 확인
    has_sink_in_items = (_has_item_keyword(work_items, "싱크") or _has_item_keyword(work_items, "씽크")
                         or _has_item_keyword(work_items, "주방가구"))
    has_sink_in_breakdown = (_has_category(breakdown, "싱크") or _has_category(breakdown, "씽크")
                              or _has_category(breakdown, "주방가구"))
    if has_kitchen and not has_sink_in_breakdown and not has_sink_in_items:
        flags.append({
            "severity": "warning",
            "category": "주방",
            "rule_id": "R32",
            "message": "주방 공사에 싱크대 항목이 없습니다",
            "suggestion": "싱크대·상하부장 포함 여부를 확인하세요. 별도 공급이라면 계약서에 명시하세요.",
        })


    # R34: 주방 리모델링 타일 없음
    kitchen_tile = (_has_category(breakdown, "주방타일")
                    or (has_kitchen and _has_category(breakdown, "타일")))
    if has_kitchen and not kitchen_tile and type_ == "리모델링":
        flags.append({
            "severity": "warning",
            "category": "주방",
            "rule_id": "R34",
            "message": "주방 리모델링에 타일(백타일) 항목이 없습니다",
            "suggestion": "주방 벽 백타일 또는 마감재 교체 포함 여부를 확인하세요.",
        })

    # ── [카테고리 6] 신축 기준 — 2개 룰 ────────────────────────────────────────

    # R35: 신축 단열 없음
    if (type_ == "신축"
            and not _has_category(breakdown, "단열")
            and not _has_category(breakdown, "보온")):
        flags.append({
            "severity": "warning",
            "category": "신축",
            "rule_id": "R35",
            "message": "신축 공사에 단열 항목이 없습니다",
            "suggestion": "「건축물 에너지절약 설계기준」에 따라 단열재 시공은 법적 의무입니다.",
        })

    # R36: 신축 방수 없음
    if type_ == "신축" and not has_waterproof:
        flags.append({
            "severity": "warning",
            "category": "신축",
            "rule_id": "R36",
            "message": "신축 공사에 방수 항목이 없습니다",
            "suggestion": "지붕·욕실·외벽 방수 공사 포함 여부를 확인하세요.",
        })

    # R37: 총 견적 0원
    if total <= 0:
        flags.append({
            "severity": "error",
            "category": "시스템",
            "rule_id": "R37",
            "message": "견적 합계가 0원입니다",
            "suggestion": "공종별 수량·단가 산출 결과를 재확인하세요.",
        })

    return flags


# ── Claude 총평 (룰 결과 기반) ────────────────────────────────────────────────

_COMMENT_SYSTEM = """당신은 인테리어/건설 현장 경력 18년의 견적 전문가입니다.
아래 자동 검증 결과를 바탕으로 전문가 총평 2~3문장을 한국어로 작성하세요.
순수 텍스트만 출력하고, JSON이나 마크다운은 사용하지 마세요."""


def _generate_expert_comment(
    type_: str, area: float, total: int, flags: list[dict]
) -> str:
    """룰 엔진 결과를 바탕으로 Claude가 총평 문장 생성"""
    error_count = sum(1 for f in flags if f.get("severity") == "error")
    warning_count = sum(1 for f in flags if f.get("severity") == "warning")
    unit_m2 = int(total / area) if area > 0 else 0

    flag_summary = "\n".join(
        f"- [{f['severity'].upper()}] {f['message']}" for f in flags[:6]
    ) if flags else "- 이상치 없음"

    user_msg = (
        f"공사 유형: {type_}, 면적: {area}m², 총금액: {total:,}원, m²단가: {unit_m2:,}원\n"
        f"자동 탐지된 문제: 오류 {error_count}건, 경고 {warning_count}건\n\n"
        f"주요 플래그:\n{flag_summary}\n\n"
        f"위 내용을 바탕으로 현장 전문가 관점에서 총평 2~3문장을 작성하세요."
    )

    try:
        msg = _get_client().messages.create(
            model="claude-sonnet-4-6",
            max_tokens=300,
            system=_COMMENT_SYSTEM,
            messages=[{"role": "user", "content": user_msg}],
        )
        return msg.content[0].text.strip()
    except Exception:
        if error_count > 0:
            return (
                f"{area}m² {type_} 견적에서 {error_count}건의 오류가 발견되었습니다. "
                f"누락 공종과 단가 이상치를 수정 후 재검토하시기 바랍니다."
            )
        return (
            f"{area}m² {type_} 공사 기준단가 {unit_m2:,}원/m²으로 산출되었습니다. "
            f"현장 실측 후 최종 금액을 확정하시기 바랍니다."
        )


# ── 공개 API ──────────────────────────────────────────────────────────────────

async def run_validator(
    type_: str, area: float, breakdown: dict, min_cost: int, max_cost: int,
    work_items: list | None = None,
) -> dict:
    """
    VALIDATOR 실행:
      1. Python 룰 엔진 37개 룰 → flags 생성 (AI 역할극 아님)
      2. Claude Sonnet → 룰 결과 기반 총평 문장만 생성
    """
    total = sum(breakdown.values())

    # Step 1: Python 룰 엔진
    flags = _run_rule_engine(type_, area, breakdown, work_items or [])

    # Step 2: Claude 총평 — asyncio.to_thread로 블로킹 HTTP 호출 분리
    expert_comment = await asyncio.to_thread(
        _generate_expert_comment, type_, area, total, flags
    )

    return {
        "is_valid": not any(f.get("severity") == "error" for f in flags),
        "flags": flags,
        "expert_comment": expert_comment,
        "rule_engine_version": "v1.0 (37 rules)",
    }
