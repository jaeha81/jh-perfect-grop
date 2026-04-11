"""Agent 2: ESTIMATOR — Claude Haiku 공종별 수량 산출"""
import os
import anthropic

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    return _client


ESTIMATOR_SYSTEM = """당신은 인테리어/건설 공사 수량 산출 전문가입니다.
공사 정보를 분석하여 공종별 시공 수량을 정확하게 산출하세요.

## 면적 기준 산출 공식
- 바닥면적 = 전체 면적 (m²)
- 벽면적 = 전체 면적 × 2.5 (층고 2.5m 기준)
- 천장면적 = 전체 면적
- 욕실면적 = 전체 면적 × 0.06 (화장실 1개 기준, 2개면 × 0.10)
- 주방면적 = 전체 면적 × 0.12

## 공사 설명 파악 기준
1. 철거 여부: 리모델링/인테리어 = 철거 필수, 신축 = 불필요
2. 바닥재: 강마루(일반)/타일(욕실·주방)/데코타일(상업) 등
3. 벽 마감: 도배(실크=기본), 타일(욕실·주방), 페인트 등
4. 욕실 포함 여부: 욕실철거+타일+위생도기+설비
5. 주방 포함 여부: 주방철거+타일+싱크대+후드
6. 전기/설비: 별도 언급 없으면 전체 공사에 포함
7. 창호: 새시 교체 언급 시 포함

## submit_work_items 함수를 반드시 호출하세요."""

ESTIMATOR_TOOLS = [
    {
        "name": "submit_work_items",
        "description": "공종별 수량 산출 결과를 제출합니다",
        "input_schema": {
            "type": "object",
            "properties": {
                "work_items": {
                    "type": "array",
                    "description": "공종별 수량 목록",
                    "items": {
                        "type": "object",
                        "properties": {
                            "category": {
                                "type": "string",
                                "description": "공종 카테고리 (예: 바닥, 벽체/도장, 전기, 설비/배관)"
                            },
                            "item": {
                                "type": "string",
                                "description": "세부 항목명 (unit_prices.json의 키와 일치)"
                            },
                            "quantity": {
                                "type": "number",
                                "description": "수량 (소수점 1자리)"
                            },
                            "unit": {
                                "type": "string",
                                "description": "단위: m², 개, 식, m 중 하나"
                            }
                        },
                        "required": ["category", "item", "quantity", "unit"]
                    }
                },
                "notes": {
                    "type": "string",
                    "description": "특이사항 또는 추가 설명"
                }
            },
            "required": ["work_items"]
        }
    }
]


async def run_estimator(type_: str, area: float, description: str, scanner_context: str = "") -> dict:
    """공종별 수량 산출 — Claude Haiku tool_use"""
    context_line = f"\n공간 분석 결과: {scanner_context}" if scanner_context else ""
    user_msg = (
        f"공사 유형: {type_}\n"
        f"전체 면적: {area}m²\n"
        f"공사 설명: {description}"
        f"{context_line}\n\n"
        f"submit_work_items 함수를 호출하여 공종별 수량을 제출하세요."
    )

    try:
        client = _get_client()
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            system=ESTIMATOR_SYSTEM,
            tools=ESTIMATOR_TOOLS,
            tool_choice={"type": "any"},
            messages=[{"role": "user", "content": user_msg}]
        )

        for block in msg.content:
            if block.type == "tool_use" and block.name == "submit_work_items":
                return block.input

        return _fallback_estimate(type_, area)

    except Exception:
        return _fallback_estimate(type_, area)


def _fallback_estimate(type_: str, area: float) -> dict:
    """에이전트 실패 시 기본 비율 기반 수량 산출"""
    bath_area = round(area * 0.06, 1)
    kitchen_area = round(area * 0.12, 1)
    wall_area = round(area * 2.5, 1)

    if type_ == "신축":
        items = [
            {"category": "바닥", "item": "타일(600mm)", "quantity": area, "unit": "m²"},
            {"category": "벽체/도장", "item": "페인트(일반)", "quantity": wall_area, "unit": "m²"},
            {"category": "천장", "item": "석고보드천장", "quantity": area, "unit": "m²"},
            {"category": "전기", "item": "전기공사(전체)", "quantity": 1, "unit": "식"},
            {"category": "설비/배관", "item": "설비공사(전체)", "quantity": 1, "unit": "식"},
            {"category": "주방", "item": "싱크대(일자형)", "quantity": 1, "unit": "식"},
        ]
    else:
        items = [
            {"category": "철거/해체", "item": "바닥철거", "quantity": area, "unit": "m²"},
            {"category": "철거/해체", "item": "벽체철거", "quantity": wall_area, "unit": "m²"},
            {"category": "철거/해체", "item": "욕실철거", "quantity": 1, "unit": "식"},
            {"category": "바닥", "item": "강마루", "quantity": area - bath_area, "unit": "m²"},
            {"category": "바닥", "item": "타일(300mm)", "quantity": bath_area + kitchen_area, "unit": "m²"},
            {"category": "벽체/도장", "item": "도배(실크)", "quantity": wall_area, "unit": "m²"},
            {"category": "벽체/도장", "item": "타일(욕실벽)", "quantity": bath_area * 4, "unit": "m²"},
            {"category": "천장", "item": "석고보드천장", "quantity": area, "unit": "m²"},
            {"category": "전기", "item": "전기공사(전체)", "quantity": 1, "unit": "식"},
            {"category": "설비/배관", "item": "욕실설비(전체)", "quantity": 1, "unit": "식"},
            {"category": "설비/배관", "item": "보일러교체", "quantity": 1, "unit": "식"},
            {"category": "주방", "item": "싱크대(일자형)", "quantity": 1, "unit": "식"},
            {"category": "주방", "item": "주방후드", "quantity": 1, "unit": "개"},
            {"category": "마감/기타", "item": "몰딩(걸레받이)", "quantity": round(area * 0.8, 1), "unit": "m"},
        ]

    return {"work_items": items, "notes": "기본 비율 기반 산출 (fallback)"}
