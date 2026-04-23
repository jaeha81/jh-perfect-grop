// 공정 계획 템플릿 — 공사 범위 기반으로 필터링되는 8단계

export const PROCESS_PHASES = [
  {
    key: 'prep',
    label: '현장 준비 및 가설',
    desc: '보양재 설치, 임시 전기/조명, 자재 반입 동선 확보',
    requires: [],
    durationRatio: 0.05,
  },
  {
    key: 'demolition',
    label: '철거',
    desc: '지정 구역 철거 + 폐기물 분리 반출',
    requires: ['철거공사'],
    durationRatio: 0.12,
  },
  {
    key: 'mep',
    label: '설비/전기 선행',
    desc: '배관·배선 매립, 분전반·냉난방 선행 시공',
    requires: ['전기공사', '설비공사', '냉난방공사'],
    anyOf: true,
    durationRatio: 0.18,
  },
  {
    key: 'carpentry',
    label: '목공/천장',
    desc: '천장 틀, 경량 벽체, 문틀·문선·걸레받이 하지',
    requires: ['목공사', '경량/천장공사'],
    anyOf: true,
    durationRatio: 0.18,
  },
  {
    key: 'finish_base',
    label: '벽/바닥/타일/도장',
    desc: '타일·필름·도배·도장·바닥재 마감',
    requires: ['도배공사', '도장공사', '타일공사', '필름공사', '바닥공사', '벽체공사'],
    anyOf: true,
    durationRatio: 0.22,
  },
  {
    key: 'lighting_furniture',
    label: '조명/가구 설치',
    desc: '조명기구·가구·주방·싱크·수전 설치',
    requires: ['조명공사', '가구공사', '제작가구'],
    anyOf: true,
    durationRatio: 0.12,
  },
  {
    key: 'external',
    label: '외부/간판/특수',
    desc: '외부 마감, 간판, 소방, 통신 등 특수공사',
    requires: ['외부공사', '간판공사', '소방공사', '통신/네트워크공사', '금속공사', '유리공사'],
    anyOf: true,
    durationRatio: 0.08,
  },
  {
    key: 'cleanup',
    label: '마감 정리/청소/인도',
    desc: '세부 보수, 입주 청소, 고객 인도 및 점검',
    requires: [],
    durationRatio: 0.05,
  },
];

/**
 * 선택된 공사 범위 기반으로 활성 공정 추출
 * @param {string[]} selectedScopes
 */
export function buildProcessPlan(selectedScopes = []) {
  return PROCESS_PHASES.filter((phase) => {
    if (phase.requires.length === 0) return true;
    if (phase.anyOf) return phase.requires.some((r) => selectedScopes.includes(r));
    return phase.requires.every((r) => selectedScopes.includes(r));
  });
}
