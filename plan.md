# Plan: JH EstimateAI — 5 에이전트 파이프라인 구현

> 최종 업데이트: 2026-04-11

---

## 1. 구현 접근 방식

### 전략

- **Wave 단위 점진적 구현** — 대회 마감(04.24) 역산하여 4개 Wave로 분리
- **에이전트 독립성 보장** — 각 에이전트는 독립 모듈, 순차 파이프라인으로 연결
- **Supabase Wave 3에서 연동** — Wave 2는 JSON 단가 DB로 대체하여 속도 확보
- **SCANNER는 Wave 4** — 이미지 분석은 데모 임팩트용, 없어도 4에이전트로 동작

### research.md CPS 반영

| 문제 | Wave | 해결 |
|------|------|------|
| 하드코딩 단가표 | Wave 2 | ESTIMATOR + PRICER 에이전트로 교체 |
| VALIDATOR 부재 | Wave 3 | 18년 현장 룰셋 내재화 |
| PDF 출력 없음 | Wave 3 | REPORTER + ReportLab |
| 이미지 분석 없음 | Wave 4 | SCANNER + Claude Vision |

---

## 2. 수정/추가될 파일 경로

### Wave 2 (ESTIMATOR + PRICER)

| 파일 | 작업 | 설명 |
|------|------|------|
| `backend/agents/estimator.py` | 신규 | 공종별 수량 산출 에이전트 |
| `backend/agents/pricer.py` | 신규 | 단가 조회 + 금액 계산 에이전트 |
| `backend/data/unit_prices.json` | 신규 | 공종별 단가 DB (96개 공종) |
| `backend/models.py` | 신규 | Pydantic 공통 모델 |
| `backend/main.py` | 수정 | 에이전트 연결, 라우터 분리 |
| `frontend/app/api/estimate/route.js` | 신규 | Next.js API Route (CORS 해결) |

### Wave 3 (VALIDATOR + REPORTER)

| 파일 | 작업 | 설명 |
|------|------|------|
| `backend/agents/validator.py` | 신규 | 18년 현장 이상치 탐지 에이전트 |
| `backend/agents/reporter.py` | 신규 | PDF/Excel 생성 에이전트 |
| `backend/api/report.py` | 신규 | `/api/report` 엔드포인트 |
| `frontend/app/page.js` | 수정 | PDF 다운로드 버튼 + 검증 결과 표시 |

### Wave 4 (SCANNER + 통합)

| 파일 | 작업 | 설명 |
|------|------|------|
| `backend/agents/scanner.py` | 신규 | 이미지 → 공간 정보 추출 |
| `frontend/app/page.js` | 수정 | 이미지 업로드 UI |
| `frontend/app/api/report/route.js` | 신규 | PDF 다운로드 프록시 |

---

## 3. Before / After 스니펫

### Before: 하드코딩 단가 (현재 `main.py`)

```python
unit_prices = {
    "인테리어": {"min": 300_000, "max": 600_000, "base": 450_000},
    "신축": {"min": 1_200_000, "max": 2_000_000, "base": 1_600_000},
    "리모델링": {"min": 500_000, "max": 900_000, "base": 700_000},
}
breakdown = {
    "철거/해체": int(req.area * base * 0.10),
    "바닥공사": int(req.area * base * 0.20),
    # ...단순 비율 분배
}
```

### After: ESTIMATOR + PRICER 에이전트

```python
# backend/agents/estimator.py
async def estimate(req: EstimateRequest) -> EstimatorOutput:
    """Claude Haiku로 공종별 수량 산출"""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        system=ESTIMATOR_SYSTEM_PROMPT,  # 96개 공종 + 수량 산출 규칙
        messages=[{"role": "user", "content": f"...{req}..."}]
    )
    return parse_estimator_output(response)

# backend/agents/pricer.py
async def price(items: list[WorkItem]) -> PricerOutput:
    """단가 DB 조회 + 금액 계산"""
    prices = load_unit_prices()  # unit_prices.json
    return calculate_total(items, prices)
```

### Before: Claude가 요약만 생성 (비AI 로직)

```python
# 요약만 AI — 실제 견적은 하드코딩
msg = client.messages.create(model="claude-haiku-...", messages=[...요약 요청...])
```

### After: VALIDATOR가 이상치 감지

```python
# backend/agents/validator.py
VALIDATOR_SYSTEM = """
당신은 인테리어/건설 현장 경력 18년의 견적 검증 전문가입니다.
아래 현장 규칙을 기준으로 견적 이상치를 탐지하세요:
- 인테리어: 30평 기준 2,000만원 이하면 저가 의심
- 욕실 타일 단가: 12만원/m² 이하면 자재 품질 위험
- 전기 공사가 전체의 5% 미만이면 누락 의심
...
"""
```

---

## 4. Wave별 구현 계획

### Wave 2: ESTIMATOR + PRICER (04.11~04.13)

- [ ] `backend/models.py` — Pydantic 공통 모델 정의
- [ ] `backend/data/unit_prices.json` — 공종별 단가 DB 작성 (20개 공종 우선)
- [ ] `backend/agents/estimator.py` — Claude Haiku + 공종 수량 산출
- [ ] `backend/agents/pricer.py` — 단가 DB 조회 + 합산
- [ ] `backend/main.py` — 에이전트 파이프라인 연결
- [ ] `frontend/app/api/estimate/route.js` — Next.js API Route 추가

검증: `/api/estimate` 호출 시 공종별 상세 수량 + 단가 적용 결과 반환

### Wave 3: VALIDATOR + REPORTER (04.14~04.16)

- [ ] `backend/agents/validator.py` — 18년 룰셋 시스템 프롬프트 + 이상치 탐지
- [ ] `backend/agents/reporter.py` — ReportLab PDF 생성
- [ ] `backend/api/report.py` — `/api/report` 엔드포인트
- [ ] `frontend/app/page.js` — 검증 결과 표시 + PDF 다운로드 버튼

검증: 견적 결과에 validator_flags 포함, PDF 다운로드 동작

### Wave 4: SCANNER + 통합 UI (04.17~04.20)

- [ ] `backend/agents/scanner.py` — Claude Vision base64 이미지 분석
- [ ] `frontend/app/page.js` — 이미지 업로드 드래그앤드롭 UI
- [ ] 전체 파이프라인 E2E 테스트

검증: 이미지 업로드 → 공간 분석 → 견적 자동 생성

### Wave 5: 데모 + 발표자료 (04.21~04.23)

- [ ] 데모 시나리오 작성 (30평 아파트 전체 인테리어)
- [ ] README 업데이트
- [ ] 발표자료 핵심 슬라이드 (5장)

---

## 5. 고려 사항 및 트레이드오프

| 항목 | 결정 | 근거 |
|------|------|------|
| ESTIMATOR 모델 | Haiku | 반복 호출 비용 절감, 구조화된 JSON 출력 |
| VALIDATOR 모델 | Sonnet | 18년 룰셋 추론 — Haiku는 정확도 부족 |
| 단가 DB | JSON 파일 (Wave 2) → Supabase (Wave 3) | 속도 우선, 추후 마이그레이션 |
| PDF 라이브러리 | ReportLab | WeasyPrint는 한글 폰트 설정 복잡 |
| CORS 해결 | Next.js API Route | 클라이언트→백엔드 직접 호출 대신 프록시 |

---

## 6. 이밸류에이션 체크리스트

### 설계 검증

- [x] CPS의 Problem을 이 Plan이 실제로 해결하는가? → 하드코딩 단가 → 에이전트, VALIDATOR 부재 → 18년 룰셋 구현
- [x] 도메인 모델 간 관계가 정합적인가? → SCANNER→ESTIMATOR→PRICER→VALIDATOR→REPORTER 순차 파이프라인
- [x] 기존 코드와 충돌하는 부분이 없는가? → main.py 하위호환 유지하며 에이전트 추가
- [x] 중복 로직이 새로 생기지 않는가? → 단가 DB는 pricer.py 단독 관리

### 구현 검증

- [x] 기존 레이어 구조를 따르는가? → agents/ 폴더 분리, main.py는 라우터만
- [x] ORM/마이그레이션 규칙이 반영되었는가? → Wave 2는 JSON, Wave 3에서 Supabase 마이그레이션
- [x] 타입 안전성이 확보되었는가? → Pydantic 모델로 에이전트 I/O 명시
- [x] 에러 핸들링 전략이 명시되었는가? → 각 에이전트 실패 시 이전 단계 결과로 fallback

### 유지보수 검증

- [x] 다른 개발자가 이 Plan만 보고 구현할 수 있는가? → Wave별 파일 경로 + Before/After 명시
- [x] 파일명/네이밍이 프로젝트 컨벤션과 일치하는가? → snake_case Python, camelCase JS
- [x] 테스트 전략이 포함되었는가? → 각 Wave 검증 조건 명시

### 판정

✅ **전체 통과 → "구현해" 승인 가능**

---

계획이 완료되었습니다. 검토 후 메모를 남겨주시거나 구현 승인을 해주세요.
아직 코드를 수정하지는 않았습니다.
