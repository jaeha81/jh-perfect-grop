---
최종 업데이트: 2026-04-24
---

# 배포 구조

## Frontend — Vercel

- 레포: github.com/jaeha81/jh-perfect-grop (GitHub 연동 완료 — push → 자동 배포)
- 배포 폴더: `/frontend`
- 환경변수:
  - `NEXT_PUBLIC_BACKEND_URL=https://jh-perfect-grop.onrender.com` (클라이언트 직접 호출)
  - `INTERNAL_BACKEND_URL=https://jh-perfect-grop.onrender.com` (서버사이드 프록시)
- PWA: manifest.json 설정 완료, 앱 아이콘 포함 (standalone 모드)
- 설정: `vercel.json` — buildCommand, outputDirectory, framework만 유지 (experimentalServices 제거)

## Backend — Render

- URL: https://jh-perfect-grop.onrender.com
- 시작 명령: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
- 헬스체크: `/api/health`
- 환경변수: `ANTHROPIC_API_KEY=<키>`

## API 엔드포인트

| 경로                      | 방식 | 설명                         |
| ------------------------- | ---- | ---------------------------- |
| `/api/health`             | GET  | 서버 상태 확인               |
| `/api/estimate`           | POST | 5 에이전트 파이프라인 (일반) |
| `/api/estimate/stream`    | POST | SSE 실시간 스트리밍          |
| `/api/estimate/compare`   | POST | 견적 비교                    |
| `/api/estimate/recalculate` | POST | 견적 재계산                 |
| `/api/inquiries`          | GET/POST | 문의 조회/저장 (PII 마스킹) |
| `/api/report`             | POST | 보고서 생성                  |

## 로컬 개발

```bash
# 백엔드 (포트 8001)
cd backend && uvicorn main:app --port 8001 --reload

# 프론트엔드
cd frontend && npm run dev
```

API 프록시: `frontend/app/api/[...path]/route.js` → `INTERNAL_BACKEND_URL` (기본값: `http://127.0.0.1:8000`)

## 배포 URL

- **Frontend (Vercel):** [jh-perfect-grop.vercel.app](https://jh-perfect-grop.vercel.app)
- **Backend (Render):** [jh-perfect-grop.onrender.com](https://jh-perfect-grop.onrender.com)
- **Health Check:** [/api/health](https://jh-perfect-grop.onrender.com/api/health)

## 배포 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-24 | 컴플라이언스 3종 배포 (개인정보 동의, AI 배지, PII 마스킹); GitHub 자동배포 연동 완료 |
| 2026-04-15 | slides.md URL 업데이트 |
| 2026-04-14 | Railway → Render 마이그레이션 |

## 관련 문서

- [architecture.md](architecture.md) — 5 에이전트 파이프라인
- [api-spec.md](api-spec.md) — API 명세 전체
