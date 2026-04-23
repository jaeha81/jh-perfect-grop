// 조건부 질문 선언형 config
// when(form) -> true 인 경우에만 questions 배열 노출

export const CONDITIONAL_QUESTIONS = [
  // ── 상업공간 + 음식점 ─────────────────────────────────────
  {
    id: 'restaurant_kitchen',
    when: (f) => f.space.spaceType === '상업공간' && f.space.spaceSubtype === '음식점',
    title: '음식점 세부 질문',
    questions: [
      { key: 'hasKitchenEquipment', label: '주방 설비 포함 여부', type: 'boolean' },
      { key: 'needsDuct',           label: '배기/덕트 필요 여부', type: 'boolean' },
      { key: 'needsGasWork',        label: '가스 공사 여부',      type: 'boolean' },
      { key: 'needsSanitary',       label: '위생/배수 설비',       type: 'boolean' },
    ],
  },
  // ── 상업공간 + 카페 ──────────────────────────────────────
  {
    id: 'cafe_counter',
    when: (f) => f.space.spaceType === '상업공간' && f.space.spaceSubtype === '카페',
    title: '카페 세부 질문',
    questions: [
      { key: 'hasBarCounter',       label: '바/카운터 제작 필요',   type: 'boolean' },
      { key: 'needsWaterLine',      label: '급수/배수 신설',        type: 'boolean' },
      { key: 'needsDuct',           label: '배기 필요(오븐/로스터)', type: 'boolean' },
    ],
  },
  // ── 주거공간 공통 ─────────────────────────────────────────
  {
    id: 'residential_detail',
    when: (f) => f.space.spaceType === '주거공간',
    title: '주거공간 세부 질문',
    questions: [
      { key: 'isFullRemodel',  label: '전체 리모델링 여부', type: 'boolean' },
      { key: 'bathroomCount',  label: '욕실 개수',          type: 'number', min: 0, max: 10 },
      { key: 'kitchenReplace', label: '주방 교체 여부',     type: 'boolean' },
      { key: 'sashReplace',    label: '샷시 교체 여부',     type: 'boolean' },
    ],
  },
  // ── 오피스 ────────────────────────────────────────────────
  {
    id: 'office_detail',
    when: (f) => f.space.spaceType === '오피스',
    title: '오피스 세부 질문',
    questions: [
      { key: 'meetingRoomCount', label: '회의실 개수',           type: 'number', min: 0, max: 20 },
      { key: 'needsGlassPartition', label: '유리 파티션 필요',   type: 'boolean' },
      { key: 'needsNetwork',     label: '네트워크/랜 공사 필요', type: 'boolean' },
    ],
  },
  // ── 병원/학교 공통(안전) ──────────────────────────────────
  {
    id: 'safety_spec',
    when: (f) => ['병원/의료시설', '학교/교육시설'].includes(f.space.spaceType),
    title: '안전/특수 기준',
    questions: [
      { key: 'needsSpecialSpec', label: '안전/특수 설비 기준 필요', type: 'boolean' },
      { key: 'isOperatingDuringWork', label: '운영 중 시공 여부',  type: 'boolean' },
      { key: 'noiseRestrictionLevel', label: '소음 제한 강도',     type: 'select',
        options: ['낮음', '보통', '강함', '매우 강함'] },
    ],
  },
  // ── 숙박/호텔 ─────────────────────────────────────────────
  {
    id: 'hotel_detail',
    when: (f) => f.space.spaceType === '숙박/호텔',
    title: '숙박시설 세부',
    questions: [
      { key: 'roomCount',     label: '객실 개수',            type: 'number', min: 0, max: 200 },
      { key: 'needsBathroomWet', label: '객실 욕실 습식 시공', type: 'boolean' },
      { key: 'needsFireSafety', label: '소방 기준 대응 필요', type: 'boolean' },
    ],
  },
  // ── 전기공사 선택 시 ──────────────────────────────────────
  {
    id: 'electric_scope',
    when: (f) => f.scopes.selected.includes('전기공사'),
    title: '전기 공사 범위',
    questions: [
      { key: 'electricScope', label: '전기 공사 범위', type: 'radio',
        options: ['기존 유지', '일부 증설', '전면 증설'] },
    ],
  },
  // ── 냉난방공사 선택 시 ────────────────────────────────────
  {
    id: 'hvac_scope',
    when: (f) => f.scopes.selected.includes('냉난방공사'),
    title: '냉난방 범위',
    questions: [
      { key: 'hvacScope', label: '냉난방 공사 범위', type: 'radio',
        options: ['기존 유지', '이설', '신규 설치'] },
    ],
  },
  // ── 철거공사 선택 시 ──────────────────────────────────────
  {
    id: 'demolition_scope',
    when: (f) => f.scopes.selected.includes('철거공사'),
    title: '철거 범위',
    questions: [
      { key: 'demolitionScope', label: '철거 범위', type: 'checkboxes',
        options: ['전체 철거', '부분 철거', '천장 철거', '바닥 철거', '폐기물 반출'] },
    ],
  },
];

/** 현재 form 기준으로 노출해야 할 조건부 그룹 목록 */
export function getActiveConditionalGroups(form) {
  return CONDITIONAL_QUESTIONS.filter((group) => {
    try {
      return group.when(form);
    } catch {
      return false;
    }
  });
}
