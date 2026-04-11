# Research: JH EstimateAI — 5 에이전트 파이프라인 구축

> 최종 업데이트: 2026-04-11

---

## 0. CPS (Context-Problem-Solution)

### Context (맥락)
- **목적**: 2026 전국민 AI 챔피언 대회 출품 (마감: 04.24)
- **도메인**: 인테리어/건설 견적 자동화 — 개발자 18년 현장 경력 기반
- **현재 상태**: 기본 MVP 존재 (커밋 1개) — 단순 단가표 + Claude Haiku 요약
- **경쟁 차별화**: 범용 AI가 아닌 "현장의 AI" — 18년 현장 지식을 VALIDATOR에 내재화
- **기술 스택**: FastAPI(Python) + Next.js 14 + Claude API + Supabase

### Problem (문제)
1. **ESTIMATOR가 없다**: 현재는 `area × 단가` 단순 곱셈 — 실제 수량 산출 로직 없음
2. **PRICER가 하드코딩**: 인테리어 300K~600K/m² 고정값 — 공종별 세부 단가 DB 없음
3. **VALIDATOR가 없다**: 이상치 탐지 없음 — 현장 경력 18년의 핵심 차별화가 미반영
4. **REPORTER가 없다**: 견적 결과를 화면에만 표시 — PDF/Excel 출력 불가
5. **SCANNER가 없다**: 이미지 업로드 → 공간 분석 미구현 — 대회 데모 임팩트 약화
6. **research.md / plan.md 오염**: 이전 세션(AI 에이전트 사업성 제안서) 내용으로 덮어씌워짐

### Solution (솔루션 방향)
- **Wave 2** (04.11~04.13): ESTIMATOR + PRICER 에이전트 — 수량 산출 + 공종별 단가 로직
- **Wave 3** (04.14~04.16): VALIDATOR + REPORTER 에이전트 — 이상치 탐지 + PDF 출력
- **Wave 4** (04.17~04.21): SCANNER + 통합 UI + QA — 이미지 분석 + 전체 파이프라인 연동
- **Wave 5** (04.22~04.23): 데모 + 발표자료 마무리

---

## 1. 현재 코드베이스 분석

### 파일 구조
```
jh-perfect-grop/
├── backend/
│   ├── main.py          ← FastAPI 엔트리포인트 (단일 파일 구조)
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.js      ← 메인 UI (단일 페이지)
│   │   ├── layout.js
│   │   └── globals.css
│   ├── next.config.js
│   ├── package.json
│   └── tailwind.config.js
├── start.bat            ← 로컬 실행 스크립트
├── research.md
├── plan.md
└── CLAUDE.md
```

### 현재 백엔드 구조 (`backend/main.py`)

```
단일 엔드포인트: POST /api/estimate
입력: { description, area, type }
로직:
  1. unit_prices 딕셔너리에서 단가 조회 (하드코딩)
  2. area × 단가 = 범위 견적
  3. 6개 공종 비율 분배 (철거10/바닥20/벽체20/전기15/설비15/마감20)
  4. Claude Haiku로 2~3문장 요약 생성
출력: { type, area, min_cost, max_cost, unit_price, breakdown, summary }
```

**문제**: Claude API는 요약 생성에만 사용 — 실제 견적 로직은 AI와 무관한 하드코딩

### 현재 프론트엔드 구조 (`frontend/app/page.js`)
- 인라인 스타일 방식 (Tailwind 미적용 — dark 테마)
- 공사 유형 select + 면적 input + 설명 textarea
- `/api/estimate` POST 호출 후 결과 표시
- Next.js API Route 없음 — 직접 `localhost:8000` 백엔드 호출 구조로 추정

**확인 필요**: next.config.js에 `rewrites` 설정 없으면 CORS 이슈 발생 가능

---

## 2. 5 에이전트 아키텍처 설계

### 에이전트 역할 정의

```
사용자 입력 (텍스트 + 이미지)
    ↓
[Agent 1: SCANNER]    공간 분석 → 구조적 정보 추출
    ↓
[Agent 2: ESTIMATOR]  수량 산출 → 공종별 물량 계산
    ↓
[Agent 3: PRICER]     단가 적용 → 공종별 금액 산출
    ↓
[Agent 4: VALIDATOR]  이상치 탐지 → 18년 현장 기준 검증
    ↓
[Agent 5: REPORTER]   보고서 생성 → PDF/Excel 출력
```

### 에이전트별 기술 결정

| Agent | 구현 방식 | 모델 | 우선순위 |
|-------|-----------|------|---------|
| SCANNER | Claude Vision (base64 이미지) | Sonnet | Wave 4 |
| ESTIMATOR | Claude + 공종 키워드 96개 프롬프트 | Haiku | **Wave 2** |
| PRICER | 단가 DB(JSON) + Claude 조회 | Haiku | **Wave 2** |
| VALIDATOR | Claude + 18년 룰셋 시스템 프롬프트 | Sonnet | **Wave 3** |
| REPORTER | WeasyPrint/ReportLab PDF + openpyxl | — | Wave 3 |

### ESTIMATOR 공종 키워드 (96개 포함 주요 카테고리)

```
철거/해체: 철거, 해체, 폐기, 운반
바닥: 타일, 마루, 강마루, 데코타일, 에폭시, 폴리싱
벽체: 도배, 페인트, 타일, 석고, ALC, 조적
천장: 석고보드, 텍스, 우물천장, 노출천장
창호: 새시, 문, 창문, 방화문, 유리
전기: 콘센트, 스위치, 조명, 분전반, 차단기
설비: 배관, 위생도기, 욕조, 샤워부스, 세면대
주방: 싱크대, 아일랜드, 후드, 수전
냉난방: 에어컨, 보일러, 난방, 환기
기타: 인테리어, 붙박이장, 몰딩, 걸레받이
```

---

## 3. 데이터베이스 설계 (Supabase)

### 테이블 구조

```sql
-- 공종 단가 테이블
unit_prices (
  id, category, subcategory, unit, min_price, max_price,
  region, updated_at
)

-- 견적 이력 테이블
estimates (
  id, user_id, type, area, description,
  min_cost, max_cost, breakdown_json,
  validator_flags, pdf_url, created_at
)

-- 공종 키워드 매핑
work_types (
  id, keyword, category, unit_type
)
```

**Wave 2 범위**: Supabase 연동 없이 JSON 파일로 단가 DB 구성 → Wave 3에서 Supabase 연동

---

## 4. 백엔드 리팩토링 방향

### 현재 → 목표 구조

```
현재:
backend/main.py (단일 파일)

목표:
backend/
├── main.py              ← FastAPI 앱 + 라우터 등록
├── agents/
│   ├── estimator.py     ← Agent 2
│   ├── pricer.py        ← Agent 3
│   ├── validator.py     ← Agent 4
│   ├── reporter.py      ← Agent 5
│   └── scanner.py       ← Agent 1 (Wave 4)
├── data/
│   └── unit_prices.json ← 공종별 단가 DB
├── models.py            ← Pydantic 모델
└── requirements.txt
```

---

## 5. 프론트엔드 개선 방향

### Next.js API Route 추가
```
frontend/app/api/estimate/route.js  ← 백엔드 프록시 (CORS 해결)
```

### UI 개선 포인트
- 이미지 업로드 영역 추가 (Wave 4 SCANNER용)
- 에이전트 진행 상황 실시간 표시 (streaming)
- 견적 결과 → PDF 다운로드 버튼 (Wave 3)
- 공종별 breakdown 차트 (선택)

---

## 결론

### 핵심 판단
- **Wave 2 최우선**: ESTIMATOR + PRICER — 현재 MVP의 핵심 결함(하드코딩) 해결
- **Wave 3 차별화**: VALIDATOR — 18년 현장 지식 내재화 → 대회 심사 포인트
- **Wave 4 임팩트**: SCANNER — 이미지 → 견적 자동화 → 데모 WOW 포인트
- **Supabase**: Wave 3부터 연동 (Wave 2는 JSON 파일로 대체)

### 리스크
| 리스크 | 대응 |
|--------|------|
| SCANNER 이미지 분석 품질 | Sonnet Vision 사용 + 프롬프트 최적화 |
| PDF 생성 라이브러리 의존성 | WeasyPrint 우선, 실패 시 reportlab fallback |
| Supabase 연동 지연 | Wave 2는 JSON 파일로 대체 가능 |
| 대회 마감(04.24) 압박 | SCANNER 없이도 4 에이전트로 데모 가능 |
