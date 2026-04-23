// 공사 일정/공정 추정 로직 — 면적·공사범위 기반

import { buildProcessPlan, PROCESS_PHASES } from '@/data/estimate-process-plan';

/**
 * 면적·공사범위 → 권장 총 공사 일수
 * 실무 관행: 주거 30평 풀 리모델링 기준 약 35일
 */
function estimateBaseDays(area, selectedScopes) {
  const a = Number(area) || 0;
  if (!a) return 0;

  // 기본 일수: m² 기준 계수 × 면적
  // 소규모(30m² 이하)는 최소 7일, 대규모(300m² 이상)는 로그 감쇠
  let base;
  if (a <= 30)      base = Math.max(7, Math.round(a * 0.5));
  else if (a <= 100) base = Math.round(15 + (a - 30) * 0.35);
  else if (a <= 300) base = Math.round(40 + (a - 100) * 0.12);
  else               base = Math.round(64 + Math.log10(a / 300 + 1) * 20);

  // 공종 개수에 따라 가산
  const scopeCount = (selectedScopes || []).length;
  const scopeAdder = Math.min(scopeCount * 1.2, 18);

  return Math.round(base + scopeAdder);
}

/**
 * 일정 리스크 계산 — 권장일 vs 희망일
 * @param {number} recommendedDays
 * @param {string} startISO
 * @param {string} endISO
 * @returns {{ level: string, label: string, message: string }}
 */
function computeScheduleRisk(recommendedDays, startISO, endISO) {
  if (!startISO || !endISO) {
    return { level: 'unknown', label: '일정 미입력', message: '희망 착공/완료일을 입력하면 일정 적정성을 진단해 드립니다.' };
  }
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { level: 'unknown', label: '일정 확인 필요', message: '입력된 일정 형식을 확인해 주세요.' };
  }
  const actual = Math.round((end - start) / 86400000);
  if (actual <= 0) {
    return { level: 'critical', label: '일정 역전', message: '완료일이 착공일보다 빠릅니다. 다시 확인이 필요합니다.' };
  }
  const ratio = actual / recommendedDays;
  if (ratio >= 1.1) return { level: 'normal',   label: '여유 있음',   message: '권장 공사기간 대비 여유가 충분합니다.' };
  if (ratio >= 0.9) return { level: 'moderate', label: '보통',        message: '권장 공사기간과 유사한 일정입니다.' };
  if (ratio >= 0.7) return { level: 'tight',    label: '압축',        message: '권장 대비 일정이 타이트합니다. 공정 간섭이 발생할 수 있습니다.' };
  return                    { level: 'critical', label: '매우 압축',   message: '권장 대비 일정이 매우 짧습니다. 야간/주말 투입 또는 공종 분리 시공 검토가 필요합니다.' };
}

/**
 * 최종 일정 데이터 생성
 */
export function buildScheduleInfo(form) {
  const scopes = form.scopes.selected || [];
  const recommendedDays = estimateBaseDays(form.space.totalArea, scopes);

  const phases = buildProcessPlan(scopes);
  // durationRatio 재정규화 (활성 phases 합 = 1.0)
  const sumRatio = phases.reduce((s, p) => s + p.durationRatio, 0) || 1;
  const phasesWithDays = phases.map((p) => ({
    ...p,
    days: Math.max(1, Math.round((p.durationRatio / sumRatio) * recommendedDays)),
  }));

  const risk = computeScheduleRisk(
    recommendedDays,
    form.schedule.preferredStartDate,
    form.schedule.preferredEndDate,
  );

  return {
    recommendedDays,
    preferredStartDate: form.schedule.preferredStartDate,
    preferredEndDate: form.schedule.preferredEndDate,
    openingDate: form.schedule.openingDate,
    workTimeframe: form.schedule.workTimeframe,
    schedulePriority: form.schedule.schedulePriority,
    risk,
    phases: phasesWithDays,
    totalPhases: PROCESS_PHASES.length,
  };
}
