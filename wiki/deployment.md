---
최종 업데이트: 2026-04-14
---

# 배포 구조

## Frontend — Vercel

- 레포: github.com/jaeha81/jh-perfect-grop
- 배포 폴더: `/frontend`
- 환경변수: `NEXT_PUBLIC_BACKEND_URL=<Railway URL>`
- PWA: manifest.json 설정 완료, 앱 아이콘 포함 (standalone 모드)

## Backend — Railway

- 시작 명령: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
- 헬스체크: `/api/health`
- 환경변수: `ANTHROPIC_API_KEY=<키>`
- 설정 파일: `railway.json`, `Procfile`, `backend/runtime.txt`

## API 엔드포인트

| 경로                   | 방식 | 설명                         |
| ---------------------- | ---- | ---------------------------- |
| `/api/health`          | GET  | 서버 상태 확인               |
| `/api/estimate`        | POST | 5 에이전트 파이프라인 (일반) |
| `/api/estimate/stream` | POST | SSE 실시간 스트리밍          |

## 로컬 개발

```bash
# 백엔드 (포트 8001)
cd backend && uvicorn main:app --port 8001 --reload

# 프론트엔드
cd frontend && npm run dev
```

API 프록시: `next.config.js` → `NEXT_PUBLIC_BACKEND_URL` (기본값: `http://127.0.0.1:8001`)

## 배포 URL

- **Frontend (Vercel):** [jh-perfect-grop.vercel.app](https://jh-perfect-grop.vercel.app)
- **Backend (Railway):** [jh-perfect-grop-backend.up.railway.app](https://jh-perfect-grop-backend.up.railway.app)
- **Health Check:** [.../api/health](https://jh-perfect-grop-backend.up.railway.app/api/health)

## 배포 체크리스트

- [ ] Railway에 `ANTHROPIC_API_KEY` 환경변수 설정 **← 사용자 확인 필요**
- [ ] Railway 헬스체크 확인: `curl https://jh-perfect-grop-backend.up.railway.app/api/health`
- [ ] Vercel에 `NEXT_PUBLIC_BACKEND_URL=https://jh-perfect-grop-backend.up.railway.app` 설정 **← 사용자 확인 필요**
- [ ] Vercel 재배포 후 프론트엔드 동작 확인
- [ ] `slides.md` URL 업데이트 완료 (2026-04-15)

## 관련 문서

- [architecture.md](architecture.md) — 5 에이전트 파이프라인
- [api-spec.md](api-spec.md) — API 명세 전체
