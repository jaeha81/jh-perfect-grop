// 견적 보정 계수 테이블 — 프론트 내부 "설명 가능한 임시 산출 로직"
// ⚠ 실시간 시장단가 API가 아니라 기본 단가 기반 자동 보정임을 명확히 한다.

// 공간 유형별 난이도/자재 기준 계수 (base = 1.0 = 주거공간 표준)
export const SPACE_MULTIPLIERS = {
  '주거공간':            1.00,
  '오피스':              1.08,
  '상업공간':            1.18,
  '공용공간/로비/복도':  1.10,
  '학교/교육시설':       1.22,
  '병원/의료시설':       1.35,
  '숙박/호텔':           1.25,
  '외부공간/파사드':     1.15,
  '기타':                1.05,
};

// 세부 용도 추가 계수 (공간유형 계수에 곱해짐)
export const SUBTYPE_MULTIPLIERS = {
  // 상업
  '음식점':     1.10,
  '카페':       1.05,
  // 병원
  '수술실/특수':1.25,
  '피부/성형':  1.10,
  // 호텔
  '호텔':       1.08,
  // 주거
  '단독주택':   1.05,
};

// 현장 여건 추가 계수 (곱산)
export const SITE_CONDITION_ADDERS = {
  noElevator:               0.05,   // 엘리베이터 없음
  hardLoading:              0.07,   // 반입 난이도 어려움/매우 어려움
  noParking:                0.03,   // 주차 불가
  nightWork:                0.15,   // 야간 작업 필요
  weekendWork:              0.08,   // 주말 작업 필요
  operatingDuringWork:      0.12,   // 운영 중 공사
  strongDustNoise:          0.08,   // 강한 소음/분진 제한
  highComplaintRisk:        0.05,   // 민원 가능성 높음
  highWaste:                0.04,   // 폐기물 대량
  specialEquipment:         0.06,   // 외부 장비 필요(크레인 등)
};

// 마감 등급 계수
export const GRADE_MULTIPLIERS = {
  budget:   0.78,
  standard: 1.00,
  premium:  1.38,
  custom:   1.20,
};

// 건물 상태 계수
export const BUILDING_STATUS_ADDERS = {
  '신축 건물':             -0.05,
  '기존 건물(5년 이내)':    0.00,
  '기존 건물(10년 이상)':   0.03,
  '노후 건물(20년 이상)':   0.08,
  '잘 모름':                0.00,
};

// 일정 압축 임계 — 권장일 대비 짧을수록 리스크
export const SCHEDULE_RISK = {
  normal:   { threshold: 1.0,  label: '여유 있음',     addPct: 0.00 },
  moderate: { threshold: 0.85, label: '보통',          addPct: 0.03 },
  tight:    { threshold: 0.70, label: '압축',          addPct: 0.08 },
  critical: { threshold: 0.55, label: '매우 압축',      addPct: 0.15 },
};

/**
 * 현장 여건 계수 총합 계산
 * @param {object} site - form.site
 * @returns {{ multiplier: number, factors: Array<{label: string, pct: number}> }}
 */
export function computeSiteMultiplier(site) {
  const factors = [];
  let add = 0;

  if (site.hasElevator === false) {
    add += SITE_CONDITION_ADDERS.noElevator;
    factors.push({ label: '엘리베이터 없음', pct: SITE_CONDITION_ADDERS.noElevator });
  }
  if (['어려움', '매우 어려움(고층/좁은 골목)'].includes(site.loadingDifficulty)) {
    add += SITE_CONDITION_ADDERS.hardLoading;
    factors.push({ label: '자재 반입 난이도', pct: SITE_CONDITION_ADDERS.hardLoading });
  }
  if (site.parkingAccess === '주차 불가') {
    add += SITE_CONDITION_ADDERS.noParking;
    factors.push({ label: '주차 불가', pct: SITE_CONDITION_ADDERS.noParking });
  }
  if (site.needsNightWork) {
    add += SITE_CONDITION_ADDERS.nightWork;
    factors.push({ label: '야간 작업', pct: SITE_CONDITION_ADDERS.nightWork });
  }
  if (site.needsWeekendWork) {
    add += SITE_CONDITION_ADDERS.weekendWork;
    factors.push({ label: '주말 작업', pct: SITE_CONDITION_ADDERS.weekendWork });
  }
  if (site.isOperatingDuringConstruction) {
    add += SITE_CONDITION_ADDERS.operatingDuringWork;
    factors.push({ label: '운영 중 공사', pct: SITE_CONDITION_ADDERS.operatingDuringWork });
  }
  if (['저소음만 허용', '강한 제한(운영/입주 중)'].includes(site.dustNoiseRestriction)) {
    add += SITE_CONDITION_ADDERS.strongDustNoise;
    factors.push({ label: '소음/분진 제한', pct: SITE_CONDITION_ADDERS.strongDustNoise });
  }
  if (['높음(운영/거주 건물)', '매우 높음(학교/병원 인접)'].includes(site.complaintRisk)) {
    add += SITE_CONDITION_ADDERS.highComplaintRisk;
    factors.push({ label: '민원 가능성', pct: SITE_CONDITION_ADDERS.highComplaintRisk });
  }
  if (site.wasteLevel === '대량') {
    add += SITE_CONDITION_ADDERS.highWaste;
    factors.push({ label: '폐기물 대량', pct: SITE_CONDITION_ADDERS.highWaste });
  }
  if (site.specialEquipmentNeed) {
    add += SITE_CONDITION_ADDERS.specialEquipment;
    factors.push({ label: '외부 장비 필요', pct: SITE_CONDITION_ADDERS.specialEquipment });
  }

  return { multiplier: 1.0 + add, factors };
}
