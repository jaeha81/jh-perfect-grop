"""Agent 1: SCANNER — Claude Vision 이미지 공간 분석 (다중 이미지 지원)"""
import logging
import os
from typing import List
import anthropic

logger = logging.getLogger(__name__)

_client = None

# 역할별 최대 이미지 수 (토큰 비용 제어)
MAX_PHOTOS   = 4
MAX_DRAWINGS = 2
MAX_SKETCHES = 2


def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    return _client


SCANNER_SYSTEM = """당신은 인테리어/건설 현장 공간 분석 전문가입니다.
제공된 이미지(현장사진·도면·스케치)를 종합 분석하여 견적 산출에 필요한 정보를 추출합니다.

다음 항목을 분석하세요:
1. 공간 유형: 거실/주방/욕실/침실/현관 등
2. 현재 마감 상태: 바닥재·벽지·천장 종류 및 노후도 (1~10점)
3. 공사 필요 항목: 교체 필요 부분, 우선순위
4. 도면/스케치 정보: 공간 구성, 면적 추정, 레이아웃 특이사항 (도면 제공 시)
5. 특이사항: 결로·균열·곰팡이·배관 누수 흔적, 구조적 제약 등

분석 결과를 3~5문장으로 간결하게 서술하세요. 이미지별 역할 레이블을 참고하여 통합 분석하세요."""


def _make_image_block(base64: str, label: str, idx: int) -> list:
    """이미지 + 역할 레이블 텍스트 블록 쌍 반환"""
    media = "image/jpeg"  # base64는 항상 이미지 (PDF 제외 처리됨)
    return [
        {"type": "text", "text": f"[{label} {idx + 1}]"},
        {
            "type": "image",
            "source": {"type": "base64", "media_type": media, "data": base64},
        },
    ]


async def run_scanner(image_base64: str, media_type: str = "image/jpeg") -> str:
    """단일 이미지 분석 — 하위 호환용 (내부적으로 multi 호출)"""
    return await run_scanner_multi(
        legacy_base64=image_base64,
        photos=[],
        drawings=[],
        sketches=[],
    )


async def run_scanner_multi(
    legacy_base64: str = "",
    photos: List[str] = None,
    drawings: List[str] = None,
    sketches: List[str] = None,
) -> str:
    """다중 이미지 공간 분석 — 현장사진·도면·스케치 통합 분석

    Args:
        legacy_base64: 하위 호환용 단일 이미지 (image_base64 필드)
        photos:   현장사진 base64 목록 (최대 MAX_PHOTOS)
        drawings: 도면 이미지 base64 목록 (최대 MAX_DRAWINGS)
        sketches: 스케치 base64 목록 (최대 MAX_SKETCHES)
    Returns:
        공간 분석 결과 문자열
    """
    photos   = (photos   or [])[:MAX_PHOTOS]
    drawings = (drawings or [])[:MAX_DRAWINGS]
    sketches = (sketches or [])[:MAX_SKETCHES]

    # 유효한 base64만 필터 (빈 문자열·None 제거)
    photos   = [b for b in photos   if b]
    drawings = [b for b in drawings if b]
    sketches = [b for b in sketches if b]

    # legacy 단일 이미지 — photos에 없으면 prepend
    if legacy_base64 and legacy_base64 not in photos:
        photos = [legacy_base64] + photos
        photos = photos[:MAX_PHOTOS]

    total = len(photos) + len(drawings) + len(sketches)
    if total == 0:
        return ""

    # 콘텐츠 블록 조합: 현장사진 → 도면 → 스케치 순
    content_blocks = []
    for i, b in enumerate(photos):
        content_blocks.extend(_make_image_block(b, "현장사진", i))
    for i, b in enumerate(drawings):
        content_blocks.extend(_make_image_block(b, "도면", i))
    for i, b in enumerate(sketches):
        content_blocks.extend(_make_image_block(b, "스케치", i))

    content_blocks.append({
        "type": "text",
        "text": (
            f"총 {total}장의 이미지(현장사진 {len(photos)}장·도면 {len(drawings)}장·스케치 {len(sketches)}장)를 "
            "종합하여 공간 분석을 수행해주세요. 견적 산출에 필요한 핵심 정보를 추출하세요."
        ),
    })

    try:
        client = _get_client()
        msg = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            system=SCANNER_SYSTEM,
            messages=[{"role": "user", "content": content_blocks}],
        )
        return msg.content[0].text
    except Exception as exc:
        logger.warning("[SCANNER] 이미지 분석 실패: %s", exc, exc_info=True)
        return ""
