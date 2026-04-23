# API 명세

> 최종 업데이트: 2026-04-23 (v2)

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

**Request** (v2 필드 추가 — 모두 optional)

```json
{
  "type": "인테리어",
  "area": 84.5,
  "description": "아파트 전체 인테리어, 주방·욕실 포함",
  "image_base64": "(선택) base64 인코딩 이미지",
  "customer_name": "홍길동",
  "customer_phone": "010-1234-5678",
  "address": "서울 강남구 ...",
  "inquiry_id": "INQ-260423-001",
  "form_snapshot": { "... 전체 폼 덤프 (관리자 확장 예비)" }
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

### POST /api/estimate/stream

SSE(Server-Sent Events) 실시간 스트리밍. 에이전트 단계별 진행 상황을 실시간 전달.

#### Request

`/api/estimate`와 동일

#### SSE 이벤트 형식

```
data: {"event": "agent_start", "agent": "ESTIMATOR", "step": 1}
data: {"event": "agent_done",  "agent": "ESTIMATOR", "step": 1}
data: {"event": "complete", "data": { ...견적 결과 전체... }}
data: {"event": "error", "message": "오류 메시지"}
```

---

### POST /api/estimate/compare

저가 / 표준 / 고급 3단계 비교 견적. SCANNER+ESTIMATOR는 1회 실행, PRICER만 3회(tier별) 실행.

요청 형식은 `/api/estimate`와 동일.

#### Compare Response

```json
{
  "type": "인테리어",
  "area": 99.17,
  "scanner_context": "(이미지 첨부 시) 공간 분석 결과",
  "compare": {
    "budget":   { "tier": "budget",   "tier_label": "저가", "min_cost": 17600000, "max_cost": 24800000, "unit_price": 200000, "breakdown": {} },
    "standard": { "tier": "standard", "tier_label": "표준", "min_cost": 22000000, "max_cost": 31000000, "unit_price": 250000, "breakdown": {} },
    "premium":  { "tier": "premium",  "tier_label": "고급", "min_cost": 27500000, "max_cost": 38800000, "unit_price": 312000, "breakdown": {} }
  }
}
```

**tier 배율**: budget×0.80 / standard×1.00 / premium×1.25

---

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

---

## v2 엔드포인트 (2026-04-23 추가)

### POST /api/inquiries

상담/방문 접수 — 결과 페이지 "상담 요청하기" / "현장 방문 상담 예약" 버튼에서 호출.

**Request**

```json
{
  "inquiry_id": "INQ-260423-001",
  "kind": "consult",
  "customer_name": "홍길동",
  "customer_phone": "010-1234-5678",
  "email": "guest@example.com",
  "address": "서울 강남구 ...",
  "space_type": "인테리어",
  "area": 99.17,
  "note": "저녁 시간 연락 선호"
}
```

`kind`는 `consult` (상담 요청) 또는 `visit` (방문 예약).

**Response**

```json
{
  "ok": true,
  "inquiry_id": "INQ-260423-001",
  "kind": "consult",
  "received_at": "2026-04-23T21:15:33",
  "message": "상담 요청이 접수되었습니다. 영업일 기준 1일 이내 담당자가 연락드립니다."
}
```

저장: `backend/data/inquiries.jsonl` (append-only). 프로덕션은 Supabase 연동 권장.

---

### GET /api/inquiries

관리자 상담 목록 조회 — 프론트 `/admin` 페이지에서 호출.

**Query**

| 파라미터 | 기본값 | 설명 |
|---------|-------|------|
| `token` | — | `ADMIN_TOKEN` 환경변수와 일치해야 함. 미설정 시 토큰 불필요(개발 환경) |
| `limit` | 50  | 최대 반환 건수 |

**Response**

```json
{
  "ok": true,
  "total": 12,
  "items": [
    {
      "inquiry_id": "INQ-260423-001",
      "kind": "consult",
      "received_at": "2026-04-23T21:15:33",
      "customer_name": "홍길동",
      "customer_phone": "010-1234-5678",
      "email": "...",
      "address": "...",
      "space_type": "인테리어",
      "area": 99.17,
      "note": "저녁 시간 연락 선호",
      "form_snapshot_keys": ["customer", "space", "site", "scopes", "finish", "schedule"]
    }
  ]
}
```

최신순 정렬(`received_at` 내림차순).

**401**: `ADMIN_TOKEN`이 설정되어 있으나 쿼리의 `token`과 불일치 시.

---

### POST /api/report

enriched 데이터로 **풍부한 PDF/Excel 재생성** — 프론트에서 `/api/estimate/stream` 완료 후
3단계 비교·공정계획·AI 코멘트까지 포함해 재호출.

**Request**

```json
{
  "inquiry_id": "INQ-260423-001",
  "customer_name": "홍길동",
  "customer_phone": "010-1234-5678",
  "address": "서울 강남구 ...",
  "type": "인테리어",
  "area": 99.17,
  "min_cost": 30000000,
  "max_cost": 45000000,
  "unit_price": 300000,
  "breakdown": { "철거": 3200000, "바닥": 8500000 },
  "work_items": [ ... ],
  "summary": "AI 요약",
  "validator_flags": [ ... ],
  "expert_comment": "...",
  "tiers": {
    "budget":   { "label": "저가형", "min": 23400000, "max": 35100000, "recommended": false },
    "standard": { "label": "표준형", "min": 30000000, "max": 45000000, "recommended": true },
    "premium":  { "label": "고급형", "min": 41400000, "max": 62100000, "recommended": false }
  },
  "inclusions": {
    "included": ["철거공사", "바닥공사"],
    "separate": ["가전가구"],
    "excluded": ["샷시/창호 교체 (미선택)"]
  },
  "schedule": {
    "recommendedDays": 35,
    "preferredStartDate": "2026-06-01",
    "preferredEndDate":   "2026-07-10",
    "risk": { "level": "normal", "label": "여유 있음", "message": "충분합니다" },
    "phases": [
      { "name": "준비/착공", "days": 3, "tasks": ["현장 인수", "자재 선정"] }
    ]
  },
  "commentary": [
    "표준형 구성이 가장 현실적인 시작안입니다.",
    "사진·도면이 함께 제공되면 현장 추정 정확도가 크게 향상됩니다."
  ]
}
```

**Response**

```json
{
  "ok": true,
  "pdf_base64": "JVBERi0xLjQK...",
  "excel_base64": "UEsDBBQAAAAIA...",
  "pdf_error": null
}
```

기존 `/api/estimate/stream`의 PDF는 raw 기준(breakdown + summary), 이 엔드포인트 PDF는 enriched(3단계·공정계획·코멘트 포함).

---

## 관련 페이지

- [architecture.md](architecture.md)
- [validator-rules.md](validator-rules.md)
- [known-issues.md](known-issues.md)
