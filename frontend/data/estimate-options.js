// 견적 입력 폼 옵션 데이터 — 선택지/라벨 정의
// backend `type` Literal 3종과 매핑되는 내부 구조

export const SPACE_TYPES = [
  { value: '상업공간', label: '상업공간', desc: '매장·카페·음식점·미용실 등' },
  { value: '주거공간', label: '주거공간', desc: '아파트·단독주택·빌라·원룸' },
  { value: '오피스', label: '오피스', desc: '사무실·회의실·스튜디오' },
  { value: '학교/교육시설', label: '학교/교육시설', desc: '학원·강의실·도서관' },
  { value: '병원/의료시설', label: '병원/의료시설', desc: '의원·치과·한의원·수술실' },
  { value: '숙박/호텔', label: '숙박/호텔', desc: '호텔·모텔·게스트하우스' },
  { value: '공용공간/로비/복도', label: '공용공간', desc: '로비·복도·공용 휴게공간' },
  { value: '외부공간/파사드', label: '외부/파사드', desc: '건물 외벽·사인·조경' },
  { value: '기타', label: '기타', desc: '위에 해당하지 않는 공간' },
];

// 공간유형별 세부 용도 (조건부 노출용)
export const SPACE_SUBTYPES = {
  상업공간: ['음식점', '카페', '매장/판매', '미용실/뷰티', '학원', '기타 상업'],
  주거공간: ['아파트', '단독주택', '빌라/다세대', '원룸/오피스텔', '타운하우스'],
  오피스: ['일반 사무실', '스튜디오/크리에이터', '공유오피스', '상담실'],
  '학교/교육시설': ['학원', '강의실', '도서관', '기타 교육'],
  '병원/의료시설': ['의원/한의원', '치과', '피부/성형', '수술실/특수'],
  '숙박/호텔': ['호텔', '모텔', '게스트하우스', '펜션'],
  '공용공간/로비/복도': ['로비', '복도', '휴게공간', '엘리베이터 홀'],
  '외부공간/파사드': ['외벽', '파사드/사인', '조경', '외부 덱'],
  기타: ['기타'],
};

// 공간유형 → 백엔드 `type` 매핑 (기존 3종 Literal로 축소)
export function mapSpaceTypeToBackend(spaceType) {
  if (spaceType === '주거공간') return '인테리어';
  if (spaceType === '외부공간/파사드') return '신축';
  return '리모델링';
}

export const CONSULTATION_PURPOSES = [
  '신축 준비',
  '리모델링/인테리어 준비',
  '부분 공사 문의',
  '시세/예산 파악',
  '여러 업체 비교',
  '기타',
];

export const BUDGET_RANGES = [
  { value: 'under_1k', label: '1천만원 이하' },
  { value: '1k_3k', label: '1천~3천만원' },
  { value: '3k_5k', label: '3천~5천만원' },
  { value: '5k_1e', label: '5천만원~1억' },
  { value: '1e_2e', label: '1억~2억' },
  { value: 'over_2e', label: '2억 이상' },
  { value: 'undecided', label: '아직 미정' },
];

export const CONTACT_PREFERENCES = [
  '전화 통화',
  '문자/카카오톡',
  '이메일',
  '현장 방문 상담',
];

export const PRIORITY_FOCUS = [
  '비용 절감',
  '시공 품질',
  '디자인/감성',
  '유지 관리',
  '빠른 시공',
  '친환경/건강',
];

export const BUILDING_STATUS = ['신축 건물', '기존 건물(5년 이내)', '기존 건물(10년 이상)', '노후 건물(20년 이상)', '잘 모름'];
export const OCCUPANCY_STATUS = ['공실', '운영 중(계속 영업)', '거주 중', '부분 사용', '빈 상태로 전달 예정'];
export const FINISH_CONDITION = ['전체 철거 필요', '부분 유지 + 부분 교체', '유지 + 덧방/보강', '골조만 있음(민짜)', '잘 모름'];
export const SITE_VISIT_STATUS = ['현장 방문 전', '예비 방문 완료', '실측 완료', '방문 필요'];

export const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

export const LOADING_DIFFICULTY = ['매우 쉬움(1층/도로접)', '쉬움', '보통', '어려움', '매우 어려움(고층/좁은 골목)'];
export const PARKING_ACCESS = ['전용 주차 가능', '건물 주차장 이용', '노상 주차 가능', '하차만 가능', '주차 불가'];
export const DUST_NOISE_RESTRICTION = ['제한 없음', '주간만 허용', '저소음만 허용', '강한 제한(운영/입주 중)'];
export const WASTE_LEVEL = ['소량', '보통', '대량', '잘 모름'];
export const COMPLAINT_RISK = ['낮음', '보통', '높음(운영/거주 건물)', '매우 높음(학교/병원 인접)'];

// 공사 범위 — 25종
export const WORK_SCOPES = [
  { key: '철거공사',          group: '기초' },
  { key: '가설공사',          group: '기초' },
  { key: '목공사',            group: '구조/마감' },
  { key: '경량/천장공사',     group: '구조/마감' },
  { key: '전기공사',          group: '설비' },
  { key: '설비공사',          group: '설비' },
  { key: '냉난방공사',        group: '설비' },
  { key: '도장공사',          group: '마감' },
  { key: '필름공사',          group: '마감' },
  { key: '타일공사',          group: '마감' },
  { key: '바닥공사',          group: '마감' },
  { key: '벽체공사',          group: '마감' },
  { key: '도배공사',          group: '마감' },
  { key: '금속공사',          group: '특수' },
  { key: '유리공사',          group: '특수' },
  { key: '조명공사',          group: '설비' },
  { key: '가구공사',          group: '가구' },
  { key: '제작가구',          group: '가구' },
  { key: '간판공사',          group: '외부' },
  { key: '외부공사',          group: '외부' },
  { key: '방수공사',          group: '특수' },
  { key: '샷시공사',          group: '창호' },
  { key: '소방공사',          group: '특수' },
  { key: '통신/네트워크공사', group: '설비' },
  { key: '기타 특수공사',     group: '특수' },
];

// 마감 등급
export const FINISH_GRADES = [
  { value: 'budget',   label: '저가형',  desc: '가성비 우선, 기본 마감' },
  { value: 'standard', label: '표준형',  desc: '실무 기본 사양 — 가장 추천' },
  { value: 'premium',  label: '고급형',  desc: '브랜드 자재 + 디테일 마감' },
  { value: 'custom',   label: '맞춤형',  desc: '일부 구역만 고급, 나머지 표준' },
];

// 별도항목 — 일반 견적에서 분리 표기되는 항목
export const SPECIAL_ITEMS = [
  '전기 증설',
  '냉난방 신규 설치',
  '냉난방 이설',
  '제작 가구',
  '외부 공사',
  '간판 공사',
  '소방 공사',
  '통신/네트워크',
  'CCTV',
  '음향 시스템',
  '방수 공사',
  '샷시/유리',
  '구조 보강',
  '인허가 대응',
  '특수 청소',
  '야간/주말 공사 추가비',
];

// 공사 시간대
export const WORK_TIMEFRAMES = ['주간(09~18시)', '연장(08~20시)', '주간+주말', '야간(22시 이후)', '24시간 가능'];

// 일정 우선 기준
export const SCHEDULE_PRIORITIES = ['품질 우선(일정 유연)', '일정 최우선(압축 가능)', '비용 최우선(일정 무관)', '운영 지장 최소화'];
