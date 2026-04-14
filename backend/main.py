"""JH EstimateAI — FastAPI Backend v0.2 (5 Agent Pipeline)"""
import json
import os
from typing import Optional

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

from agents.estimator import run_estimator
from agents.pricer import run_pricer
from agents.reporter import run_reporter, run_reporter_excel
from agents.scanner import run_scanner
from agents.validator import run_validator

app = FastAPI(title="JH EstimateAI API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    area: float
    type: str                       # 인테리어 | 신축 | 리모델링
    image_base64: Optional[str] = None   # Wave 4 SCANNER


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
    """5 에이전트 파이프라인 실행"""

    # ── Agent 1: SCANNER (이미지 첨부 시) ──────────────
    scanner_context = ""
    if req.image_base64:
        scanner_context = await run_scanner(req.image_base64)

    # ── Agent 2: ESTIMATOR ─────────────────────────────
    estimator_out = await run_estimator(req.type, req.area, req.description, scanner_context)
    work_items: list[dict] = estimator_out.get("work_items", [])

    # ── Agent 3: PRICER ────────────────────────────────
    pricer_out = run_pricer(work_items)
    breakdown: dict[str, int] = pricer_out["breakdown"]
    min_cost: int = pricer_out["min_cost"]
    max_cost: int = pricer_out["max_cost"]
    subtotal: int = pricer_out["subtotal"]
    unit_price: int = int(subtotal / req.area) if req.area > 0 else 0

    # ── Agent 4: VALIDATOR ─────────────────────────────
    validator_out = await run_validator(req.type, req.area, breakdown, min_cost, max_cost)

    # ── AI 요약 생성 (Haiku) ────────────────────────────
    summary = _generate_summary(req.type, req.area, min_cost, max_cost)

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

    # ── Agent 5: REPORTER (PDF) ────────────────────────
    pdf_b64 = run_reporter(estimate_data)
    if pdf_b64:
        estimate_data["pdf_base64"] = pdf_b64

    excel_b64 = run_reporter_excel(estimate_data)
    if excel_b64:
        estimate_data["excel_base64"] = excel_b64

    return estimate_data


# ── SSE 스트리밍 파이프라인 ────────────────────────────────

@app.post("/api/estimate/stream")
async def estimate_stream(req: EstimateRequest):
    """5 에이전트 파이프라인 — SSE 실시간 스트리밍"""

    async def generator():
        try:
            yield f"data: {json.dumps({'event': 'pipeline_start'})}\n\n"

            # Agent 1: SCANNER
            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'SCANNER', 'step': 0})}\n\n"
            scanner_context = ""
            if req.image_base64:
                scanner_context = await run_scanner(req.image_base64)
            yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'SCANNER', 'step': 0, 'data': {'scanner_context': scanner_context}})}\n\n"

            # Agent 2: ESTIMATOR
            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'ESTIMATOR', 'step': 1})}\n\n"
            estimator_out = await run_estimator(req.type, req.area, req.description, scanner_context)
            work_items: list[dict] = estimator_out.get("work_items", [])
            yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'ESTIMATOR', 'step': 1, 'data': {'work_items_count': len(work_items)}})}\n\n"

            # Agent 3: PRICER
            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'PRICER', 'step': 2})}\n\n"
            pricer_out = run_pricer(work_items)
            breakdown: dict[str, int] = pricer_out["breakdown"]
            min_cost: int = pricer_out["min_cost"]
            max_cost: int = pricer_out["max_cost"]
            subtotal: int = pricer_out["subtotal"]
            unit_price: int = int(subtotal / req.area) if req.area > 0 else 0
            yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'PRICER', 'step': 2, 'data': {'min_cost': min_cost, 'max_cost': max_cost, 'breakdown': breakdown}})}\n\n"

            # Agent 4: VALIDATOR
            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'VALIDATOR', 'step': 3})}\n\n"
            validator_out = await run_validator(req.type, req.area, breakdown, min_cost, max_cost)
            yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'VALIDATOR', 'step': 3, 'data': {'flags_count': len(validator_out.get('flags', []))}})}\n\n"

            # Agent 5: REPORTER
            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'REPORTER', 'step': 4})}\n\n"
            summary = _generate_summary(req.type, req.area, min_cost, max_cost)

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

            pdf_b64 = run_reporter(estimate_data)
            if pdf_b64:
                estimate_data["pdf_base64"] = pdf_b64

            excel_b64 = run_reporter_excel(estimate_data)
            if excel_b64:
                estimate_data["excel_base64"] = excel_b64

            yield f"data: {json.dumps({'event': 'complete', 'data': estimate_data})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _generate_summary(type_: str, area: float, min_cost: int, max_cost: int) -> str:
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
