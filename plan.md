# Plan: 다중 첨부파일 지원 + 오른쪽 미리보기 패널

> 작성일: 2026-04-24  
> 상태: ✅ 구현 완료 (커밋 82703b7)

---

## 목표

현재 사진 1장만 SCANNER에 전달되는 구조를 개선하여,  
현장사진·PDF도면·스케치 등 다양한 첨부파일을 AI가 인지하고  
Step 6 우측 패널에 실시간 미리보기를 제공한다.

---

## 현황 분석

| 항목 | 현재 |
|------|------|
| `uploads.photos[]` | 저장은 되지만 첫 장만 backend 전송 |
| `uploads.drawings[]` | 저장은 되지만 **backend에 전혀 안 감** |
| `sketches` 카테고리 | 없음 |
| SCANNER 입력 | `image_base64: Optional[str]` — 단일 이미지 |
| 레이아웃 | 단일 컬럼, 오른쪽 패널 없음 |

---

## 변경 범위 (중간 규모)

### Wave A — State & Validation

**`frontend/lib/estimate-state.js`**
- `uploads` 구조에 `sketches: []` 추가
- `ADD_UPLOAD` / `REMOVE_UPLOAD` reducer: `kind = 'photos' | 'drawings' | 'sketches'`

**`frontend/lib/estimate-validators.js`**
- PDF 허용: `application/pdf`, 최대 20MB
- 스케치 허용: `image/*`, 최대 10MB

---

### Wave B — 업로드 UI (StepScheduleUpload.jsx)

기존 사진+도면 2존 → **3존으로 분리**:

| 존 | 허용 형식 | 아이콘 | 힌트 |
|----|---------|--------|------|
| 현장사진 | JPG/PNG/WEBP | 📷 | 현재 상태 파악에 활용 |
| 도면/PDF | PDF/JPG/PNG | 📐 | 평면도·배치도·설계도 |
| 스케치 | JPG/PNG | ✏️ | 손그림·메모·레이아웃 |

각 존: 드래그앤드롭 + 클릭 업로드 + 다중 파일 지원

---

### Wave C — 오른쪽 미리보기 패널

**Step 6 레이아웃**: 좌우 분할 (`lg:grid-cols-[1fr_300px]`)

```
┌─────────────────────────┬──────────────────┐
│  업로드 폼 (좌)          │  미리보기 (우)    │
│  - 일정 입력             │  📷 현장사진 (3)  │
│  - 현장사진 업로드존      │  [썸네일 그리드]  │
│  - 도면 업로드존          │  📐 도면 (1)     │
│  - 스케치 업로드존        │  [PDF 아이콘]    │
│                          │  ✏️ 스케치 (2)   │
│                          │  [썸네일 그리드]  │
│                          │                  │
│                          │  총 6개 파일     │
│                          │  AI 분석 예정    │
└─────────────────────────┴──────────────────┘
```

**미리보기 패널 스펙:**
- sticky top (폼 스크롤 중에도 고정)
- 이미지: 썸네일 (80×80, object-cover)
- PDF: 📄 아이콘 + 파일명
- 각 파일: 타입 배지 + 제거(✕) 버튼
- 모바일: 패널 숨김 (업로드존 하단 작은 썸네일로 대체)

---

### Wave D — Backend 다중 이미지 지원

**`backend/main.py` — EstimateRequest 모델**
```python
image_base64: Optional[str] = None       # 기존 (하위호환)
images_base64: List[str] = []            # 현장사진 (여러 장)
drawings_base64: List[str] = []          # 도면 이미지
sketches_base64: List[str] = []          # 스케치
```

**`backend/agents/scanner.py` — 다중 이미지 처리**
- Claude Vision content 블록에 이미지 순서대로 추가
- 시스템 프롬프트에 이미지 역할 레이블 주입:
  - "이미지 1-N: 현장사진입니다"
  - "이미지 N+1: 도면(평면도)입니다"
  - "이미지 M+1: 손그림 스케치입니다"
- 최대 전송: 현장사진 4장 + 도면 2장 + 스케치 2장 = **8장 상한**

**`frontend/app/page.js` — 전송 매핑**
- 기존 첫 장만 전송 → 전체 배열 전송으로 변경
- PDF 파일은 클라이언트 변환 불가 → 파일명을 description 텍스트에 포함

---

## 파일 변경 목록

| 파일 | 변경 내용 |
|------|---------|
| `frontend/lib/estimate-state.js` | `sketches: []` 추가, reducer 업데이트 |
| `frontend/lib/estimate-validators.js` | PDF/스케치 허용 규칙 추가 |
| `frontend/components/estimate/StepScheduleUpload.jsx` | 3존 + 우측 미리보기 패널 |
| `frontend/app/page.js` | 다중 파일 전송 매핑 변경 |
| `backend/main.py` | EstimateRequest 모델 확장, scanner 호출 변경 |
| `backend/agents/scanner.py` | 다중 이미지 + 레이블 프롬프트 |

---

## 미구현 범위 (이번 플랜 제외)

- PDF → 이미지 서버사이드 변환 (pdf2image) — 별도 플랜
- 동영상 / 음성 입력

---

## ⚠️ 이전 Plan v2 내용은 하단에 보존됨

---

# Plan v2: JH EstimateAI — 실무형 견적 시스템 고도화

> 최종 업데이트: 2026-04-23 (대회 마감 D-1)
> 선행: research.md v2

---

## 1. 구현 접근 방식

### 원칙
- **백엔드 무변경** — `/api/estimate*` 4 엔드포인트 그대로 사용
- **v1 UI 백업** — `frontend/app/page.js` → `page_v1.js.bak` (롤백 가능)
- **Phase 단계화** — A(필수) → B(가능하면) → C(여유시)
- **모바일 우선 반응형** — Tailwind `sm:` `md:` 기준
- **상태관리 단일화** — `useReducer` + localStorage 자동저장

### research.md Problem 해결 매핑
| Problem | 해결 위치 |
|---------|-----------|
| P1 입력 빈약 | Phase A — 7단계 다단계 폼 |
| P2 공간분류 3종뿐 | Phase A — 9종 공간유형 + 세부용도 |
| P3 결과 리포트 얕음 | Phase A — 9섹션 리포트 |
| P4 상담 전환 부재 | Phase A — 하단 CTA 4종 |
| P5 monolith | Phase A — components/ 분리 |
| P6 확장성 제약 | Phase B — data model + localStorage 중간저장 |

---

## 2. 파일 구조 (수정/추가)

### Phase A (필수 구현)

```
frontend/
├── app/
│   ├── page.js                            ← 대폭 수정: 랜딩 + 단계 스위치
│   ├── page_v1.js.bak                     ← 신규: v1 백업
│   └── globals.css                        ← 수정: 폼 입력 전용 유틸 클래스 추가
├── components/
│   └── estimate/
│       ├── StepHeader.jsx                 ← 신규: 단계 진행 바
│       ├── StepLanding.jsx                ← 신규: 화면1 랜딩/소개
│       ├── StepCustomerInfo.jsx           ← 신규: 화면2 고객정보
│       ├── StepSpaceInfo.jsx              ← 신규: 화면3 공간 유형/기본정보
│       ├── StepSiteConditions.jsx         ← 신규: 화면4 현장 여건
│       ├── StepScopes.jsx                 ← 신규: 화면5 공사 범위 + 조건부
│       ├── StepFinishOptions.jsx          ← 신규: 화면6 마감/별도항목
│       ├── StepScheduleUpload.jsx         ← 신규: 화면7 일정/업로드
│       ├── AnalysisLoading.jsx            ← 신규: 화면8 분석 로딩 (SSE 진행바)
│       ├── ResultSummary.jsx              ← 신규: 결과 - 상단 요약
│       ├── ResultComparisonCards.jsx      ← 신규: 결과 - 저/표/고 비교
│       ├── ResultDetailEstimate.jsx       ← 신규: 결과 - 공종별 세부
│       ├── ResultInclusions.jsx           ← 신규: 결과 - 포함/별도/제외
│       ├── ResultSchedule.jsx             ← 신규: 결과 - 일정
│       ├── ResultProcessPlan.jsx          ← 신규: 결과 - 공정계획
│       ├── ResultCommentary.jsx           ← 신규: 결과 - AI 의견
│       ├── ResultDisclaimers.jsx          ← 신규: 결과 - 유의사항
│       └── ResultActions.jsx              ← 신규: 결과 - CTA 버튼
├── lib/
│   ├── estimate-engine.js                 ← 신규: 보정 계산 (공간/난이도/등급)
│   ├── estimate-schedule.js               ← 신규: 일정/공정 추정
│   ├── estimate-validators.js             ← 신규: 필드 검증 (전화/이메일/면적)
│   ├── estimate-formatters.js             ← 신규: 금액/기간 포맷
│   └── estimate-description.js            ← 신규: 폼 데이터 → BE description 문자열 조합
└── data/
    ├── estimate-options.js                ← 신규: 공간유형/공사범위/별도항목 옵션
    ├── estimate-conditional.js            ← 신규: 조건부 질문 선언형 config
    ├── estimate-process-plan.js           ← 신규: 공정 단계 템플릿
    └── estimate-multipliers.js            ← 신규: 보정 계수 테이블
```

### Phase B (여유시)
```
frontend/
├── lib/
│   ├── estimate-storage.js                ← 신규: localStorage 중간저장/복구
│   └── estimate-types.js                  ← 신규: JSDoc 타입 (TS 대용)
└── components/estimate/
    └── ResumeBanner.jsx                    ← 신규: "이어서 작성하기" 배너
```

### Phase C (선택)
- `components/estimate/FileUploadZone.jsx` — 사진·도면 드래그앤드롭 전용
- `components/estimate/CTAModal.jsx` — 상담요청 모달
- 백엔드 `EstimateRequest`에 `extra_context` optional 필드 추가 (미래 확장)

---

## 3. 핵심 구현 스니펫

### 3-1. 입력 상태 모델 (`lib/estimate-types.js`)

```js
/**
 * @typedef {Object} EstimateFormState
 * @property {number} step          // 0=랜딩, 1~7=입력, 8=로딩, 9=결과
 * @property {CustomerInfo} customer
 * @property {SpaceInfo} space
 * @property {SiteConditions} site
 * @property {ScopeSelection} scopes
 * @property {FinishOptions} finish
 * @property {ScheduleInfo} schedule
 * @property {UploadedFiles} uploads
 * @property {string} additionalRequests
 * @property {EstimateResult|null} result
 */
// 필드는 research.md §2 입력 스키마 60개 그대로 반영
```

### 3-2. reducer (`app/page.js`)

```js
const initialState = { step: 0, customer: {...}, space: {...}, /* ... */ };

function reducer(state, action) {
  switch (action.type) {
    case 'UPDATE_FIELD':    // { group, field, value }
    case 'TOGGLE_SCOPE':    // { scope }
    case 'TOGGLE_SPECIAL':  // { item }
    case 'GOTO_STEP':       // { step }
    case 'NEXT_STEP':
    case 'PREV_STEP':
    case 'SET_RESULT':
    case 'RESET':
    default: return state;
  }
}
```

### 3-3. 견적 보정 엔진 (`lib/estimate-engine.js`)

```js
import { SPACE_MULTIPLIERS, SITE_MULTIPLIERS, GRADE_MULTIPLIERS } from '@/data/estimate-multipliers';

/**
 * 백엔드 PRICER 결과 + 폼 입력 → 저/표/고 비교 + 포함/별도/제외
 */
export function enrichEstimate(backendResult, form) {
  const spaceM = SPACE_MULTIPLIERS[form.space.spaceType] ?? 1.0;
  const siteM = calcSiteMultiplier(form.site);     // 엘베없음 +5% 등
  const base = backendResult.min_cost * spaceM * siteM;

  const tiers = {
    budget:   { total: Math.round(base * GRADE_MULTIPLIERS.budget),   label: '저가형' },
    standard: { total: Math.round(base * GRADE_MULTIPLIERS.standard), label: '표준형', recommended: true },
    premium:  { total: Math.round(base * GRADE_MULTIPLIERS.premium),  label: '고급형' },
  };

  const separateItems = extractSeparateItems(form.finish.specialItems);  // 증설/신규/간판 등 분리
  const excludedItems = extractExcludedItems(form);                      // 인허가/구조보강 등

  return { tiers, separateItems, excludedItems, spaceM, siteM, /* ... */ };
}
```

### 3-4. 조건부 질문 (`data/estimate-conditional.js`)

```js
export const CONDITIONAL_QUESTIONS = [
  {
    id: 'restaurant_kitchen',
    when: (f) => f.space.spaceType === '상업공간' && f.space.spaceSubtype === '음식점',
    questions: [
      { key: 'hasKitchenEquipment', label: '주방 설비 포함 여부', type: 'boolean' },
      { key: 'needsDuct',           label: '배기/덕트 필요 여부', type: 'boolean' },
      { key: 'needsGasWork',        label: '가스 공사 여부',     type: 'boolean' },
    ],
  },
  {
    id: 'electric_scope',
    when: (f) => f.scopes.selected.includes('전기공사'),
    questions: [
      { key: 'electricScope', label: '전기 공사 범위', type: 'radio',
        options: ['기존 유지', '일부 증설', '전면 증설'] },
    ],
  },
  // ...
];
```

### 3-5. 폼 → 백엔드 description 문자열 (`lib/estimate-description.js`)

```js
/**
 * 구조화된 폼 데이터를 백엔드 ESTIMATOR가 해석할 수 있는 자연어 문장으로 조합
 * 기존 /api/estimate/stream 스키마 그대로 호출
 */
export function buildBackendDescription(form) {
  const parts = [];
  parts.push(`공간유형: ${form.space.spaceType}${form.space.spaceSubtype ? '/' + form.space.spaceSubtype : ''}`);
  parts.push(`면적: ${form.space.totalArea}m²`);
  if (form.space.ceilingHeight) parts.push(`천장높이: ${form.space.ceilingHeight}m`);
  if (form.scopes.selected.length) parts.push(`공사범위: ${form.scopes.selected.join(', ')}`);
  if (form.finish.specialItems.length) parts.push(`별도항목: ${form.finish.specialItems.join(', ')}`);
  if (form.additionalRequests) parts.push(`추가요청: ${form.additionalRequests}`);
  return parts.join(' / ');
}
```

### 3-6. 결과 리포트 9 섹션 (`app/page.js`)

```jsx
{state.step === 9 && state.result && (
  <>
    <ResultSummary          form={state} result={state.result} />
    <ResultComparisonCards  tiers={state.result.tiers} />
    <ResultDetailEstimate   breakdown={state.result.breakdown} workItems={state.result.work_items} />
    <ResultInclusions       included={included} separate={separate} excluded={excluded} />
    <ResultSchedule         schedule={scheduleEstimate} />
    <ResultProcessPlan      phases={processPhases} />
    <ResultCommentary       flags={state.result.validator_flags} comment={state.result.expert_comment} />
    <ResultDisclaimers />
    <ResultActions          onPdf={downloadPdf} onConsult={openConsultForm} onReset={reset} />
  </>
)}
```

---

## 4. Phase별 구현 계획 & 체크리스트

### Phase A — 필수 (목표: 오늘 완료)

**A1. 기반 정비 (30분)**
- [ ] `frontend/app/page_v1.js.bak` — 현재 page.js 백업
- [ ] `frontend/components/estimate/` 디렉토리 생성
- [ ] `frontend/lib/` 디렉토리 생성
- [ ] `frontend/data/` 디렉토리 생성

**A2. 데이터/엔진 레이어 (1.5시간)**
- [ ] `data/estimate-options.js` — 공간유형 9종, 공사범위 25종, 별도항목 16종, 마감등급, 연락선호 등
- [ ] `data/estimate-conditional.js` — 조건부 질문 선언형 config
- [ ] `data/estimate-multipliers.js` — 공간/난이도/등급 계수 테이블
- [ ] `data/estimate-process-plan.js` — 공정 단계 템플릿 (8단계)
- [ ] `lib/estimate-validators.js` — 이메일/전화/면적 검증
- [ ] `lib/estimate-formatters.js` — 금액·기간·날짜 포맷
- [ ] `lib/estimate-description.js` — 폼 → BE description 조합
- [ ] `lib/estimate-engine.js` — 보정 계산
- [ ] `lib/estimate-schedule.js` — 일정/공정 추정

**A3. Step 컴포넌트 (2시간)**
- [ ] `StepHeader` — 현재 단계 표시 + 이전/다음
- [ ] `StepLanding` — 랜딩 (CTA "견적 시작하기")
- [ ] `StepCustomerInfo` — 고객 기본정보 10필드
- [ ] `StepSpaceInfo` — 공간 유형/기본 10필드
- [ ] `StepSiteConditions` — 현장 여건 12필드
- [ ] `StepScopes` — 공사 범위 25체크 + 조건부
- [ ] `StepFinishOptions` — 마감등급/별도항목 10필드
- [ ] `StepScheduleUpload` — 일정/업로드 7필드
- [ ] `AnalysisLoading` — SSE 에이전트 파이프라인 시각화 (v1 로직 재사용)

**A4. Result 컴포넌트 (2시간)**
- [ ] `ResultSummary` — 상단 요약 박스
- [ ] `ResultComparisonCards` — 3카드 + 추천 배지
- [ ] `ResultDetailEstimate` — 공종별 금액 + 설명
- [ ] `ResultInclusions` — 포함/별도/제외 3분할
- [ ] `ResultSchedule` — 총기간·착공·완료·리스크
- [ ] `ResultProcessPlan` — 8단계 타임라인
- [ ] `ResultCommentary` — validator flags + expert_comment 렌더
- [ ] `ResultDisclaimers` — 4개 고정 유의사항
- [ ] `ResultActions` — CTA 4버튼

**A5. 메인 컨테이너 (1시간)**
- [ ] `app/page.js` 재작성 — useReducer + step 스위치 + API 호출
- [ ] 기존 SSE 로직 (page.js:97~164) 이식
- [ ] 필수 검증 누락 시 next 차단
- [ ] 단계 이동 시 `window.scrollTo(0, 0)`

**A6. 검증 & 배포 (30분)**
- [ ] 로컬 `npm run build` 통과
- [ ] 7단계 입력 → 결과 리포트 E2E 확인 (브라우저)
- [ ] 모바일 폭(375px) 레이아웃 확인
- [ ] Git commit + push → Vercel 자동 배포

### Phase B — 가능하면
- [ ] `lib/estimate-storage.js` — localStorage 자동저장 (step 변경 시 debounced)
- [ ] `ResumeBanner` — 이어서 작성하기 배너 (초기화 옵션 포함)
- [ ] 입력 중간 저장 UX 테스트

### Phase C — 여유시
- [ ] 상담요청 모달 + 간단 제출 로그 (console / localStorage)
- [ ] 백엔드 `EstimateRequest`에 `form_snapshot` optional 필드 추가 (관리자 확장 준비)
- [ ] PDF 템플릿에 고객명/주소 포함 (`reporter.py` 파라미터 확장)

---

## 5. 검증 체크리스트

### 설계 검증
- [x] CPS Problem 매핑 되어있는가 → §1 표
- [x] 기존 백엔드와 호환되는가 → `/api/estimate/stream` 스키마 무변경
- [x] monolith 해소되는가 → 15+ 컴포넌트 + lib 6 + data 4
- [x] 중복 로직 없는가 → SSE 로직 한 곳(`page.js`)으로 집중

### 구현 검증
- [x] 기존 Tailwind + 인라인 스타일 톤 유지 → v1 스타일 재사용
- [x] 타입 안전성 → JSDoc 기반 (`lib/estimate-types.js`)
- [x] 에러 핸들링 → SSE error 이벤트 + 단계별 검증 실패 시 이동 차단
- [x] 허구 금지 → 실시간 단가 API 호출 없음, "기본단가 기반 자동산출" 문구 사용

### 유지보수 검증
- [x] 파일명 컨벤션 → PascalCase 컴포넌트, camelCase lib
- [x] 조건부 로직 선언형 → `data/estimate-conditional.js` 한 파일에 집중
- [x] 계수 테이블 외부화 → `data/estimate-multipliers.js`
- [x] 중간저장 → Phase B에서 localStorage

### 대회 마감 검증
- [x] D-1 내 Phase A 완료 가능한가 → 6시간 추정 (A1~A6)
- [x] 배포 리스크 낮은가 → 백엔드 무변경, 프론트만 수정
- [x] 롤백 가능한가 → `page_v1.js.bak` 보관

---

## 6. 판정

✅ **전체 통과 — "구현해" 승인 요청**

### 구현 전 확인 포인트
1. **Phase A 범위 확정** — 위 체크리스트로 진행해도 되는지
2. **백엔드 무변경 원칙 동의** — 프론트만 수정
3. **v1 page.js 백업 후 새로 작성** — 롤백 경로 확보
4. **"구현해" 한 단어 승인 → 즉시 착수**

아직 코드는 수정하지 않았습니다. 승인을 주시면 Phase A부터 순차 착수하겠습니다.
