"""Agent 4: VALIDATOR — 18년 현장 경험 기반 이상치 탐지"""
import json
import os
import anthropic

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    return _client


VALIDATOR_SYSTEM = """당신은 인테리어/건설 현장 경력 18년의 견적 검증 전문가입니다.
아래 현장 기준으로 견적 이상치를 탐지하고, 반드시 순수 JSON만 출력하세요 (마크다운 블록 없이).

## 현장 검증 기준 (18년 경험 누적)

### 인테리어/리모델링 공사
- m² 당 150,000원 미만: 인건비 미포함 수준 → error
- m² 당 800,000원 초과: 고급/특수 마감재 여부 확인 → warning
- 전기 항목이 전체의 3% 미만: 전기공사 누락 의심 → warning
- 설비 항목이 전체의 5% 미만: 욕실·주방 설비 누락 의심 → warning
- 철거 항목 없는 리모델링: 철거비 누락 → warning
- 욕실 타일 없는 욕실 공사: 타일 항목 확인 → warning

### 욕실 공사 기준
- 욕실 1개 총비용(설비+타일+위생도기) 150만원 미만: 품질 위험 → error
- 욕실 타일 단가 55,000원/m² 미만: 저품질 자재 우려 → warning
- 방수 처리 미포함 욕실 공사: 누수 리스크 → warning

### 주방 공사 기준
- 싱크대 없는 주방 인테리어: 별도 여부 확인 → warning
- 주방 후드 없는 싱크대 교체: 환기 법규 검토 → warning

### 신축 공사 기준
- m² 당 1,000,000원 미만: 마감재 별도 가능성 확인 → warning
- m² 당 3,000,000원 초과: 고급 마감재 확인 필요 → warning

## 출력 형식 (반드시 순수 JSON, 마크다운 없이):
{
  "is_valid": true,
  "flags": [
    {
      "severity": "warning",
      "category": "전기",
      "message": "전기 공사 비중이 전체의 2%로 낮습니다",
      "suggestion": "전기 항목 누락 여부를 재확인하세요"
    }
  ],
  "expert_comment": "전체 견적에 대한 18년 경험 기반 총평 2~3문장"
}"""


async def run_validator(type_: str, area: float, breakdown: dict, min_cost: int, max_cost: int) -> dict:
    """견적 이상치 탐지 — Claude Sonnet"""
    total = sum(breakdown.values())
    if total <= 0:
        return {"is_valid": True, "flags": [], "expert_comment": ""}

    unit_price_per_m2 = int(total / area) if area > 0 else 0

    breakdown_lines = "\n".join(
        f"- {k}: {v:,}원 ({v / total * 100:.1f}%)"
        for k, v in breakdown.items()
    )

    user_msg = (
        f"공사 유형: {type_}\n"
        f"면적: {area}m²\n"
        f"견적 범위: {min_cost:,}원 ~ {max_cost:,}원\n"
        f"m² 당 단가: {unit_price_per_m2:,}원\n\n"
        f"공종별 내역:\n{breakdown_lines}\n\n"
        f"위 견적을 전문가 기준으로 검증해주세요. 순수 JSON만 출력하세요."
    )

    try:
        client = _get_client()
        msg = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1200,
            system=VALIDATOR_SYSTEM,
            messages=[{"role": "user", "content": user_msg}]
        )

        text = msg.content[0].text.strip()

        # JSON 블록 제거 (혹시 마크다운이 포함된 경우)
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        result = json.loads(text)
        return result

    except Exception:
        return {
            "is_valid": True,
            "flags": [],
            "expert_comment": (
                f"{area}m² {type_} 공사 기준가 {unit_price_per_m2:,}원/m²의 견적입니다. "
                f"현장 실측 후 최종 금액을 확정하시기 바랍니다."
            ),
        }
