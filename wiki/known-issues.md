# Known Issues

> 형식: [날짜] 문제 / 원인 / 조치 / 상태

---

## [2026-04-24] Warm Orange 디자인 시스템 전면 적용 완료

- **범위**: 전체 estimate 컴포넌트 19개 파일 — cold purple/blue-gray 완전 제거
- **커밋**: `449e5b8` (design), `9e8ccdb` (package-lock)
- **변경 색상 규칙**:
  - `#a09eb8` → `#a09080` (label 색상)
  - `#6b6a80` → `#6b5f50` (muted 색상)
  - `#c4c2d8` → `#c8b8a8` (dim text)
  - `#a78bfa` → `#FF8C5A` (accent 색상)
  - `rgba(124,106,247,X)` → `rgba(255,107,53,X)` (orange tint)
  - `linear-gradient(purple)` → `linear-gradient(#FF6B35, #CC4E1F)`
  - `bg-[#13131a]` → `bg-[#13100d]`
- **의도적 보존 색상** (시맨틱):
  - teal `#22d3a0` — 선택 완료 / 체크 / ok 상태
  - yellow `#fbbf24` — 경고 / sketch
  - red `#f87171` — 오류 / 제외 항목
- **수정 파일 목록**:
  - `frontend/app/globals.css`
  - `frontend/components/estimate/FormPrimitives.jsx`
  - `StepCustomerInfo`, `StepSpaceInfo`, `StepFinishOptions`, `StepScopes`, `StepScheduleUpload`
  - `StepHeader`, `StepNav`
  - `ResumeBanner`, `ResultSummary`, `ResultComparisonCards`
  - `ResultActions`, `ResultCommentary`, `ResultDetailEstimate`
  - `ResultSchedule`, `ResultProcessPlan`, `ResultInclusions`, `ResultDisclaimers`
- **다음 세션 이어받기 포인트**:
  - 디자인 작업 100% 완료 — 추가 색상 수정 불필요
  - Vercel 자동 배포 완료 상태
  - 남은 과제: `inquiries.jsonl` → Supabase 전환, `ADMIN_TOKEN` 설정, PDF 서버사이드 변환
- **상태**: ✅ 완료 — master 브랜치 배포됨

---

## [2026-04-24] AI 윤리·법령 준수 — 3건 수정 완료

- **범위**: 개인정보 보호법 제15조/29조 + AI 기본법 제34조 대응
- **커밋**: `e5a5b1d`
- **수정 내용**:
  1. ✅ **개인정보 수집 동의 UI** (`StepCustomerInfo.jsx`)
     - 수집 항목·목적·보유기간 인라인 고지문 추가
     - 동의 체크박스 — 미체크 시 `canNext=false` (다음 버튼 비활성화)
  2. ✅ **AI GENERATED 배지** (`ResultSummary.jsx`)
     - 결과 화면 최상단에 `🤖 AI 자동 생성 견적 (AI GENERATED)` 배지 추가
     - 대회 채점 기준 + AI 기본법 제34조 투명성 의무 충족
  3. ✅ **inquiries.jsonl 개인정보 마스킹** (`backend/main.py`)
     - 이름 → 이니셜 (홍길동→홍**), 전화 → 뒤 4자리, 이메일 → 도메인만, 주소 → 시·구 단위
     - 개인정보 보호법 제29조 안전조치 의무 부분 충족 (완전 해결은 Supabase 연동)
- **잔여 이슈** (대회 이후):
  - `inquiries.jsonl` → Supabase 전환 (컨테이너 휘발성 해소)
  - PDF 서버사이드 변환 (`pdf2image`)
- **상태**: ✅ 완료 — master 브랜치 배포됨

---

## [2026-04-24] 다중 첨부파일 지원 (Wave A~D) 구현 완료

- **범위**: SCANNER 다중 이미지 + 3존 업로드 UI + 오른쪽 미리보기 패널
- **커밋**: `82703b7`
- **신규/변경 파일**:
  - `frontend/lib/estimate-state.js` — `sketches: []` 추가, 리듀서 확장
  - `frontend/lib/estimate-validators.js` — PDF/스케치 파일 검증 추가
  - `frontend/components/estimate/StepScheduleUpload.jsx` — 3존 + 미리보기 패널 + `maxCount` 제한
  - `frontend/app/page.js` — `image_base64` 레거시 필드 제거, 3배열 전송으로 전환
  - `backend/agents/scanner.py` — `run_scanner_multi()` 추가, 역할별 레이블 이미지 블록
  - `backend/main.py` — `EstimateRequest`에 `images_base64/drawings_base64/sketches_base64` 추가
- **코드리뷰 수정사항 (Critical 3 + Warning 3)**:
  1. ✅ PDF UI 오해 해소 — 힌트 텍스트·푸터 문구 수정
  2. ✅ 프론트엔드 파일 수 제한 — `maxCount` 강제 적용
  3. ✅ 중복 이미지 전송 제거 — `image_base64` 레거시 필드 제거
  4. ✅ 예외 로깅 추가 — `logger.warning(..., exc_info=True)`
  5. ✅ 썸네일 null 안전 렌더링 — f.preview null guard 추가
- **미구현 (미래 확장)**:
  - PDF 서버사이드 이미지 변환 (`pdf2image`) — AI 분석에 도면 JPG/PNG 권장 문구로 대체
  - `ADMIN_TOKEN` 미설정 시 403 처리 — 별도 태스크로 분리
- **상태**: ✅ 완료 — master 브랜치 배포됨

---

## [2026-04-15] recalculate 엔드포인트 PDF 미생성

- **문제**: `POST /api/estimate/recalculate` 응답에 `pdf_base64` 없음, `excel_base64`만 생성됨
- **원인**: `_find_font()`가 단일 경로 반환 → `add_font("KR","", path)` + `add_font("KR","B", path)` 동일 파일 이중 등록 → fpdf2 캐시 충돌 → 예외 → None 반환
- **조치 (2026-04-15)**: `reporter.py` — `_FONT_REGULAR_CANDIDATES`/`_FONT_BOLD_CANDIDATES` 분리, `_find_bold_font()` 추가, `_bold_style` 변수로 미등록 시 "" 폴백
- **상태**: ✅ 해결

---

## [2026-04-23] v2 전개 완료 (Phase A~F)

- **범위**: 7단계 입력 폼 + 9섹션 리포트 + `/admin` + `/api/report` + `/api/inquiries` (GET/POST)
- **신규 파일**:
  - `frontend/app/admin/page.js`, `frontend/lib/estimate-*.js`, `frontend/data/estimate-*.js`,
    `frontend/components/estimate/*.jsx`
  - backend `POST /api/inquiries`, `GET /api/inquiries`, `POST /api/report`
- **변경**: `reporter.py` — PDF/Excel에 3단계 비교·포함/별도/제외·일정·공정계획·AI 코멘트 섹션 추가
- **제한사항** (프로덕션 전환 시 조치 필요):
  1. `inquiries.jsonl`은 컨테이너 휘발성 — Vercel/Railway 재배포 시 초기화. Supabase 연동 권장
  2. `ADMIN_TOKEN` 미설정 시 `/admin` 무인증 개방 (개발 편의). 배포 전 **반드시** 설정
  3. enriched PDF 재생성은 비동기 — 결과 화면 진입 직후 1~2초 내 pdfBase64 교체됨.
     즉시 다운로드 클릭 시 초기(raw) 버전이 내려올 수 있음
  4. `form_snapshot`은 백엔드에 전달되지만 현재는 저장하지 않음 (관리자 확장 예비)
- **상태**: ✅ 완료 — PR #1 병합 대기

---

## [2026-04-14] VALIDATOR 주방 환기(후드) 플래그 과다

- **문제**: scenario_1(정상 견적)에서도 "주방 환기(후드) 항목이 없습니다" 경고 발생
- **원인**: ESTIMATOR가 환기/후드를 별도 공종으로 분류하지 않아 VALIDATOR 룰이 항상 탐지; has_hood가 "환기" 키워드로 욕실 환기팬과 혼동; R14와 R33 중복 발동
- **조치 (2026-04-15 완료)**:
  1. `validator.py` `has_hood` 감지 키워드를 "후드" + "주방환기"로 한정 ("환기" 단독 제거)
  2. `validator.py` R14 조건을 `has_kitchen` → `has_sink_item`(실제 싱크대 키워드 존재 시)으로 정교화
  3. `validator.py` R33 중복 발동 방지 (R14가 이미 체크한 경우 R33 패스)
  4. `validator.py` R31 욕실 환기팬 severity를 warning → info로 하향, 감지 키워드를 "환기팬"/"욕실환기"/"욕실팬"/"팬"으로 한정
  5. `estimator.py` 프롬프트에 "싱크대 있으면 반드시 주방후드 항목 포함" 명시 추가
- **상태**: 해결 완료
