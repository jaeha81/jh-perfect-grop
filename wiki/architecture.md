# 아키텍처: 5 에이전트 파이프라인

> 최종 업데이트: 2026-04-11

## 파이프라인 흐름

```
사용자 입력 (텍스트 + 선택적 이미지)
    ↓
[Agent 1: SCANNER]    이미지 → 공간 분석 (선택, Claude Sonnet Vision)
    ↓
[Agent 2: ESTIMATOR]  설명 + 면적 → 공종별 수량 (Claude Haiku + tool_use)
    ↓
[Agent 3: PRICER]     수량 + 단가DB → 공종별 금액 (JSON 룩업, 동기)
    ↓
[Agent 4: VALIDATOR]  금액 → 이상치 탐지 (Claude Sonnet + 18년 룰셋)
    ↓
[Agent 5: REPORTER]   전체 데이터 → PDF 견적서 (fpdf2, 동기)
```

## 에이전트별 기술 상세

| Agent | 파일 | 모델 | 입력 | 출력 |
|-------|------|------|------|------|
| SCANNER | agents/scanner.py | Sonnet 4.6 (Vision) | base64 이미지 | 공간 분석 텍스트 |
| ESTIMATOR | agents/estimator.py | Haiku 4.5 (tool_use) | 공사 설명+면적 | 공종별 수량 list |
| PRICER | agents/pricer.py | — (동기 계산) | 수량 list | 금액 breakdown |
| VALIDATOR | agents/validator.py | Sonnet 4.6 | 금액 breakdown | flags + 총평 |
| REPORTER | agents/reporter.py | — (fpdf2) | 전체 견적 | PDF base64 |

## 파일 구조

```
backend/
├── main.py              ← FastAPI + 파이프라인 오케스트레이터
├── agents/
│   ├── __init__.py
│   ├── scanner.py       ← Agent 1 (Wave 4)
│   ├── estimator.py     ← Agent 2 (Wave 2)
│   ├── pricer.py        ← Agent 3 (Wave 2)
│   ├── validator.py     ← Agent 4 (Wave 3)
│   └── reporter.py      ← Agent 5 (Wave 3)
├── data/
│   └── unit_prices.json ← 공종별 단가 DB (30+ 카테고리)
└── requirements.txt
```

## 에러 처리 전략

각 에이전트 실패 시 fallback 동작:
- SCANNER 실패 → context 없이 ESTIMATOR 계속
- ESTIMATOR 실패 → 기본 비율 기반 수량 산출로 대체
- PRICER 실패 → 카테고리별 기본 단가 적용
- VALIDATOR 실패 → flags 없이 반환
- REPORTER 실패 → pdf_base64 필드 생략, 견적 데이터는 정상 반환

## API 엔드포인트

- `GET /api/health` — 상태 확인
- `POST /api/estimate` — 메인 파이프라인 실행

## 관련 페이지

- [unit-prices.md](unit-prices.md)
- [validator-rules.md](validator-rules.md)
- [api-spec.md](api-spec.md)
