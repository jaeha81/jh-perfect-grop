"""Agent 1: SCANNER — Claude Vision 이미지 공간 분석"""
import os
import anthropic

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    return _client


SCANNER_SYSTEM = """당신은 인테리어/건설 현장 공간 분석 전문가입니다.
제공된 이미지를 분석하여 견적 산출에 필요한 정보를 추출합니다.

다음 항목을 분석하세요:
1. 공간 유형: 거실/주방/욕실/침실/현관 등
2. 현재 마감 상태: 바닥재·벽지·천장 종류 및 노후도 (1~10점)
3. 공사 필요 항목: 교체 필요 부분, 우선순위
4. 특이사항: 결로·균열·곰팡이·배관 누수 흔적 등

분석 결과를 2~3문장으로 간결하게 서술하세요."""


async def run_scanner(image_base64: str, media_type: str = "image/jpeg") -> str:
    """이미지 분석 후 공간 정보 반환 — Claude Sonnet Vision"""
    try:
        client = _get_client()
        msg = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=600,
            system=SCANNER_SYSTEM,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_base64,
                        },
                    },
                    {
                        "type": "text",
                        "text": "이 공간을 분석하여 견적 산출에 필요한 정보를 추출해주세요.",
                    },
                ],
            }]
        )
        return msg.content[0].text
    except Exception:
        return ""
