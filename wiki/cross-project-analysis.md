---
최종 업데이트: 2026-04-12
---

# 프로젝트 교차 분석 — 퍼펙트그룹 vs 견적시스템

> jh-perfect-grop (대회용) ↔ jh-estimate-system (실무용) 비교 분석 및 보완 로드맵

---

## 1. 두 프로젝트 개요

| 항목 | jh-perfect-grop (퍼펙트그룹) | jh-estimate-system (견적시스템) |
|------|-----|------|
| **목적** | 텍스트/사진 → 견적 자동 생성 | 엑셀 파일 → 공종 분류 + 정규화 |
| **대회** | 2026 AI 챔피언 대회 (마감 04.24) | 실무 배포용 |
| **상태** | Wave 2~4 진행 중 | MVP 완성, 배포 대기 |
| **출력** | PDF 견적서 | 엑셀 원본 양식 유지 |
| **AI** | Claude Haiku(ESTIMATOR) + Sonnet(VALIDATOR) | keyword_dict 우선 + Claude 보조 |
| **DB** | JSON 파일 → Supabase 기획 중 | Supabase 완성 (스키마+단가+Storage) |

---

## 2. 겹치는 기능 분석

| 기능 | 퍼펙트그룹 구현 | 견적시스템 구현 | 차이 |
|------|----------------|----------------|------|
| **공종 분류** | ESTIMATOR (Claude Haiku tool_use) | CLASSIFIER (keyword_dict + Claude) | 접근법 다름 |
| **단가 적용** | PRICER (unit_prices.json 96개) | 없음 (분류만) | 퍼펙트만 금액 계산 |
| **검증** | VALIDATOR (18년 현장 룰셋) | review_flag (신뢰도 기준) | 철학 다름 |
| **키워드 사전** | 없음 | keyword_dict 151개 | **견적시스템 자산 활용 가능** |
| **엑셀 처리** | 없음 (PDF만) | openpyxl 원본 양식 보존 | 견적시스템 특화 |
| **컨펌 루프** | 없음 | review_flag 기반 컨펌 UI | 견적시스템 특화 |
| **Supabase** | 기획 중 | 완성 (sessions, items, brands 스키마) | **견적시스템 스키마 참조 가능** |

---

## 3. 상호 보완 관계

```
견적시스템이 가진 것 → 퍼펙트그룹에 없음
─────────────────────────────────────────────────
✓ keyword_dict 151개 현장 용어 (철거~부가세)
✓ Supabase 완성 스키마
✓ 97개 현장 용어 사전 + 53개 확장 권장
✓ 엑셀 파싱 로직 (수식 셀 보존)
✓ 컨펌 루프 UI (review_flag 기반)

퍼펙트그룹이 가진 것 → 견적시스템에 없음
─────────────────────────────────────────────────
✓ 단가 계산 (PRICER + unit_prices.json 96개 공종)
✓ PDF 견적서 출력 (REPORTER)
✓ 이미지 분석 (SCANNER, Wave 4)
✓ 18년 현장 룰셋 VALIDATOR
✓ 견적 범위 자동 산출 (min/max ±10%/+15%)
```

---

## 4. 대회 기간 내 적용 완료 항목

> 마감 04.24 기준, 범위를 벗어나지 않는 선에서 적용

| 항목 | 작업 내용 | 상태 | 파일 |
|------|----------|------|------|
| keyword_dict 적용 | 151개 현장 용어를 ESTIMATOR 시스템 프롬프트에 주입 | ✅ 완료 | `backend/data/keyword_dict.json` |
| ESTIMATOR 프롬프트 강화 | keyword → category 매핑 컨텍스트 추가 | ✅ 완료 | `backend/agents/estimator.py` |

**효과:** ESTIMATOR가 "LGS", "T-BAR", "FCU", "에폭시바닥" 등 현장 은어를 정확히 분류 가능

---

## 5. 대회 이후 업그레이드 항목 (→ future-upgrades.md 참조)

| 우선순위 | 항목 | 기대 효과 |
|---------|------|----------|
| ★★★ | 견적시스템 Supabase 스키마 → 퍼펙트그룹 연동 | 실시간 단가 업데이트 |
| ★★★ | 견적시스템 엑셀 처리 로직 통합 | 엑셀 견적서 입/출력 |
| ★★ | 컨펌 루프 UI 추가 | 사용자 검증 참여 |
| ★★ | keyword_dict DB화 (Supabase keywords 테이블) | 지속 학습 가능 구조 |
| ★ | 두 프로젝트 API 통합 (단일 백엔드) | 유지보수 효율화 |

---

## 6. 통합 가능 여부 판단

**권장 방향: 역할 분리 유지 + 데이터 자산 공유**

```
퍼펙트그룹 (대회용 데모)     견적시스템 (실무 배포)
─────────────────────         ─────────────────────
텍스트/사진 → 견적            엑셀 → 분류 → 엑셀
PDF 출력                      원본 양식 유지
18년 룰셋 검증                신뢰도 기반 컨펌

         공유 자산
    ─────────────────
    keyword_dict 151개
    unit_prices 96개
    Supabase (미래)
```

---

## 7. 관련 파일 경로

| 파일 | 설명 |
|------|------|
| `d:/ai프로젝트/jh-estimate-system/docs/phase0/keyword_dict_v1.csv` | 원본 키워드 사전 |
| `d:/ai프로젝트/jh-estimate-system/wiki/keyword-patterns.md` | 확장 키워드 목록 |
| `d:/ai프로젝트/jh-estimate-system/backend/app/agents/classifier.py` | 분류 로직 참조 |
| `d:/ai프로젝트/jh-perfect-grop/backend/data/keyword_dict.json` | 적용된 키워드 사전 |
| `d:/ai프로젝트/jh-perfect-grop/backend/agents/estimator.py` | 적용된 ESTIMATOR |
