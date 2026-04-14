"""JH EstimateAI — FastAPI Backend v0.3 (5 Agent Pipeline + Parallel Execution)"""
import asyncio
import json
import logging
import os
from typing import Literal, Optional

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

load_dotenv()

# ── 로그 설정 (Railway/uvicorn 환경에서 하위 logger 포함 캡처) ─────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

from agents.estimator import run_estimator
from agents.pricer import run_pricer
from agents.reporter import run_reporter, run_reporter_excel
from agents.scanner import run_scanner
from agents.validator import run_validator

app = FastAPI(title="JH EstimateAI API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

_claude = None


def _get_claude():
    global _claude
    if _claude is None:
        _claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    return _claude


# ── 요청/응답 모델 ────────────────────────────────────────

class EstimateRequest(BaseModel):
    description: str
    area: float = Field(gt=0)
    type: Literal["인테리어", "신축", "리모델링"]
    image_base64: Optional[str] = None   # Wave 4 SCANNER


class RecalculateRequest(BaseModel):
    type: str
    area: float
    breakdown: dict                      # 사용자 수정 공종별 금액
    work_items: Optional[list] = None
    summary: Optional[str] = None
    scanner_context: Optional[str] = None


# ── 헬스체크 ─────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "JH EstimateAI API",
        "version": "0.2.0",
        "agents": ["SCANNER", "ESTIMATOR", "PRICER", "VALIDATOR", "REPORTER"],
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "api_key_set": bool(os.getenv("ANTHROPIC_API_KEY")),
    }


# ── 메인 파이프라인 ────────────────────────────────────────

@app.post("/api/estimate")
async def estimate(req: EstimateRequest):
    """5 에이전트 파이프라인 — Agent1~4 순차 / Agent5+Summary 병렬"""

    # ── 순차: Agent 1 → 2 → 3 → 4 (데이터 의존성) ──────
    scanner_context = ""
    if req.image_base64:
        scanner_context = await run_scanner(req.image_base64)

    estimator_out = await run_estimator(req.type, req.area, req.description, scanner_context)
    work_items: list[dict] = estimator_out.get("work_items", [])

    pricer_out = await asyncio.to_thread(run_pricer, work_items)
    breakdown: dict[str, int] = pricer_out["breakdown"]
    min_cost: int = pricer_out["min_cost"]
    max_cost: int = pricer_out["max_cost"]
    subtotal: int = pricer_out["subtotal"]
    unit_price: int = int(subtotal / req.area) if req.area > 0 else 0

    # ── 병렬: VALIDATOR + Summary 동시 실행 (PRICER 완료 후) ──
    _gather1 = await asyncio.gather(
        run_validator(req.type, req.area, breakdown, min_cost, max_cost),
        _generate_summary_async(req.type, req.area, min_cost, max_cost),
        return_exceptions=True,
    )
    validator_out = (
        _gather1[0] if not isinstance(_gather1[0], Exception)
        else {"flags": [], "expert_comment": "", "is_valid": True}
    )
    summary = (
        _gather1[1] if not isinstance(_gather1[1], Exception)
        else f"{req.area}m² {req.type} 공사 견적이 완료되었습니다."
    )

    # ── 견적 데이터 조합 ───────────────────────────────
    estimate_data = {
        "type": req.type,
        "area": req.area,
        "min_cost": min_cost,
        "max_cost": max_cost,
        "unit_price": unit_price,
        "breakdown": breakdown,
        "work_items": pricer_out.get("priced_items", []),
        "summary": summary,
        "validator_flags": validator_out.get("flags", []),
        "expert_comment": validator_out.get("expert_comment", ""),
        "is_valid": validator_out.get("is_valid", True),
        "rule_engine_version": validator_out.get("rule_engine_version", ""),
        "scanner_context": scanner_context,
    }

    # ── 병렬: Agent5 PDF + Excel 동시 생성 ────────────
    _gather2 = await asyncio.gather(
        asyncio.to_thread(_run_reporter_safe, estimate_data),
        asyncio.to_thread(run_reporter_excel, estimate_data),
        return_exceptions=True,
    )
    pdf_result = _gather2[0] if not isinstance(_gather2[0], Exception) else None
    excel_b64 = _gather2[1] if not isinstance(_gather2[1], Exception) else None
    if pdf_result is not None:
        pdf_b64, pdf_error = pdf_result
    else:
        pdf_b64, pdf_error = None, str(_gather2[0]) if isinstance(_gather2[0], Exception) else None
    estimate_data["pdf_base64"] = pdf_b64 or None
    estimate_data["excel_base64"] = excel_b64 or None
    if pdf_error:
        estimate_data["pdf_error"] = pdf_error
        logger.error("estimate PDF 생성 실패: %s", pdf_error)

    return estimate_data


# ── SSE 스트리밍 파이프라인 ────────────────────────────────

@app.post("/api/estimate/stream")
async def estimate_stream(req: EstimateRequest):
    """5 에이전트 파이프라인 — SSE 실시간 스트리밍"""

    async def generator():
        try:
            yield f"data: {json.dumps({'event': 'pipeline_start'})}\n\n"

            # ── 순차: Agent 1 SCANNER ──────────────────────
            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'SCANNER', 'step': 0})}\n\n"
            scanner_context = ""
            if req.image_base64:
                scanner_context = await run_scanner(req.image_base64)
            yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'SCANNER', 'step': 0, 'data': {'scanner_context': scanner_context}})}\n\n"

            # ── 순차: Agent 2 ESTIMATOR ────────────────────
            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'ESTIMATOR', 'step': 1})}\n\n"
            estimator_out = await run_estimator(req.type, req.area, req.description, scanner_context)
            work_items: list[dict] = estimator_out.get("work_items", [])
            yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'ESTIMATOR', 'step': 1, 'data': {'work_items_count': len(work_items)}})}\n\n"

            # ── 순차: Agent 3 PRICER ───────────────────────
            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'PRICER', 'step': 2})}\n\n"
            pricer_out = await asyncio.to_thread(run_pricer, work_items)
            breakdown: dict[str, int] = pricer_out["breakdown"]
            min_cost: int = pricer_out["min_cost"]
            max_cost: int = pricer_out["max_cost"]
            subtotal: int = pricer_out["subtotal"]
            unit_price: int = int(subtotal / req.area) if req.area > 0 else 0
            yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'PRICER', 'step': 2, 'data': {'min_cost': min_cost, 'max_cost': max_cost, 'breakdown': breakdown}})}\n\n"

            # ── 순차: Agent 4 VALIDATOR ────────────────────
            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'VALIDATOR', 'step': 3})}\n\n"
            validator_out = await run_validator(req.type, req.area, breakdown, min_cost, max_cost)
            yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'VALIDATOR', 'step': 3, 'data': {'flags_count': len(validator_out.get('flags', []))}})}\n\n"

            # ── 병렬: Agent 5 REPORTER + Summary 동시 실행 ─
            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'REPORTER', 'step': 4, 'parallel': True})}\n\n"

            estimate_data = {
                "type": req.type,
                "area": req.area,
                "min_cost": min_cost,
                "max_cost": max_cost,
                "unit_price": unit_price,
                "breakdown": breakdown,
                "work_items": pricer_out.get("priced_items", []),
                "validator_flags": validator_out.get("flags", []),
                "expert_comment": validator_out.get("expert_comment", ""),
                "is_valid": validator_out.get("is_valid", True),
                "rule_engine_version": validator_out.get("rule_engine_version", ""),
                "scanner_context": scanner_context,
            }

            summary, pdf_result, excel_b64 = await asyncio.gather(
                _generate_summary(req.type, req.area, min_cost, max_cost),
                asyncio.to_thread(_run_reporter_safe, estimate_data),
                asyncio.to_thread(run_reporter_excel, estimate_data),
            )
            pdf_b64, pdf_error = pdf_result
            estimate_data["summary"] = summary
            estimate_data["pdf_base64"] = pdf_b64 or None
            estimate_data["excel_base64"] = excel_b64 or None
            if pdf_error:
                estimate_data["pdf_error"] = pdf_error

            yield f"data: {json.dumps({'event': 'complete', 'data': estimate_data})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/estimate/compare")
async def estimate_compare(req: EstimateRequest):
    """저가/표준/고급 3단계 비교 견적 — 3개 등급 asyncio.gather 병렬 실행"""

    # ── 순차: SCANNER + ESTIMATOR (공통, 한 번만) ─────────
    scanner_context = ""
    if req.image_base64:
        scanner_context = await run_scanner(req.image_base64)

    estimator_out = await run_estimator(req.type, req.area, req.description, scanner_context)
    work_items: list[dict] = estimator_out.get("work_items", [])

    tier_labels = {"budget": "저가", "standard": "표준", "premium": "고급"}

    # ── 병렬: 3개 등급 PRICER+VALIDATOR 동시 실행 ─────────
    async def _run_tier(tier: str) -> tuple[str, dict]:
        pricer_out = await asyncio.to_thread(run_pricer, work_items, tier)
        breakdown: dict[str, int] = pricer_out["breakdown"]
        min_cost: int = pricer_out["min_cost"]
        max_cost: int = pricer_out["max_cost"]
        subtotal: int = pricer_out["subtotal"]
        unit_price: int = int(subtotal / req.area) if req.area > 0 else 0
        validator_out = await run_validator(req.type, req.area, breakdown, min_cost, max_cost)
        return tier, {
            "tier": tier,
            "tier_label": tier_labels[tier],
            "min_cost": min_cost,
            "max_cost": max_cost,
            "unit_price": unit_price,
            "breakdown": breakdown,
            "validator_flags": validator_out.get("flags", []),
            "is_valid": validator_out.get("is_valid", True),
        }

    tier_results = await asyncio.gather(
        _run_tier("budget"),
        _run_tier("standard"),
        _run_tier("premium"),
    )

    return {
        "type": req.type,
        "area": req.area,
        "scanner_context": scanner_context,
        "compare": {tier: data for tier, data in tier_results},
    }


# ── 단가 수동 조정 재계산 ───────────────────────────────────

@app.post("/api/estimate/recalculate")
async def recalculate(req: RecalculateRequest):
    """사용자 수정 breakdown으로 VALIDATOR + REPORTER 재실행"""
    subtotal = sum(req.breakdown.values())
    min_cost = int(subtotal * 0.90)
    max_cost = int(subtotal * 1.15)
    unit_price = int(subtotal / req.area) if req.area > 0 else 0

    validator_out = await run_validator(req.type, req.area, req.breakdown, min_cost, max_cost)

    summary = req.summary or await _generate_summary(req.type, req.area, min_cost, max_cost)

    estimate_data = {
        "type": req.type,
        "area": req.area,
        "min_cost": min_cost,
        "max_cost": max_cost,
        "unit_price": unit_price,
        "breakdown": req.breakdown,
        "work_items": req.work_items or [],
        "summary": summary,
        "validator_flags": validator_out.get("flags", []),
        "expert_comment": validator_out.get("expert_comment", ""),
        "is_valid": validator_out.get("is_valid", True),
        "rule_engine_version": validator_out.get("rule_engine_version", ""),
        "scanner_context": req.scanner_context or "",
    }

    # ── 병렬: PDF + Excel 동시 생성 ──────────────────────
    pdf_result, excel_result = await asyncio.gather(
        asyncio.to_thread(_run_reporter_safe, estimate_data),
        asyncio.to_thread(run_reporter_excel, estimate_data),
    )
    pdf_b64, pdf_error = pdf_result
    estimate_data["pdf_base64"] = pdf_b64 or None
    estimate_data["excel_base64"] = excel_result or None
    if pdf_error:
        estimate_data["pdf_error"] = pdf_error
        logger.error("recalculate PDF 생성 실패: %s", pdf_error)

    return estimate_data


def _run_reporter_safe(estimate_data: dict) -> tuple[str | None, str | None]:
    """run_reporter 래퍼 — (pdf_b64, error_msg) 튜플 반환. 실패 시 error_msg에 원인 포함."""
    try:
        result = run_reporter(estimate_data)
        if result is None:
            return None, "run_reporter returned None (폰트 누락 또는 fpdf2 오류 — Railway 로그 확인)"
        return result, None
    except Exception as e:
        import traceback
        return None, traceback.format_exc()


async def _generate_summary(type_: str, area: float, min_cost: int, max_cost: int) -> str:
    """Haiku 요약 생성 — asyncio.to_thread로 이벤트 루프 비블로킹"""
    def _sync_call() -> str:
        try:
            msg = _get_claude().messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=200,
                messages=[{
                    "role": "user",
                    "content": (
                        f"공사 유형: {type_}, 면적: {area}m², "
                        f"견적: {min_cost:,}원~{max_cost:,}원. "
                        f"전문적이고 간결한 2문장 요약:"
                    ),
                }]
            )
            return msg.content[0].text.strip()
        except Exception:
            return (
                f"{area}m² {type_} 공사 예상 비용은 {min_cost:,}원 ~ {max_cost:,}원입니다. "
                f"현장 실측 후 최종 금액이 확정됩니다."
            )
    return await asyncio.to_thread(_sync_call)
