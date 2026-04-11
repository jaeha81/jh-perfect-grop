# VALIDATOR 룰셋 — 18년 현장 검증 기준

> 최종 업데이트: 2026-04-11

## 개요

Agent 4: VALIDATOR는 Claude Sonnet에 18년 현장 경험 기반 룰셋을 시스템 프롬프트로 내재화하여 견적 이상치를 탐지한다.

## 검증 기준

### 인테리어/리모델링

| 조건 | severity | 내용 |
|------|----------|------|
| m² 당 150,000원 미만 | error | 인건비 미포함 수준 |
| m² 당 800,000원 초과 | warning | 고급/특수 마감재 확인 |
| 전기 비중 3% 미만 | warning | 전기공사 누락 의심 |
| 설비 비중 5% 미만 | warning | 욕실·주방 설비 누락 |
| 철거 없는 리모델링 | warning | 철거비 누락 |

### 욕실 공사

| 조건 | severity | 내용 |
|------|----------|------|
| 욕실 1개 150만원 미만 | error | 기본 품질 불가 수준 |
| 타일 단가 55,000원/m² 미만 | warning | 저품질 자재 우려 |
| 방수 처리 미포함 | warning | 누수 리스크 |

### 신축 공사

| 조건 | severity | 내용 |
|------|----------|------|
| m² 당 1,000,000원 미만 | warning | 마감재 별도 가능성 |
| m² 당 3,000,000원 초과 | warning | 고급 마감재 확인 |

## 구현 위치

`backend/agents/validator.py` — `VALIDATOR_SYSTEM` 변수

## 관련 페이지

- [architecture.md](architecture.md)
- [api-spec.md](api-spec.md)
