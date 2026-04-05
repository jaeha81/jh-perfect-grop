## 프로젝트 정의
- 프로젝트명: JH-EstimateAI
- 목적: 2026 전국민 AI 챔피언 대회 출품용 인테리어/건설 견적 자동화 AI
- 마감: 2026.04.24 (금)

## 개발자 프로필
- 인테리어 현장 경력 18년 (시공/견적/디자인/설계 전문)
- AI 풀스택 빌더 (FastAPI + Next.js + Supabase + Claude API)
- GitHub: jaeha81

## 핵심 시스템 구조
5개 멀티 에이전트 파이프라인:
- Agent 1: SCANNER    (공간 분석, 이미지 인식)
- Agent 2: ESTIMATOR  (수량 산출)
- Agent 3: PRICER     (단가 적용, 실시간 DB)
- Agent 4: VALIDATOR  (18년 현장 기준 이상치 탐지)
- Agent 5: REPORTER   (견적서 PDF/Excel 출력)

## 기술 스택
- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Backend: FastAPI (Python)
- DB: Supabase (PostgreSQL)
- AI: Claude API (Sonnet = 메인, Haiku = 반복처리)

## 핵심 워크플로우 (절대 원칙)
research.md → plan.md → 승인("구현해") → 구현
코드는 반드시 승인 후에만 작성한다.

## 대회 차별화 포인트
1. 18년 현장 데이터 기반 (교수님 AI가 아닌 현장의 AI)
2. 멀티 에이전트 오케스트레이션 구조
3. B2C/B2B/B2G 즉시 수익화 가능 구조
4. 세부 공종 96개 키워드 커버

## 개발 일정
04.01~04.05: 설명회 → 방향 확정 → research.md
04.06~04.10: plan.md → Wave 1 구현
04.11~04.17: Wave 2~3 구현
04.18~04.21: Wave 4 통합 + QA
04.22~04.23: 데모 + 발표자료
04.24: 최종 제출