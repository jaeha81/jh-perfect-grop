// 입력 필드 검증 함수 모음

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9-+() ]{9,20}$/;

export function isValidEmail(v) {
  if (!v) return false;
  return EMAIL_RE.test(v.trim());
}

export function isValidPhone(v) {
  if (!v) return false;
  return PHONE_RE.test(v.trim());
}

export function isPositiveNumber(v) {
  if (v === null || v === undefined || v === '') return false;
  const n = Number(v);
  return !Number.isNaN(n) && n > 0;
}

export function isNonEmpty(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * 단계별 검증 — 각 단계 "다음" 버튼 활성화 여부
 * @param {number} step - 1~7
 * @param {object} form
 * @returns {{ ok: boolean, messages: string[] }}
 */
export function validateStep(step, form) {
  const msgs = [];

  if (step === 1) {
    // 고객 기본정보 — 이름/연락처 필수
    if (!isNonEmpty(form.customer.customerName)) msgs.push('고객명을 입력해 주세요.');
    if (!isValidPhone(form.customer.phone))      msgs.push('연락처 형식이 올바르지 않습니다.');
    if (form.customer.email && !isValidEmail(form.customer.email))
      msgs.push('이메일 형식이 올바르지 않습니다.');
  }

  if (step === 2) {
    if (!isNonEmpty(form.space.spaceType))  msgs.push('공간 유형을 선택해 주세요.');
    if (!isPositiveNumber(form.space.totalArea)) msgs.push('총 면적을 숫자로 입력해 주세요.');
  }

  if (step === 3) {
    if (!isNonEmpty(form.site.region)) msgs.push('지역을 선택해 주세요.');
  }

  if (step === 4) {
    if (!form.scopes.selected || form.scopes.selected.length === 0) {
      msgs.push('공사 범위를 1개 이상 선택해 주세요.');
    }
  }

  if (step === 5) {
    if (!isNonEmpty(form.finish.finishGrade)) msgs.push('마감 등급을 선택해 주세요.');
  }

  // step 6(일정/업로드)은 모두 선택사항

  return { ok: msgs.length === 0, messages: msgs };
}

/** 업로드 파일 타입/크기 검증 */
export function validateUpload(file) {
  if (!file) return { ok: false, reason: '파일이 없습니다.' };
  const MAX = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX) return { ok: false, reason: '파일 크기는 10MB 이하여야 합니다.' };
  const okTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!okTypes.includes(file.type)) return { ok: false, reason: '지원: JPG/PNG/WEBP/PDF' };
  return { ok: true };
}
