---
최종 업데이트: 2026-04-12
---

# 퍼펙트그룹 — 대회 이후 업그레이드 로드맵

> 2026-04-24 대회 제출 이후 실무 서비스화를 위한 단계별 개선 계획

---

## 우선순위 기준

| 기호 | 의미 |
|------|------|
| ★★★ | 핵심 — 없으면 실무 사용 불가 |
| ★★  | 중요 — 품질/UX 큰 향상 |
| ★   | 개선 — 있으면 좋음 |

---

## Phase 1: 데이터 인프라 강화 (대회 직후 ~ 2주)

### 1-1. Supabase 완전 연동 ★★★
- **현재**: unit_prices.json 파일 기반 (로컬)
- **목표**: Supabase `unit_prices` 테이블 → 실시간 조회
- **참조**: `jh-estimate-system` Supabase 스키마 구조 활용
- **작업**:
  - `backend/db/supabase_prices.py` seed 실행 (이미 코드 완성)
  - `.env` SUPABASE_URL + SUPABASE_ANON_KEY 설정
  - 단가 관리 어드민 UI 추가

### 1-2. keyword_dict DB화 ★★
- **현재**: keyword_dict.json 파일 (151개 정적)
- **목표**: Supabase `keywords` 테이블 → 학습 루프
- **작업**:
  - `keywords(id, keyword, process_major, process_minor, match_count)` 테이블 생성
  - 견적 처리 시 매칭 키워드 `match_count++`
  - 자주 미매칭되는 항목 → 관리자 검토 큐

### 1-3. 견적 이력 저장 ★★
- **현재**: 견적 결과 메모리에서 소멸
- **목표**: Supabase `estimates` 테이블에 저장
- **스키마**:
  ```sql
  CREATE TABLE estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT, area FLOAT, description TEXT,
    min_cost INT, max_cost INT, unit_price INT,
    breakdown JSONB, validator_flags JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

---

## Phase 2: 기능 확장 (1개월)

### 2-1. 엑셀 견적서 출력 ★★★
- **현재**: PDF만 출력 (fpdf2)
- **목표**: 엑셀 견적서 출력 (openpyxl)
- **참조**: `jh-estimate-system/backend/app/services/excel_service.py`
- **작업**: `backend/agents/reporter.py`에 Excel export 추가

### 2-2. 컨펌 루프 UI ★★
- **현재**: VALIDATOR 플래그 표시만
- **목표**: 사용자가 플래그 항목 직접 수정 가능
- **참조**: `jh-estimate-system/frontend/app/confirm/[sessionId]/`
- **작업**: 결과 화면에 인라인 수정 UI 추가

### 2-3. 단가 수동 조정 ★★
- **현재**: 단가 고정 (PRICER 자동)
- **목표**: 사용자가 공종별 단가 직접 수정 후 재계산
- **작업**: 결과 breakdown 테이블 편집 가능하도록 UI 수정

### 2-4. 비교 견적 ★
- **현재**: 단일 견적 출력
- **목표**: 저가/표준/고급 3단계 견적 동시 출력
- **작업**: PRICER에 tier 파라미터 추가 (min_unit, base_unit, max_unit 분기)

---

## Phase 3: 서비스화 (2~3개월)

### 3-1. 사용자 계정/이력 관리 ★★★
- Supabase Auth 연동
- 견적 이력 조회/재출력
- 즐겨찾기 공종 세트 저장

### 3-2. 브랜드별 엑셀 양식 지원 ★★
- **참조**: `jh-estimate-system/backend/app/agents/template_manager.py`
- 한샘, LG Z:IN, 현대리바트 등 양식 자동 감지
- 브랜드 템플릿 DB 구축

### 3-3. 모바일 최적화 ★★
- 현재 UI: 680px 고정 (PC 중심)
- 목표: 현장에서 스마트폰으로 즉시 견적 가능
- 작업: Tailwind 반응형 레이아웃으로 전환

### 3-4. API 공개 (B2B) ★
- REST API 문서화 (Swagger 이미 있음)
- API Key 발급 관리
- 업체별 단가 DB 커스터마이징

---

## Phase 4: AI 고도화 (3개월 이후)

### 4-1. SCANNER 고도화 ★★
- **현재**: 단순 이미지 설명 추출
- **목표**: 도면 이미지 → 자동 면적 추출
- **작업**: CAD 도면 OCR + Claude Vision 연계

### 4-2. VALIDATOR 룰셋 확장 ★★
- **현재**: 18개 현장 규칙
- **목표**: 지역별/공사 유형별 룰셋 분기
  - 서울/수도권 vs 지방 단가 차이
  - 상업 공간 vs 주거 공간 기준 분리

### 4-3. keyword_dict 자동 학습 ★
- 견적 처리 결과에서 미매칭 패턴 수집
- 주기적 Claude API 호출로 신규 키워드 제안
- 관리자 승인 후 DB 반영

### 4-4. 두 프로젝트 통합 백엔드 ★
- 퍼펙트그룹 + 견적시스템 → 단일 FastAPI 앱
- 공통 모듈: keyword_dict, unit_prices, Supabase 연결

---

## 기술 부채 (언제든 처리 가능)

| 항목 | 현재 문제 | 개선 방법 |
|------|----------|----------|
| 포트 충돌 | 8000 포트 다른 서비스 점유 | Docker compose로 격리 |
| 인라인 스타일 | page.js 전체 인라인 CSS | Tailwind 전환 |
| 타입 안전성 | 프론트 JS (TypeScript 미적용) | TypeScript 마이그레이션 |
| 에이전트 타임아웃 | 60초 제한 (느린 네트워크 시 실패) | 스트리밍 응답 전환 |
| PDF 한글 폰트 | Windows 폰트 경로 하드코딩 | 폰트 파일 내장 |

---

## 관련 문서

- [cross-project-analysis.md](cross-project-analysis.md) — 두 프로젝트 교차 분석
- [architecture.md](architecture.md) — 5 에이전트 파이프라인 설계
- [api-spec.md](api-spec.md) — API 엔드포인트 명세
