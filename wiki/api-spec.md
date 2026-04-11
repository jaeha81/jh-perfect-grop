# API 명세

> 최종 업데이트: 2026-04-11

## Base URL

- 로컬: `http://localhost:8000`
- 프론트엔드 프록시: `next.config.js` rewrites → `/api/*` → `http://localhost:8000/api/*`

## 엔드포인트

### GET /

```json
{
  "status": "ok",
  "service": "JH EstimateAI API",
  "version": "0.2.0",
  "agents": ["SCANNER", "ESTIMATOR", "PRICER", "VALIDATOR", "REPORTER"]
}
```

### GET /api/health

```json
{ "status": "healthy", "api_key_set": true }
```

### POST /api/estimate

**Request**

```json
{
  "type": "인테리어",
  "area": 84.5,
  "description": "아파트 전체 인테리어, 주방·욕실 포함",
  "image_base64": "(선택) base64 인코딩 이미지"
}
```

**Response**

```json
{
  "type": "인테리어",
  "area": 84.5,
  "min_cost": 28000000,
  "max_cost": 40000000,
  "unit_price": 380000,
  "breakdown": {
    "철거/해체": 3200000,
    "바닥": 8500000,
    "벽체/도장": 6200000,
    "전기": 1800000,
    "설비/배관": 3500000,
    "주방": 2200000
  },
  "work_items": [
    {
      "category": "바닥",
      "item": "강마루",
      "quantity": 78.0,
      "unit": "m²",
      "unit_price": 45000,
      "total_price": 3510000
    }
  ],
  "summary": "AI 생성 요약 텍스트",
  "validator_flags": [
    {
      "severity": "warning",
      "category": "전기",
      "message": "전기 공사 비중이 낮습니다",
      "suggestion": "전기 항목 누락 여부 확인"
    }
  ],
  "expert_comment": "18년 현장 경험 기반 총평",
  "scanner_context": "(이미지 첨부 시) 공간 분석 결과",
  "pdf_base64": "(성공 시) base64 인코딩 PDF"
}
```

## 파이프라인 흐름

```
POST /api/estimate
 → SCANNER (image_base64 있을 때)
 → ESTIMATOR (Claude Haiku, tool_use)
 → PRICER (JSON DB 조회)
 → VALIDATOR (Claude Sonnet)
 → REPORTER (fpdf2 PDF)
 → 응답 반환
```

## 관련 페이지

- [architecture.md](architecture.md)
- [validator-rules.md](validator-rules.md)
