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

_extra_origin = os.getenv("FRONTEND_URL", "")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ["http://localhost:3000", _extra_origin] if o],
    allow_origin_regex=r"https://.*\.vercel\.app",
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
    # v2 고도화 — 리포트/상담 연계용 optional 메타 (파이프라인 로직에는 영향 없음)
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    address: Optional[str] = None
    inquiry_id: Optional[str] = None
    # 관리자 대시보드 확장 대비 — 전체 폼 덤프를 수용 (현재는 저장하지 않음)
    form_snapshot: Optional[dict] = None


class InquiryRequest(BaseModel):
    """상담 요청 — 입력 정보 + 선택된 CTA 종류"""
    inquiry_id: Optional[str] = None
    kind: Literal["consult", "visit"] = "consult"
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    space_type: Optional[str] = None
    area: Optional[float] = None
    note: Optional[str] = None
    form_snapshot: Optional[dict] = None


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
    priced_items: list[dict] = pricer_out.get("priced_items", [])
    _gather1 = await asyncio.gather(
        run_validator(req.type, req.area, breakdown, min_cost, max_cost, priced_items),
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
        # v2 optional 메타 — reporter가 존재 시 헤더에 렌더
        "customer_name": req.customer_name,
        "customer_phone": req.customer_phone,
        "address": req.address,
        "inquiry_id": req.inquiry_id,
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
            _stream_priced = pricer_out.get("priced_items", [])
            validator_out = await run_validator(req.type, req.area, breakdown, min_cost, max_cost, _stream_priced)
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
                # v2 optional 메타
                "customer_name": req.customer_name,
                "customer_phone": req.customer_phone,
                "address": req.address,
                "inquiry_id": req.inquiry_id,
            }

            _gather3 = await asyncio.gather(
                _generate_summary_async(req.type, req.area, min_cost, max_cost),
                asyncio.to_thread(_run_reporter_safe, estimate_data),
                asyncio.to_thread(run_reporter_excel, estimate_data),
                return_exceptions=True,
            )
            summary = (
                _gather3[0] if not isinstance(_gather3[0], Exception)
                else f"{req.area}m² {req.type} 공사 견적이 완료되었습니다."
            )
            _pdf_res = _gather3[1] if not isinstance(_gather3[1], Exception) else None
            excel_b64 = _gather3[2] if not isinstance(_gather3[2], Exception) else None
            if _pdf_res is not None:
                pdf_b64, pdf_error = _pdf_res
            else:
                pdf_b64, pdf_error = None, str(_gather3[1]) if isinstance(_gather3[1], Exception) else None
            estimate_data["summary"] = summary
            estimate_data["pdf_base64"] = pdf_b64 or None
            estimate_data["excel_base64"] = excel_b64 or None
            if pdf_error:
                estimate_data["pdf_error"] = pdf_error

            yield f"data: {json.dumps({'event': 'agent_done', 'agent': 'REPORTER', 'step': 4, 'data': {'has_pdf': bool(pdf_b64), 'has_excel': bool(excel_b64)}})}\n\n"
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
        validator_out = await run_validator(req.type, req.area, breakdown, min_cost, max_cost, work_items)
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
        return_exceptions=True,
    )
    tier_results = [r for r in tier_results if not isinstance(r, Exception)]

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

    validator_out = await run_validator(req.type, req.area, req.breakdown, min_cost, max_cost, req.work_items or [])

    summary = req.summary or await _generate_summary_async(req.type, req.area, min_cost, max_cost)

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
    _gather4 = await asyncio.gather(
        asyncio.to_thread(_run_reporter_safe, estimate_data),
        asyncio.to_thread(run_reporter_excel, estimate_data),
        return_exceptions=True,
    )
    _pdf_res4 = _gather4[0] if not isinstance(_gather4[0], Exception) else None
    excel_result = _gather4[1] if not isinstance(_gather4[1], Exception) else None
    if _pdf_res4 is not None:
        pdf_b64, pdf_error = _pdf_res4
    else:
        pdf_b64, pdf_error = None, str(_gather4[0]) if isinstance(_gather4[0], Exception) else None
    estimate_data["pdf_base64"] = pdf_b64 or None
    estimate_data["excel_base64"] = excel_result or None
    if pdf_error:
        estimate_data["pdf_error"] = pdf_error
        logger.error("recalculate PDF 생성 실패: %s", pdf_error)

    return estimate_data


# ── 상담 요청 접수 (MVP) ────────────────────────────────────
#   NOTE: 프로덕션 환경에서는 외부 DB(Supabase 등) 연동이 필요합니다.
#   Railway/Vercel 컨테이너는 휘발성이므로 파일 저장은 재배포 시 초실됩니다.
#   현재 MVP: stdout 로그 + JSONL 파일 append (컨테이너 수명 내 조회 가능).

_INQUIRY_LOG_PATH = os.path.join(os.path.dirname(__file__), "data", "inquiries.jsonl")


@app.post("/api/inquiries")
async def create_inquiry(req: InquiryRequest):
    """상담/방문 요청 접수 — 최소 구현. 확인용 inquiry_id와 접수 시각을 반환."""
    from datetime import datetime as _dt

    inquiry_id = req.inquiry_id or f"INQ-{_dt.now().strftime('%y%m%d')}-{_dt.now().microsecond % 1000:03d}"
    received_at = _dt.now().isoformat(timespec="seconds")
    record = {
        "inquiry_id": inquiry_id,
        "kind": req.kind,
        "received_at": received_at,
        "customer_name": req.customer_name,
        "customer_phone": req.customer_phone,
        "email": req.email,
        "address": req.address,
        "space_type": req.space_type,
        "area": req.area,
        "note": req.note,
        # form_snapshot은 용량이 커서 로그에는 길이만 기록
        "form_snapshot_keys": list((req.form_snapshot or {}).keys()) if req.form_snapshot else None,
    }

    # 1) stdout 로그 — 컨테이너 로그에서 바로 확인 가능
    logger.info("inquiry received: %s %s %s", record["inquiry_id"], record["kind"], record["customer_phone"])

    # 2) JSONL 파일 append (휘발성이지만 개발 환경에서 확인용)
    try:
        os.makedirs(os.path.dirname(_INQUIRY_LOG_PATH), exist_ok=True)
        with open(_INQUIRY_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception as e:
        logger.warning("inquiry JSONL append 실패: %s", e)

    return {
        "ok": True,
        "inquiry_id": inquiry_id,
        "kind": req.kind,
        "received_at": received_at,
        "message": (
            "상담 요청이 접수되었습니다. 영업일 기준 1일 이내 담당자가 연락드립니다."
            if req.kind == "consult"
            else "현장 방문 상담 요청이 접수되었습니다. 일정 조율을 위해 곧 연락드립니다."
        ),
    }


def _run_reporter_safe(estimate_data: dict) -> tuple[str | None, str | None]:
    """run_reporter 래퍼 — (pdf_b64, error_msg) 튜플 반환. 실패 시 error_msg에 원인 포함."""
    try:
        result = run_reporter(estimate_data)
        if result is None:
            return None, "run_reporter returned None (폰트 누락 또는 fpdf2 오류 — 서버 로그 확인)"
        return result, None
    except Exception as e:
        import traceback
        return None, traceback.format_exc()


async def _generate_summary_async(type_: str, area: float, min_cost: int, max_cost: int) -> str:
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
