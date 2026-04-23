// 폼 입력 중간저장 / 복구 / 만료 처리
// 이미지/도면 base64는 용량이 커서 제외하고 메타만 저장한다.

const KEY = 'jh_estimate_v2_draft';
const EXPIRE_MS = 1000 * 60 * 60 * 24 * 14; // 14일

/** state에서 저장에 불필요한 필드를 제거해 경량화 */
function serialize(state) {
  if (!state) return null;
  return {
    savedAt: Date.now(),
    version: 2,
    step: state.step,
    inquiryId: state.inquiryId,
    createdAt: state.createdAt,
    customer: state.customer,
    space: state.space,
    site: state.site,
    scopes: state.scopes,
    finish: state.finish,
    schedule: state.schedule,
    additionalRequests: state.additionalRequests,
    // uploads는 메타만 (base64 제외 — 10MB+ 저장 방지)
    uploads: {
      photos: (state.uploads?.photos || []).map((f) => ({ name: f.name, type: f.type, size: f.size })),
      drawings: (state.uploads?.drawings || []).map((f) => ({ name: f.name, type: f.type, size: f.size })),
    },
  };
}

export function saveDraft(state) {
  if (typeof window === 'undefined') return;
  try {
    const data = serialize(state);
    if (!data) return;
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // quota/serialization 실패는 조용히 무시
  }
}

export function loadDraft() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 2) return null;
    if (typeof parsed.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > EXPIRE_MS) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** 저장된 draft가 "유의미한" 입력을 가지고 있는지 판정 */
export function isMeaningfulDraft(draft) {
  if (!draft) return false;
  const c = draft.customer || {};
  const s = draft.space || {};
  const sc = draft.scopes || {};
  if (c.customerName || c.phone || c.email) return true;
  if (s.spaceType || s.totalArea) return true;
  if (Array.isArray(sc.selected) && sc.selected.length > 0) return true;
  if (draft.step > 1) return true;
  return false;
}

/** 저장 시각을 "방금 전/3분 전/2시간 전" 스타일로 표시 */
export function formatSavedAgo(savedAt) {
  if (!savedAt) return '';
  const diff = Date.now() - savedAt;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}
