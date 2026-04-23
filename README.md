# JH EstimateAI — 18년 현장 경험 기반 AI 견적 자동화 시스템

> 2026 전국민 AI 챔피언 대회 출품작  
> **"교수님 AI가 아닌, 현장의 AI"**

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://jh-perfect-grop.vercel.app)
[![Railway](https://img.shields.io/badge/Backend-Railway-blueviolet?logo=railway)](https://jh-perfect-grop-backend.up.railway.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 핵심 차별화 3가지

1. **현장 데이터 내재화** — 18년 시공 현장 경험이 37개 Python 룰로 명시 구현. AI 프롬프트 의존 없음.
2. **멀티에이전트 오케스트레이션** — SCANNER→ESTIMATOR→PRICER→VALIDATOR→REPORTER 5단계 실시간 SSE 스트리밍.
3. **즉시 수익화 구조** — B2C(구독)/B2B(SaaS)/B2G(API) 3채널 동시 대응. 추가 개발 없이 상용 전환 가능.

---

## v2 (2026-04-23) 주요 기능

- **7단계 실무 상담 폼** — 고객정보 → 공간정보 → 현장여건 → 공사범위(25종) → 마감등급 → 일정·업로드. 약 60개 필드
- **9섹션 결과 리포트** — 요약, 3단계 비교견적, 공종별 세부, 포함/별도/제외, 공사일정, 공정계획, AI 코멘트, 주의사항, 액션 버튼
- **공간/현장 보정 엔진** — 공간 9종 × 현장 가산(엘리베이터·야간·운영중) × 등급 배율 = 자동 multiplier
- **입력 중간저장** — localStorage 14일, 창 닫아도 "이어서 작성하기"로 복귀
- **상담 접수 + 관리자 콘솔** — `POST /api/inquiries` → `/admin` 페이지에서 실시간 확인
- **풍부한 PDF/Excel** — 3단계 비교·공정계획·AI 코멘트까지 포함된 다운로드 (`POST /api/report`)

---

## 왜 이 프로젝트인가

기존 AI 견적 도구의 공통 문제:

- 텍스트를 받아 단순 비율로 분배 (엑셀 수식 수준)
- "욕실 공사"라고 하면 방수 항목을 빠뜨린다
- 150만원짜리 욕실 견적을 그냥 통과시킨다
- 인건비를 빼고 자재비만 계산한다

**이 시스템은 다르다.**  
18년간 현장에서 직접 수집한 이상치 탐지 룰셋이 Python 코드로 명시 구현되어 있다.  
AI에게 "전문가처럼 행동해라"고 시키는 게 아니라, **현장 경험이 코드 자체에 내재되어 있다.**

---

## 5 에이전트 파이프라인

```text
사용자 입력 (텍스트 / 사진)
        │
        ▼
┌─────────────────┐
│  Agent 1        │  공간 사진 → 면적·구조·마감재 자동 분석
│  SCANNER        │  Claude Vision 기반
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent 2        │  공종별 수량 산출 (96개 공종 + 현장 용어 151개)
│  ESTIMATOR      │  Claude Haiku + keyword_dict
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent 3        │  현장 단가 DB 조회 + min/max 범위 산출
│  PRICER         │  unit_prices.json (96개 공종, 실측 기반)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent 4        │  ★ 핵심 차별화 ★
│  VALIDATOR      │  Python 룰 엔진 (18년 현장 기준 37개 룰)
└────────┬────────┘  + 누락 공종 자동 탐지
         │           Claude는 총평만 담당
         ▼
┌─────────────────┐
│  Agent 5        │  PDF + Excel 견적서 자동 생성
│  REPORTER       │  fpdf2 + openpyxl
└─────────────────┘
```

---

## VALIDATOR — 현장 경험 37개 룰

일반 AI는 Claude에게 "18년 전문가처럼 검증해라"고 시킨다.  
이 시스템은 **37개 현장 룰이 Python 코드로 명시 구현**되어 있다.

```python
# 실제 코드 예시 — AI 프롬프트가 아닌 Python 룰
if type_ in ("인테리어", "리모델링"):
    if unit_m2 < 150_000:
        flags.append({"severity": "error", "category": "단가",
                      "message": f"m²당 {unit_m2:,}원은 인건비 미포함 수준"})

# 누락 공종 탐지 — 현장 18년 경험 기반
if type_ == "리모델링" and not has_category(breakdown, "철거"):
    flags.append({"severity": "error", "category": "누락",
                  "message": "리모델링에 철거 항목 없음 — 현장 불가"})
```

**37개 룰 카테고리:**

| 카테고리     | 룰 수 | 예시                        |
| ------------ | ----- | --------------------------- |
| 단가 이상치  | 8개   | m²당 하한/상한 기준         |
| 누락 공종 탐지 | 12개 | 철거·방수·전기·설비 필수 체크 |
| 비율 이상치  | 7개   | 전기 3% 미만, 설비 5% 미만  |
| 욕실 기준    | 5개   | 방수 누락, 위생도기 최소 단가 |
| 주방 기준    | 3개   | 후드·싱크대 세트 검증       |
| 신축 기준    | 2개   | 골조·단열 비율              |

---

## 현장 용어 사전 — 151개 키워드

실제 현장에서 쓰는 은어가 ESTIMATOR에 내재화되어 있다.

| 현장 은어          | 분류 공종   |
| ------------------ | ----------- |
| LGS, T-BAR         | 경량철골    |
| FCU, AHU           | 기계설비    |
| 에폭시바닥, 우레탄방수 | 바닥/방수 |
| 실크도배, 합지도배 | 벽체/도장   |
| 폴딩도어, 시스템창호 | 창호       |

---

## 단가 DB — 96개 공종, 현장 실측 기준

```text
철거/해체 7개 | 바닥 11개 | 벽체/도장 11개 | 천장 6개
창호 8개 | 전기 7개 | 설비 8개 | 욕실 5개
주방 5개 | 도장 4개 | 기타 24개
```

---

## 기술 스택

| 레이어   | 기술                                                    |
| -------- | ------------------------------------------------------- |
| Frontend | Next.js 14, JavaScript, Tailwind CSS                    |
| Backend  | FastAPI (Python 3.11)                                   |
| AI       | Claude Sonnet 4.6 (VALIDATOR 총평), Claude Haiku 4.5 (ESTIMATOR) |
| DB       | unit_prices.json → Supabase (예정)                      |
| 출력     | fpdf2 (PDF), openpyxl (Excel)                           |

---

## 로컬 실행

```bash
# 1. 환경변수
echo "ANTHROPIC_API_KEY=your_key" > backend/.env
echo "ADMIN_TOKEN=your_admin_token" >> backend/.env   # /admin 접근 토큰 (선택)

# 2. 백엔드 실행
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# 3. 프론트엔드 실행
cd frontend
npm install && npm run dev

# 4. 브라우저
open http://localhost:3000          # 사용자: 7단계 견적
open http://localhost:3000/admin    # 관리자: 상담 접수 목록
```

Windows는 `start.bat` 더블클릭으로 한 번에 실행.

### 주요 엔드포인트 (v2)

- `POST /api/estimate/stream` — 5 에이전트 SSE 파이프라인
- `POST /api/report` — enriched 데이터로 풍부한 PDF/Excel 재생성
- `POST /api/inquiries` — 상담/방문 접수
- `GET /api/inquiries?token=...&limit=50` — 관리자 목록 조회 (ADMIN_TOKEN)

자세한 명세: [wiki/api-spec.md](wiki/api-spec.md)

---

## 데모 시나리오

**30평 아파트 전체 인테리어:**

- 입력: "아파트 전체 인테리어, 주방 풀셋 교체, 욕실 2개 타일+양변기+세면대, 강마루+실크도배"
- 출력: 공종별 12개 항목 + 단가 범위 + VALIDATOR 검증 + PDF/Excel

**VALIDATOR 탐지 예시:**

- ⚠️ 방수 항목 누락 → "욕실 공사 시 방수 처리 필수"
- ⚠️ 전기 비중 2% → "전기 공사 누락 의심"
- ✅ 전체 단가 정상 범위

---

## 개발자

**jaeha81 (이재하)**  
인테리어/건설 현장 경력 18년 (시공관리·견적·설계)  
AI 풀스택 빌더 (FastAPI + Next.js + Claude API)

> "18년간 엑셀로 하던 견적을 AI가 대체하되, 현장 경험은 코드로 내재화한다."

---

## 라이선스

MIT
