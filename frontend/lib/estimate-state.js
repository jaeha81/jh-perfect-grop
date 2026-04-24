// 견적 폼 상태 초기값 및 reducer
import { generateInquiryId } from './estimate-formatters';

export const STEPS = {
  LANDING: 0,
  CUSTOMER: 1,
  SPACE: 2,
  SITE: 3,
  SCOPES: 4,
  FINISH: 5,
  SCHEDULE: 6,
  ANALYZING: 7,
  RESULT: 8,
};

export const STEP_LABELS = [
  { step: 1, label: '고객 정보' },
  { step: 2, label: '공간 정보' },
  { step: 3, label: '현장 여건' },
  { step: 4, label: '공사 범위' },
  { step: 5, label: '마감/별도' },
  { step: 6, label: '일정/업로드' },
];

export function createInitialState() {
  return {
    step: STEPS.LANDING,
    inquiryId: generateInquiryId(),
    createdAt: new Date().toISOString(),
    customer: {
      customerName: '',
      phone: '',
      email: '',
      address: '',
      consultationPurpose: '',
      budgetRange: '',
      preferredStartDate: '',
      preferredEndDate: '',
      contactPreference: '',
    },
    space: {
      spaceType: '',
      spaceSubtype: '',
      totalArea: '',
      usableArea: '',
      floorLevel: '',
      ceilingHeight: '',
      buildingStatus: '',
      occupancyStatus: '',
      finishCondition: '',
      siteVisitStatus: '',
    },
    site: {
      region: '',
      hasElevator: null,
      hasFreightElevator: null,
      loadingDifficulty: '',
      parkingAccess: '',
      needsNightWork: false,
      needsWeekendWork: false,
      isOperatingDuringConstruction: false,
      dustNoiseRestriction: '',
      wasteLevel: '',
      specialEquipmentNeed: false,
      complaintRisk: '',
    },
    scopes: {
      selected: [],
      conditional: {},
    },
    finish: {
      finishGrade: 'standard',
      priorityFocus: [],
      specialItems: [],
      roomFinishOptions: {},
    },
    schedule: {
      preferredStartDate: '',
      preferredEndDate: '',
      openingDate: '',
      workTimeframe: '',
      schedulePriority: '',
      priorityZone: '',
    },
    uploads: {
      photos: [],    // 현장사진 (JPG/PNG/WEBP)
      drawings: [],  // 도면/PDF (PDF/JPG/PNG)
      sketches: [],  // 손그림/스케치 (JPG/PNG)
    },
    additionalRequests: '',
    result: null,       // enriched result
    rawResult: null,    // backend raw
    loading: false,
    error: '',
    agentProgress: {
      activeStep: -1,
      doneSteps: [],
      parallelSteps: [],
    },
    status: '접수',      // 접수/분석중/상담대기/현장방문필요/견적완료/계약전환/보류
  };
}

export function estimateReducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return createInitialState();

    case 'HYDRATE': {
      // draft가 있는 필드만 덮어쓰기 (unknown 키는 무시)
      const base = createInitialState();
      const d = action.draft || {};
      return {
        ...base,
        step: typeof d.step === 'number' ? d.step : base.step,
        inquiryId: d.inquiryId || base.inquiryId,
        createdAt: d.createdAt || base.createdAt,
        customer: { ...base.customer, ...(d.customer || {}) },
        space: { ...base.space, ...(d.space || {}) },
        site: { ...base.site, ...(d.site || {}) },
        scopes: {
          selected: Array.isArray(d.scopes?.selected) ? d.scopes.selected : base.scopes.selected,
          conditional: { ...base.scopes.conditional, ...(d.scopes?.conditional || {}) },
        },
        finish: { ...base.finish, ...(d.finish || {}) },
        schedule: { ...base.schedule, ...(d.schedule || {}) },
        // uploads base64는 draft에 저장되지 않음 — 빈 배열로 리셋
        uploads: { photos: [], drawings: [], sketches: [] },
        additionalRequests: d.additionalRequests || '',
      };
    }
    case 'GOTO_STEP':
      return { ...state, step: action.step };
    case 'NEXT_STEP':
      return { ...state, step: state.step + 1 };
    case 'PREV_STEP':
      return { ...state, step: Math.max(0, state.step - 1) };

    case 'UPDATE_FIELD': {
      const { group, field, value } = action;
      if (group === '_root') return { ...state, [field]: value };
      return { ...state, [group]: { ...state[group], [field]: value } };
    }

    case 'TOGGLE_SCOPE': {
      const { scope } = action;
      const curr = state.scopes.selected;
      const next = curr.includes(scope) ? curr.filter((s) => s !== scope) : [...curr, scope];
      return { ...state, scopes: { ...state.scopes, selected: next } };
    }

    case 'SET_CONDITIONAL': {
      const { key, value } = action;
      return {
        ...state,
        scopes: { ...state.scopes, conditional: { ...state.scopes.conditional, [key]: value } },
      };
    }

    case 'TOGGLE_CONDITIONAL_CHECKBOX': {
      const { key, option } = action;
      const curr = Array.isArray(state.scopes.conditional[key]) ? state.scopes.conditional[key] : [];
      const next = curr.includes(option) ? curr.filter((v) => v !== option) : [...curr, option];
      return {
        ...state,
        scopes: { ...state.scopes, conditional: { ...state.scopes.conditional, [key]: next } },
      };
    }

    case 'TOGGLE_SPECIAL': {
      const { item } = action;
      const curr = state.finish.specialItems;
      const next = curr.includes(item) ? curr.filter((s) => s !== item) : [...curr, item];
      return { ...state, finish: { ...state.finish, specialItems: next } };
    }

    case 'TOGGLE_PRIORITY': {
      const { item } = action;
      const curr = state.finish.priorityFocus;
      const next = curr.includes(item) ? curr.filter((s) => s !== item) : [...curr, item];
      return { ...state, finish: { ...state.finish, priorityFocus: next } };
    }

    case 'ADD_UPLOAD': {
      const { kind, file } = action; // kind: 'photos' | 'drawings' | 'sketches'
      const bucket = state.uploads[kind] || [];
      return {
        ...state,
        uploads: { ...state.uploads, [kind]: [...bucket, file] },
      };
    }
    case 'REMOVE_UPLOAD': {
      const { kind, index } = action;
      const bucket = state.uploads[kind] || [];
      return {
        ...state,
        uploads: { ...state.uploads, [kind]: bucket.filter((_, i) => i !== index) },
      };
    }

    case 'SET_LOADING':
      return { ...state, loading: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.message || '' };

    case 'AGENT_START':
      return {
        ...state,
        agentProgress: {
          ...state.agentProgress,
          activeStep: action.step,
          parallelSteps: action.parallel
            ? [...new Set([...state.agentProgress.parallelSteps, action.step])]
            : state.agentProgress.parallelSteps,
        },
      };
    case 'AGENT_DONE':
      return {
        ...state,
        agentProgress: {
          ...state.agentProgress,
          doneSteps: [...new Set([...state.agentProgress.doneSteps, action.step])],
          activeStep: action.step + 1,
        },
      };
    case 'AGENT_RESET':
      return {
        ...state,
        agentProgress: { activeStep: -1, doneSteps: [], parallelSteps: [] },
      };

    case 'SET_RESULT':
      return {
        ...state,
        rawResult: action.raw,
        result: action.enriched,
        status: '견적완료',
        step: STEPS.RESULT,
        agentProgress: { activeStep: -1, doneSteps: [0, 1, 2, 3, 4], parallelSteps: state.agentProgress.parallelSteps },
      };

    case 'UPDATE_REPORT_FILES':
      if (!state.result) return state;
      return {
        ...state,
        result: {
          ...state.result,
          pdfBase64: action.pdfBase64 ?? state.result.pdfBase64,
          excelBase64: action.excelBase64 ?? state.result.excelBase64,
        },
      };

    default:
      return state;
  }
}
