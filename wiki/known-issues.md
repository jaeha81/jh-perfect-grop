# Known Issues

> 형식: [날짜] 문제 / 원인 / 조치 / 상태

---

## [2026-04-15] recalculate 엔드포인트 PDF 미생성

- **문제**: `POST /api/estimate/recalculate` 응답에 `pdf_base64` 없음, `excel_base64`만 생성됨
- **원인**: `_find_font()`가 단일 경로 반환 → `add_font("KR","", path)` + `add_font("KR","B", path)` 동일 파일 이중 등록 → fpdf2 캐시 충돌 → 예외 → None 반환
- **조치 (2026-04-15)**: `reporter.py` — `_FONT_REGULAR_CANDIDATES`/`_FONT_BOLD_CANDIDATES` 분리, `_find_bold_font()` 추가, `_bold_style` 변수로 미등록 시 "" 폴백
- **상태**: ✅ 해결

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
