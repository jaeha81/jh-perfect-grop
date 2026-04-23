// 금액·기간·날짜 포맷 유틸

export function formatKRW(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return Math.round(n).toLocaleString('ko-KR') + '원';
}

/** 큰 금액을 "1,234만원" "1.2억" 단위로 간결 표기 */
export function formatKRWShort(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  const abs = Math.abs(n);
  if (abs >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, '') + '억';
  if (abs >= 1e4) return Math.round(n / 1e4).toLocaleString('ko-KR') + '만';
  return Math.round(n).toLocaleString('ko-KR');
}

export function formatArea(m2) {
  if (!m2) return '-';
  const pyeong = (Number(m2) / 3.3058).toFixed(1);
  return `${m2}m² (약 ${pyeong}평)`;
}

export function formatDays(days) {
  if (!days || days <= 0) return '-';
  if (days < 7) return `${days}일`;
  const weeks = (days / 7).toFixed(1).replace(/\.0$/, '');
  return `약 ${weeks}주 (${days}일)`;
}

export function formatDate(iso) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}

export function maskPhone(v) {
  if (!v) return '';
  const digits = v.replace(/\D/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return v;
}

/** inquiryId 생성 — `INQ-YYMMDD-xxx` */
export function generateInquiryId() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 900 + 100);
  return `INQ-${yy}${mm}${dd}-${rand}`;
}
