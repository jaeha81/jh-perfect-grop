# Known Issues

> 형식: [날짜] 문제 / 원인 / 조치 / 상태

---

## [2026-04-15] recalculate 엔드포인트 PDF 미생성

- **문제**: `POST /api/estimate/recalculate` 응답에 `pdf_base64` 없음, `excel_base64`만 생성됨
- **원인**: `recalculate()` 핸들러에서 REPORTER 호출 시 PDF 생성 분기 누락 추정
- **조치 필요**: `backend/main.py` recalculate 핸들러 → `run_reporter()` 반환값 중 `pdf_base64` 포함 여부 확인
- **상태**: 미해결 (다음 세션 최우선 처리)

---

## [2026-04-14] VALIDATOR 주방 환기(후드) 플래그 과다

- **문제**: scenario_1(정상 견적)에서도 "주방 환기(후드) 항목이 없습니다" 경고 발생
- **원인**: ESTIMATOR가 환기/후드를 별도 공종으로 분류하지 않아 VALIDATOR 룰이 항상 탐지
- **조치**: ESTIMATOR 프롬프트에 환기/후드 항목 명시 추가 또는 VALIDATOR 룰 임계값 조정
- **상태**: 미해결 (데모 영향 낮음, 우선순위 낮음)
