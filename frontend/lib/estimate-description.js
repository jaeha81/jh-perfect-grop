// 구조화된 폼 데이터 → 백엔드 `description` 자연어 문자열 조합
// 기존 ESTIMATOR/PRICER 파이프라인이 키워드 추출로 동작하므로,
// 문자열에 공종 키워드가 충분히 포함되도록 만든다.

export function buildBackendDescription(form) {
  const parts = [];

  // 공간 기본
  const { space } = form;
  const subtype = space.spaceSubtype ? `/${space.spaceSubtype}` : '';
  parts.push(`${space.spaceType}${subtype} ${space.totalArea}m² 공사`);

  if (space.ceilingHeight) parts.push(`천장높이 ${space.ceilingHeight}m`);
  if (space.buildingStatus && space.buildingStatus !== '잘 모름') parts.push(space.buildingStatus);
  if (space.occupancyStatus) parts.push(`상태: ${space.occupancyStatus}`);
  if (space.finishCondition) parts.push(`현 마감: ${space.finishCondition}`);

  // 공사 범위 (키워드)
  if (form.scopes.selected.length) {
    parts.push(`공사범위: ${form.scopes.selected.join(', ')}`);
  }

  // 조건부 답변 중 핵심
  const c = form.scopes.conditional || {};
  if (c.electricScope)  parts.push(`전기: ${c.electricScope}`);
  if (c.hvacScope)      parts.push(`냉난방: ${c.hvacScope}`);
  if (c.demolitionScope?.length) parts.push(`철거: ${c.demolitionScope.join(',')}`);
  if (c.bathroomCount)  parts.push(`욕실 ${c.bathroomCount}개`);
  if (c.kitchenReplace) parts.push('주방 교체');
  if (c.sashReplace)    parts.push('샷시 교체');
  if (c.meetingRoomCount) parts.push(`회의실 ${c.meetingRoomCount}개`);
  if (c.needsGlassPartition) parts.push('유리 파티션');
  if (c.needsDuct)       parts.push('배기/덕트');
  if (c.needsGasWork)    parts.push('가스 공사');
  if (c.hasKitchenEquipment) parts.push('주방 설비');
  if (c.needsSanitary)   parts.push('위생/배수');

  // 마감 등급 + 별도항목
  if (form.finish.finishGrade) {
    const gradeLabel = { budget: '저가형', standard: '표준형', premium: '고급형', custom: '맞춤형' }[form.finish.finishGrade];
    parts.push(`마감등급: ${gradeLabel}`);
  }
  if (form.finish.specialItems?.length) {
    parts.push(`별도항목: ${form.finish.specialItems.join(', ')}`);
  }
  if (form.finish.priorityFocus?.length) {
    parts.push(`우선: ${form.finish.priorityFocus.join('/')}`);
  }

  // 추가 요청사항
  if (form.additionalRequests) parts.push(`추가요청: ${form.additionalRequests}`);

  return parts.join(' · ');
}

/** 결과 리포트 전용 — 상담 시 사용할 요약 블록 */
export function buildInquirySummary(form) {
  return {
    customerName: form.customer.customerName || '미입력',
    phone: form.customer.phone || '',
    email: form.customer.email || '',
    address: form.customer.address || '',
    spaceType: form.space.spaceType,
    spaceSubtype: form.space.spaceSubtype,
    area: form.space.totalArea,
    preferredStart: form.customer.preferredStartDate,
    preferredEnd: form.customer.preferredEndDate,
    priorityFocus: form.finish.priorityFocus,
  };
}
