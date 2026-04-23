// 견적 보정 엔진 — 백엔드 PRICER 결과 + 폼 입력 → 저/표/고 비교 + 포함/별도/제외
// ⚠ 실시간 시장단가 API 사용 아님. 기본 단가 기반 자동 보정 로직.

import {
  SPACE_MULTIPLIERS,
  SUBTYPE_MULTIPLIERS,
  GRADE_MULTIPLIERS,
  BUILDING_STATUS_ADDERS,
  computeSiteMultiplier,
} from '@/data/estimate-multipliers';

/**
 * 백엔드 estimate 결과에 프론트 보정을 덧씌워 최종 리포트 데이터로 가공
 * @param {object} backendResult - /api/estimate/stream의 complete event data
 * @param {object} form - 전체 폼 상태
 * @returns {object} 리포트용 데이터
 */
export function enrichEstimate(backendResult, form) {
  const spaceM = SPACE_MULTIPLIERS[form.space.spaceType] ?? 1.0;
  const subtypeM = SUBTYPE_MULTIPLIERS[form.space.spaceSubtype] ?? 1.0;
  const { multiplier: siteM, factors: siteFactors } = computeSiteMultiplier(form.site);
  const buildingAdd = BUILDING_STATUS_ADDERS[form.space.buildingStatus] ?? 0;

  const compositeM = spaceM * subtypeM * siteM * (1 + buildingAdd);

  const baseMin = backendResult.min_cost || 0;
  const baseMax = backendResult.max_cost || baseMin;
  const adjMin = Math.round(baseMin * compositeM);
  const adjMax = Math.round(baseMax * compositeM);

  // 저/표/고 tier 산출
  const tiers = {
    budget: {
      key: 'budget',
      label: '저가형',
      min: Math.round(adjMin * GRADE_MULTIPLIERS.budget),
      max: Math.round(adjMax * GRADE_MULTIPLIERS.budget),
      desc: '가성비 중심, 기본 자재·마감',
      recommended: false,
    },
    standard: {
      key: 'standard',
      label: '표준형',
      min: adjMin,
      max: adjMax,
      desc: '실무 기본 사양 — 가장 현실적인 출발선',
      recommended: true,
    },
    premium: {
      key: 'premium',
      label: '고급형',
      min: Math.round(adjMin * GRADE_MULTIPLIERS.premium),
      max: Math.round(adjMax * GRADE_MULTIPLIERS.premium),
      desc: '브랜드 자재 + 상세 디테일 마감',
      recommended: false,
    },
  };

  // 사용자가 고른 등급에 따라 추천안 재지정
  const userGrade = form.finish.finishGrade;
  if (userGrade && tiers[userGrade]) {
    Object.values(tiers).forEach((t) => (t.recommended = false));
    tiers[userGrade].recommended = true;
  }

  // 포함/별도/제외 분류
  const inclusions = classifyItems(form, backendResult);

  // 공종별 세부 (백엔드 breakdown × compositeM)
  const breakdown = backendResult.breakdown || {};
  const detailedBreakdown = Object.fromEntries(
    Object.entries(breakdown).map(([k, v]) => [k, Math.round((v || 0) * compositeM)]),
  );

  return {
    inquiryId: backendResult.inquiryId,
    type: backendResult.type,
    area: form.space.totalArea,
    baseline: { min: baseMin, max: baseMax },
    adjustments: {
      spaceMultiplier: spaceM,
      subtypeMultiplier: subtypeM,
      siteMultiplier: siteM,
      buildingAdder: buildingAdd,
      compositeMultiplier: compositeM,
      siteFactors,
    },
    tiers,
    detailedBreakdown,
    inclusions,
    workItems: backendResult.work_items || [],
    summary: backendResult.summary,
    validatorFlags: backendResult.validator_flags || [],
    expertComment: backendResult.expert_comment,
    isValid: backendResult.is_valid !== false,
    scannerContext: backendResult.scanner_context,
    pdfBase64: backendResult.pdf_base64 || null,
    excelBase64: backendResult.excel_base64 || null,
  };
}

/** 포함/별도/제외 분류 로직 */
function classifyItems(form, backendResult) {
  const selected = form.scopes.selected || [];
  const specials = form.finish.specialItems || [];

  // 포함: 기본 공사 범위 중 별도항목으로 빠지지 않은 것
  const included = selected.filter((s) => !specials.some((sp) => normalizeMatch(sp, s)));

  // 별도: 사용자가 선택한 별도항목
  const separate = specials.slice();

  // 제외: 선택 안 한 주요 공종 + 고정 제외 항목
  const ALL_SCOPES = selected;
  const excluded = [];
  excluded.push('인허가·세무 비용 (별도 발생 시)');
  excluded.push('가전·가구 구매비(빌트인 외)');
  excluded.push('이사비·입주 청소 심화');
  if (!ALL_SCOPES.includes('소방공사')) excluded.push('소방 증설/소방필증 비용 (필요 시 별도)');
  if (!ALL_SCOPES.includes('샷시공사')) excluded.push('샷시/창호 교체 (미선택)');
  if (form.site.region && !['서울', '경기', '인천'].includes(form.site.region)) {
    excluded.push('지방 출장비/체류비 (현장 거리 따라 별도 협의)');
  }

  return { included, separate, excluded };
}

function normalizeMatch(a, b) {
  const na = String(a || '').replace(/\s+/g, '');
  const nb = String(b || '').replace(/\s+/g, '');
  return na === nb || na.includes(nb) || nb.includes(na);
}

/**
 * AI 분석 의견 생성 — 입력 기반 실무형 코멘트
 * 백엔드 expert_comment와 별개로 프론트에서 추가 인사이트 3~5줄 생성
 */
export function generateCommentary(form, enriched) {
  const comments = [];

  // 현장 여건 코멘트
  if (enriched.adjustments.siteFactors.length >= 3) {
    comments.push('현장 반입·작업 여건이 비용에 영향을 줄 수 있습니다. 방문 실측 시 구체적 반영이 가능합니다.');
  }
  if (form.site.isOperatingDuringConstruction) {
    comments.push('운영 중 공사는 야간/주말 투입, 구역 분리 시공이 필요해 일정과 인건비 상승 요소가 됩니다.');
  }
  if (form.site.hasElevator === false && Number(form.space.floorLevel) > 3) {
    comments.push('고층 + 엘리베이터 없음 조건은 자재 인양비 가산이 발생할 수 있습니다.');
  }

  // 마감 등급 코멘트
  const grade = form.finish.finishGrade;
  if (grade === 'budget') {
    comments.push('저가형은 가성비 중심이지만 자재 수명·교체 주기를 미리 고려하는 것이 좋습니다.');
  } else if (grade === 'premium') {
    comments.push('고급형은 브랜드 자재·마감 디테일의 완성도가 큰 차이를 만듭니다. 사양 표준화가 중요합니다.');
  } else {
    comments.push('표준형 구성이 가장 현실적인 시작안입니다. 이후 구역별 업그레이드가 유연합니다.');
  }

  // 일정 관련
  if (form.scopes.selected?.length >= 10) {
    comments.push('공사 범위가 넓으므로 공정 간 간섭을 줄이는 순서 설계가 품질의 핵심이 됩니다.');
  }

  // 사진/도면 업로드 여부
  if (!form.uploads.photos?.length && !form.uploads.drawings?.length) {
    comments.push('사진·도면이 함께 제공되면 현장 추정 정확도가 크게 향상됩니다.');
  }

  return comments.slice(0, 5);
}
