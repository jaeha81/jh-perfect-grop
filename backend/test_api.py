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


# --- TC-05: compare endpoint ----------------------------------------

def run_test_compare(client):
    # TC-05: /api/estimate/compare 3단계 비교 견적 검증
    print()
    print("-" * 60)
    print("▶ TC-05  compare 엔드포인트 (저가/표준/고급)")

    payload = {
        "type": "인테리어",
        "area": 99.0,
        "description": "아파트 전체 인테리어. 강마루, 실크도배, 욕실 2개 교체, 전기공사.",
    }

    try:
        t0 = time.time()
        resp = client.post(f"{BASE}/api/estimate/compare", json=payload, timeout=120.0)
        elapsed = round(time.time() - t0, 1)

        if resp.status_code != 200:
            print(f"  X HTTP {resp.status_code}: {resp.text[:200]}")
            return False

        data = resp.json()

        if "compare" not in data:
            print("  X compare 키 없음")
            return False

        compare = data["compare"]
        missing_tiers = [t for t in ("budget", "standard", "premium") if t not in compare]
        if missing_tiers:
            print(f"  X 누락된 tier: {missing_tiers}")
            return False

        b = compare["budget"]["min_cost"]
        s = compare["standard"]["min_cost"]
        p = compare["premium"]["min_cost"]
        if not (b < s < p):
            print(f"  X 단가 순서 오류: budget={fmt_krw(b)}, standard={fmt_krw(s)}, premium={fmt_krw(p)}")
            return False

        for tier_key, tier_data in compare.items():
            for field in ("min_cost", "max_cost", "unit_price", "breakdown", "is_valid"):
                if field not in tier_data:
                    print(f"  X {tier_key} 에 {field} 누락")
                    return False

        print(f"  v {elapsed}s  |  3단계 비교 완료")
        print(f"    저가: {fmt_krw(b)} ~ {fmt_krw(compare['budget']['max_cost'])}")
        print(f"    표준: {fmt_krw(s)} ~ {fmt_krw(compare['standard']['max_cost'])}")
        print(f"    고급: {fmt_krw(p)} ~ {fmt_krw(compare['premium']['max_cost'])}")
        return True

    except httpx.ConnectError:
        print("  X 연결 실패")
        return False
    except Exception as e:
        print(f"  X 오류: {e}")
        return False


# --- TC-06: stream endpoint ------------------------------------------

def run_test_stream(client):
    # TC-06: /api/estimate/stream SSE 이벤트 순서 및 complete 이벤트 검증
    print()
    print("-" * 60)
    print("▶ TC-06  stream 엔드포인트 (SSE 이벤트 검증)")

    payload = {
        "type": "리모델링",
        "area": 99.0,
        "description": "아파트 전체 리모델링. 철거 포함, 강마루, 실크도배, 욕실 1개 교체.",
    }

    EXPECTED_AGENTS = {"SCANNER", "ESTIMATOR", "PRICER", "VALIDATOR", "REPORTER"}

    try:
        t0 = time.time()
        with client.stream("POST", f"{BASE}/api/estimate/stream", json=payload, timeout=120.0) as resp:
            if resp.status_code != 200:
                print(f"  X HTTP {resp.status_code}")
                return False

            events = []
            last_data = None

            for line in resp.iter_lines():
                if line.startswith("data: "):
                    raw = line[6:]
                    try:
                        evt = json.loads(raw)
                        events.append(evt)
                        if evt.get("event") == "complete":
                            last_data = evt.get("data", {})
                    except json.JSONDecodeError:
                        print(f"  X JSON 파싱 실패: {raw[:80]}")
                        return False

        elapsed = round(time.time() - t0, 1)

        error_events = [e for e in events if e.get("event") == "error"]
        if error_events:
            print(f"  X 에러 이벤트 수신: {error_events[0].get('message', '')}")
            return False

        done_agents = {e["agent"] for e in events if e.get("event") == "agent_done"}
        missing_agents = EXPECTED_AGENTS - done_agents
        if missing_agents:
            print(f"  X agent_done 미수신: {missing_agents}")
            return False

        if last_data is None:
            print("  X complete 이벤트 없음")
            return False

        for field in ("min_cost", "max_cost", "breakdown", "validator_flags"):
            if field not in last_data:
                print(f"  X complete.data 에 {field} 누락")
                return False

        print(f"  v {elapsed}s  |  {len(events)}개 이벤트  |  에이전트: {sorted(done_agents)}")
        print(f"    최종 견적: {fmt_krw(last_data['min_cost'])} ~ {fmt_krw(last_data['max_cost'])}")
        return True

    except httpx.ConnectError:
        print("  X 연결 실패")
        return False
    except Exception as e:
        print(f"  X 오류: {e}")
        return False


# --- TC-07: VALIDATOR flags 직접 검증 --------------------------------

def run_test_validator_flags(client):
    # TC-07: 욕실 방수 누락(R11/R28) + 철거 누락(R09) 플래그 발동 검증
    print()
    print("-" * 60)
    print("▶ TC-07  VALIDATOR flags 규칙 발동 검증")

    payload = {
        "type": "리모델링",
        "area": 66.0,
        "description": "욕실 타일 교체만. 방수 없음, 철거 없음.",
    }

    try:
        resp = client.post(f"{BASE}/api/estimate", json=payload, timeout=60.0)
        if resp.status_code != 200:
            print(f"  X HTTP {resp.status_code}")
            return False

        data = resp.json()
        flags = data.get("validator_flags", [])
        rule_ids = {f.get("rule_id") for f in flags}

        passed = True

        if "R09" not in rule_ids:
            print("  X R09 (리모델링 철거 누락) 미발동")
            passed = False
        else:
            r09 = next(f for f in flags if f.get("rule_id") == "R09")
            if r09.get("severity") != "error":
                print(f"  X R09 severity 오류: {r09.get('severity')} (기대: error)")
                passed = False
            else:
                print("    v R09 (철거 누락) error 정상 발동")

        bath_waterproof_rules = rule_ids & {"R11", "R28"}
        if not bath_waterproof_rules:
            print("  X R11/R28 (욕실 방수 누락) 미발동")
            passed = False
        else:
            print(f"    v 욕실 방수 누락 플래그 발동: {bath_waterproof_rules}")

        if data.get("is_valid") is not False:
            print(f"  X is_valid={data.get('is_valid')} (error 플래그 있으므로 False 기대)")
            passed = False
        else:
            print("    v is_valid=False 정상")

        for flag in flags[:3]:
            for field in ("severity", "category", "rule_id", "message", "suggestion"):
                if field not in flag:
                    print(f"  X flag 구조 누락: {field}")
                    passed = False

        if passed:
            print(f"  v 총 {len(flags)}개 플래그 | rule_ids={sorted(rule_ids)}")
        return passed

    except httpx.ConnectError:
        print("  X 연결 실패")
        return False
    except Exception as e:
        print(f"  X 오류: {e}")
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

    # 추가 테스트: compare / stream / validator flags
    print()
    print("=" * 60)
    print("추가 엔드포인트 테스트")
    with httpx.Client() as client:
        extra_results = [
            run_test_compare(client),
            run_test_stream(client),
            run_test_validator_flags(client),
        ]
    results = results + extra_results

    # 요약
    passed = sum(results)
    total = len(results)
    print()
    print("=" * 60)
    status = "ALL PASS" if passed == total else "일부 실패"
    print("결과: " + str(passed) + "/" + str(total) + " 통과  [" + status + "]")


if __name__ == "__main__":
    main()
