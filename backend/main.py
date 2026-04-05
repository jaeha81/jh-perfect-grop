"""JH EstimateAI — FastAPI Backend"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import anthropic
import os

load_dotenv()

app = FastAPI(title="JH EstimateAI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))


class EstimateRequest(BaseModel):
    description: str
    area: float
    type: str  # 인테리어 | 신축 | 리모델링


class EstimateResponse(BaseModel):
    type: str
    area: float
    min_cost: int
    max_cost: int
    unit_price: int
    breakdown: dict
    summary: str


@app.get("/")
def root():
    return {"status": "ok", "service": "JH EstimateAI API"}


@app.get("/api/health")
def health():
    return {"status": "healthy", "api_key_set": bool(os.getenv("ANTHROPIC_API_KEY"))}


@app.post("/api/estimate", response_model=EstimateResponse)
async def estimate(req: EstimateRequest):
    # 기본 단가 테이블 (원/m²)
    unit_prices = {
        "인테리어": {"min": 300_000, "max": 600_000, "base": 450_000},
        "신축": {"min": 1_200_000, "max": 2_000_000, "base": 1_600_000},
        "리모델링": {"min": 500_000, "max": 900_000, "base": 700_000},
    }
    prices = unit_prices.get(req.type, unit_prices["인테리어"])
    base = prices["base"]
    min_cost = int(req.area * prices["min"])
    max_cost = int(req.area * prices["max"])

    breakdown = {
        "철거/해체": int(req.area * base * 0.10),
        "바닥공사": int(req.area * base * 0.20),
        "벽체/도장": int(req.area * base * 0.20),
        "전기/조명": int(req.area * base * 0.15),
        "설비/배관": int(req.area * base * 0.15),
        "마감/기타": int(req.area * base * 0.20),
    }

    # Claude로 요약 생성
    try:
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": (
                    f"공사 유형: {req.type}, 면적: {req.area}m², 설명: {req.description}\n"
                    f"예상 견적 범위: {min_cost:,}원 ~ {max_cost:,}원\n"
                    "위 내용을 바탕으로 2~3문장으로 견적 요약을 작성해주세요."
                )
            }]
        )
        summary = msg.content[0].text
    except Exception:
        summary = f"{req.area}m² {req.type} 공사 예상 비용은 {min_cost:,}원 ~ {max_cost:,}원입니다."

    return EstimateResponse(
        type=req.type,
        area=req.area,
        min_cost=min_cost,
        max_cost=max_cost,
        unit_price=base,
        breakdown=breakdown,
        summary=summary,
    )
