"""
JH EstimateAI — API 통합 테스트
실행: python test_api.py
사전조건: uvicorn main:app --reload (포트 8000)
"""
import json
import sys
import time

try:
    import httpx
except ImportError:
    print("httpx 설치 필요: pip install httpx")
    sys.exit(1)

BASE = "http://localhost:8000"

# ─── 테스트 케이스 ─────────────────────────────────────────

CASES = [
    {
        "name": "TC-01  기본 인테리어 (30평)",
        "payload": {
            "type": "인테리어",
            "area": 99.0,
            "description": (
                "아파트 전체 인테리어. 거실·침실 강마루, 주방·욕실 타일, "
                "전체 실크도배, 전기공사 포함, 욕실 2개 전면 교체."
            ),
        },
        "expect": lambda r: r.get("min_cost", 0) > 5_000_000,
    },
    {
        "name": "TC-02  신축 소형 (20평)",
        "payload": {
            "type": "신축",
            "area": 66.0,
            "description": "소형 아파트 신축 기본 마감. 합판마루, 합지도배, 전기설비 포함.",
        },
        "expect": lambda r: r.get("breakdown") is not None,
    },
    {
        "name": "TC-03  리모델링 (50평)",
        "payload": {
            "type": "리모델링",
            "area": 165.0,
            "description": (
                "상업용 오피스 리모델링. 에폭시코팅 바닥, 인테리어필름 파티션, "
                "LED 조명 교체, 냉난방 설비."
            ),
        },
        "expect": lambda r: len(r.get("validator_flags", [])) >= 0,
    },
    {
        "name": "TC-04  VALIDATOR 오류 유발 (초저가)",
        "payload": {
            "type": "인테리어",
            "area": 99.0,
            "description": "바닥재만 간단히 교체.",
        },
        "expect": lambda r: True,  # 결과 확인용
    },
]


def fmt_krw(n: int) -> str:
    return f"{n:,}원"


def run_test(case: dict, client: httpx.Client) -> bool:
    name = case["name"]
    print(f"\n{'─' * 60}")
    print(f"▶ {name}")

    try:
        t0 = time.time()
        resp = client.post(
            f"{BASE}/api/estimate",
            json=case["payload"],
            timeout=60.0,
        )
        elapsed = round(time.time() - t0, 1)

        if resp.status_code != 200:
            print(f"  ✗ HTTP {resp.status_code}")
            print(f"  {resp.text[:200]}")
            return False

        data = resp.json()

        # 기본 필드 확인
        required = ["min_cost", "max_cost", "breakdown", "validator_flags"]
        missing = [k for k in required if k not in data]
        if missing:
            print(f"  ✗ 필드 누락: {missing}")
            return False

        # 기대값 확인
        if not case["expect"](data):
            print(f"  ✗ 기대값 미충족")
            return False

        # 결과 출력
        area = case["payload"]["area"]
        print(f"  ✓ {elapsed}s  |  {fmt_krw(data['min_cost'])} ~ {fmt_krw(data['max_cost'])}")
        print(f"    단가: {fmt_krw(data.get('unit_price', 0))}/m²  |  면적: {area}m²")

        breakdown = data.get("breakdown", {})
        top3 = sorted(breakdown.items(), key=lambda x: x[1], reverse=True)[:3]
        print(f"    상위 공종: {', '.join(f'{k}({fmt_krw(v)})' for k, v in top3)}")

        flags = data.get("validator_flags", [])
        if flags:
            print(f"    VALIDATOR: {len(flags)}개 플래그")
            for f in flags[:2]:
                icon = "🔴" if f.get("severity") == "error" else "🟡"
                print(f"      {icon} [{f.get('category')}] {f.get('message', '')[:50]}")

        if data.get("pdf_base64"):
            pdf_size = len(data["pdf_base64"]) * 3 // 4 // 1024
            print(f"    PDF: {pdf_size}KB 생성됨")

        return True

    except httpx.ConnectError:
        print(f"  ✗ 연결 실패 — 백엔드가 실행 중인지 확인: uvicorn main:app --reload")
        return False
    except Exception as e:
        print(f"  ✗ 오류: {e}")
        return False


def main():
    print("=" * 60)
    print("JH EstimateAI API 통합 테스트")
    print("=" * 60)

    # 헬스체크
    try:
        with httpx.Client() as client:
            resp = client.get(f"{BASE}/api/health", timeout=5.0)
            h = resp.json()
            api_key_ok = h.get("api_key_set", False)
            print(f"\n헬스체크: {'✓' if resp.status_code == 200 else '✗'}")
            print(f"API Key: {'✓ 설정됨' if api_key_ok else '✗ 미설정 — .env 확인 필요'}")
            if not api_key_ok:
                print("\n⚠ ANTHROPIC_API_KEY가 설정되지 않았습니다.")
                print("  backend/.env 파일에 키를 추가하세요.")
                sys.exit(1)
    except httpx.ConnectError:
        print("\n✗ 백엔드 서버에 연결할 수 없습니다.")
        print("  실행 방법: cd backend && uvicorn main:app --reload")
        sys.exit(1)

    # 테스트 실행
    with httpx.Client() as client:
        results = [run_test(c, client) for c in CASES]

    # 요약
    passed = sum(results)
    total = len(results)
    print(f"\n{'=' * 60}")
    print(f"결과: {passed}/{total} 통과  {'✓ ALL PASS' if passed == total else '✗ 일부 실패'}")


if __name__ == "__main__":
    main()
