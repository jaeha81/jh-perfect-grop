# Research v2: JH EstimateAI — 실무형 인테리어 견적 시스템 고도화

> 최종 업데이트: 2026-04-23 (대회 마감 D-1)
> v1 완료: 5 에이전트 파이프라인 (SCANNER·ESTIMATOR·PRICER·VALIDATOR·REPORTER)
> v2 목표: 단순 견적 폼 → 실무형 다단계 입력 + 설명형 결과 리포트

---

## 0. CPS (Context-Problem-Solution)

### Context
- **배포 상태**: Vercel(FE) + Railway(BE) 운용 중, 최종 polish 커밋(`f1d425d`)까지 완료
- **백엔드**: FastAPI 5 에이전트 파이프라인 안정, `/api/estimate` `/api/estimate/stream` `/api/estimate/compare` `/api/estimate/recalculate` 4 엔드포인트
- **프론트엔드**: `frontend/app/page.js` 단일 파일 765줄 — 단순 입력 3필드(유형/면적/설명) + 이미지
- **마감**: 2026.04.24 (내일)

### Problem
1. **입력이 빈약하다**: 유형/면적/설명만 받음 — 고객 기본정보·현장 여건·세부 공사범위·별도항목이 모두 없음
2. **공간 분류가 3종뿐**: 인테리어/신축/리모델링 — 상업/주거/오피스/학교/병원/호텔 등 업종 분류 없음
3. **결과 리포트가 얕다**: breakdown bar + summary 2문장 — 포함/별도/제외, 공사일정, 공정계획, 유의사항이 없음
4. **상담 전환 동선 부재**: PDF 다운로드만 있고 상담 요청 CTA/현장방문 예약 등 실무형 전환점 없음
5. **단일 파일 구조**: `page.js` 765줄 monolith — 다단계 폼·조건부 로직을 추가하면 유지보수 불가능
6. **확장성 제약**: 관리자 대시보드·DB 저장·PDF 템플릿 교체 등 후속 작업이 어려운 구조

### Solution
- **백엔드는 호환 유지** — 기존 `/api/estimate*` 엔드포인트에 확장 필드(`extra_context`)만 optional 추가
- **프론트 전면 재설계**
  - 9화면 다단계 플로우 (랜딩→고객정보→공간→현장여건→공사범위→마감/별도항목→일정/업로드→분석→결과)
  - 조건부 질문 로직 (상업공간+음식점 → 주방설비/덕트/가스 질문 동적 노출)
  - 상태관리: React 단일 useReducer + localStorage 중간저장
  - 컴포넌트 분리: `components/estimate/` + `lib/estimate-engine.js` + `types/estimate.js`
- **견적 보정 로직은 프론트에 구현**
  - 기존 백엔드 base price 결과를 받아 공간유형 보정·현장난이도 보정·별도항목 분리 적용
  - "입력 기반 자동 분석 + 현장 확인 후 최종 확정" 원칙 — 확정 견적 표현 절대 금지
- **결과 리포트 9 섹션 재설계**: 상단요약·비교견적·공종별 세부·포함/별도/제외·일정·공정계획·AI의견·유의사항·CTA

---

## 1. 현재 코드베이스 상세 분석

### 파일 구조 (2026-04-23 기준)
```
jh-perfect-grop/
├── backend/
│   ├── main.py                  391줄 — FastAPI 엔트리, 4 엔드포인트
│   ├── agents/
│   │   ├── scanner.py            55줄 — Claude Vision
│   │   ├── estimator.py         185줄 — Haiku + 키워드 추출
│   │   ├── pricer.py             91줄 — JSON 단가 DB 조회 (tier 지원)
│   │   ├── validator.py         582줄 — 18년 현장 룰셋 (R01~R32)
│   │   └── reporter.py          349줄 — fpdf2 PDF + openpyxl Excel
│   ├── data/
│   │   ├── unit_prices.json          — 공종별 tier(budget/standard/premium) 단가
│   │   ├── keyword_dict.json         — 공종 키워드 매핑
│   │   └── fonts/NanumGothic.ttf     — PDF 한글 폰트
│   └── db/supabase_prices.py         — Supabase 연동 (선택적)
├── frontend/
│   ├── app/
│   │   ├── page.js              765줄 — 단일 페이지 monolith
│   │   ├── layout.js
│   │   ├── globals.css
│   │   ├── manifest.json
│   │   └── api/[...path]/route.js    — BE 프록시 (CORS 해결)
│   ├── package.json              — next 14.2.3, react 18, tailwind 3 (TS 없음)
│   └── tailwind.config.js
└── vercel.json / Dockerfile / Procfile / nixpacks.toml (배포)
```

### 백엔드 호환성 분석
**`EstimateRequest` 모델 (main.py:53)**
```python
class EstimateRequest(BaseModel):
    description: str
    area: float = Field(gt=0)
    type: Literal["인테리어", "신축", "리모델링"]
    image_base64: Optional[str] = None
```
- **`description`은 free text** → 프론트에서 구조화된 입력(고객정보/현장여건/공사범위)을 조합해 풍부한 문자열로 전달하면 기존 파이프라인이 그대로 활용됨
- **`type`은 Literal 3종** → 확장 필요 없음. 공간유형(상업/주거/오피스/...)은 description에 포함시키거나 별도 optional 필드 추가

**기존 응답 스키마 유지 필요**
- `min_cost/max_cost/unit_price/breakdown/work_items/summary/validator_flags/expert_comment/is_valid/pdf_base64/excel_base64`
- 이 필드들을 v2 리포트 화면에서 그대로 소비 가능

### 프론트엔드 monolith 분석
`page.js` 상태 변수 14개, 함수 8개, JSX 500줄 — v2 요구사항 추가 시 1500줄 이상 예상. **반드시 분리 필요.**

---

## 2. v2 요구사항 매핑

### 입력 스키마 (총 필드 ~60개)
| 그룹 | 필드 수 | 핵심 특징 |
|------|---------|-----------|
| 고객 기본정보 | 10 | 이름·연락처·이메일·주소·상담목적·예산·일정·연락선호·우선기준 |
| 공간 기본정보 | 10 | 공간유형(9종)·세부용도·면적·층수·천장높이·건물상태·운영상태·마감상태·방문여부 |
| 현장 여건 | 12 | 지역·엘베·반입난이도·야간주말·운영중·소음제한·폐기물·민원 |
| 공사 범위 | 25 | 철거~외부공사 체크박스 + 조건부 서브질문 |
| 마감/별도 | 10 | 전체등급·부위별등급·우선기준·별도항목(16종) |
| 일정/업로드 | 7 | 착공/완료/오픈일·공사시간대·사진/도면 업로드 |

### 결과 리포트 (9 섹션)
1. 상단 요약 — 고객명·주소·공간유형·면적·일정·우선기준
2. 비교 견적 카드 3종 + 추천안 배지
3. 공종별 세부견적서 (공종명·금액·설명)
4. 포함/별도/제외 항목 3분할
5. 공사 일정 (총 기간·착공·완료·리스크)
6. 공정 계획 (현장준비→철거→설비→목공→벽바닥→조명가구→정리→인도)
7. AI 분석 의견 (실무형 짧은 코멘트 3~5줄)
8. 유의사항 (입력기반·실측조정·변동가능·설비배선 현장확인)
9. 하단 CTA (상담요청·PDF저장·재계산·방문예약)

### 조건부 로직 예시
- `spaceType=상업공간 & subtype=음식점` → 주방설비/배기덕트/가스/위생배수 질문 노출
- `spaceType=주거공간` → 전체리모델링 여부/욕실수/주방교체/샷시교체
- `spaceType=오피스` → 회의실수/유리파티션/네트워크
- `selectedScopes.includes(전기)` → 기존유지/일부증설/전면증설
- `selectedScopes.includes(냉난방)` → 기존유지/이설/신규설치
- `selectedScopes.includes(철거)` → 전체/부분/천장/바닥/폐기물반출

### 견적 보정 로직 (프론트 내부)
```
기본 단가 베이스 (백엔드 PRICER 결과)
  × 공간유형 계수 (주거 1.0, 상업 1.15, 오피스 1.1, 병원/학교 1.3, 호텔 1.25 ...)
  × 현장난이도 계수 (엘베없음 +5%, 운영중 +10%, 야간작업 +15%, 소음제한 +7%)
  × 마감등급 계수 (저가 0.75, 표준 1.0, 고급 1.35, 맞춤형 1.5)
  + 별도항목 분리 (전기증설·냉난방신규·외부공사·간판·소방 등은 금액 분리 표기)
  ± 일정 압축 리스크 (착공~완료 일수 < 권장일수 × 0.8 → 리스크 표기)
```
**주의**: "실시간 시장단가 반영" 표현 절대 금지. "기본 단가 기반 자동 산출" 톤 유지.

---

## 3. 기술 결정 & 트레이드오프

| 항목 | 결정 | 근거 |
|------|------|------|
| 언어 | JS 유지 (TS 전환 X) | 기존 `page.js` JS, 마감 D-1 — TS 전환은 리스크 |
| 폴더 | `components/estimate/`, `lib/`, `data/` 신설 | monolith 분해 |
| 라우팅 | 단일 페이지 + 내부 step state | Next.js App Router 라우팅 분리하면 상태 공유 복잡 |
| 상태관리 | `useReducer` + localStorage 자동저장 | 60필드 관리, 새로고침 복구 |
| 검증 | 자체 validator 함수 (zod/yup 미도입) | 의존성 최소화, 기존 JS 스타일 유지 |
| 조건부 질문 | 선언형 config(JSON) 기반 렌더 | 현장 확장 용이 |
| 백엔드 수정 | **최소 변경 원칙** | 대회 마감 직전, 배포 파이프 흔들지 않음 |
| 스타일 | 기존 Tailwind + 인라인 스타일 혼용 유지 | v1 톤앤매너 보존 |

---

## 4. 리스크 분석

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 마감 D-1 — 구현 시간 부족 | 높음 | 우선순위 Phase A(필수) → B(가능하면) → C(여유시) 단계화 |
| monolith 분리 중 기존 기능 깨짐 | 중간 | v1 페이지를 `page_v1.js.bak`로 백업 후 신규 `page.js` 작성 |
| 백엔드 스키마 호환 깨짐 | 높음 | `EstimateRequest` 수정 없이 description에 구조화 텍스트 주입 |
| Vercel 빌드 실패 | 중간 | 로컬 빌드 확인 후 push, `.next/` gitignore 확인 |
| 모바일 UX 단계 이동 시 스크롤 | 낮음 | 스텝 변경 시 `window.scrollTo(0,0)` |
| 입력 60필드 이탈률 | 중간 | 필수/선택 분리 + "나중에 현장 확인" 옵션 허용 |

---

## 5. v1 대비 차별점 요약

| 항목 | v1 (현재) | v2 (목표) |
|------|-----------|-----------|
| 입력 필드 | 3개 (유형/면적/설명) | 60개 그룹 (7단계) |
| 공간 유형 | 3종 | 9종 + 세부용도 |
| 조건부 질문 | 없음 | 있음 (공간유형·공사범위 기반) |
| 결과 섹션 | 3개 (breakdown/summary/flags) | 9개 섹션 |
| 포함/별도/제외 | 없음 | 명확 3분할 |
| 공사 일정 | 없음 | 총기간/착공/완료/리스크 |
| 공정 계획 | 없음 | 8단계 프로세스 |
| 상담 CTA | PDF 다운로드뿐 | 상담요청/방문예약/재계산/PDF |
| 중간 저장 | 없음 | localStorage 자동저장 + 복구 |
| 컴포넌트 | 단일 파일 765줄 | 15+ 컴포넌트 분리 |

---

## 결론

### 핵심 판단
1. **백엔드 무변경 유지** — 리스크 최소화, 배포 파이프 보호
2. **프론트 전면 재설계** — 9화면 다단계 플로우 + 15+ 컴포넌트 분해
3. **견적 보정 로직은 프론트 내부** — 기존 PRICER 결과 × 공간/난이도/등급 계수
4. **Phase 단계화** — A(필수) · B(가능하면) · C(여유시)로 마감 리스크 흡수

### 판정
→ `plan.md`에서 파일별 구현 계획 확정 후 "구현해" 승인 요청
