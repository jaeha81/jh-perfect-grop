'use client';
import { useState } from 'react';

export default function ResultActions({ enriched, onReset, customer }) {
  const [modal, setModal] = useState(null); // null | 'consult' | 'visit'
  const [submitState, setSubmitState] = useState('idle'); // idle | submitting | ok | error
  const [submitResult, setSubmitResult] = useState(null);
  const [note, setNote] = useState('');

  const customerPhone = customer?.phone || '';

  function downloadPdf() {
    if (!enriched?.pdfBase64) {
      alert('PDF가 준비되지 않았습니다. 네트워크 상태를 확인하거나 다시 계산해 주세요.');
      return;
    }
    const blob = new Blob([Uint8Array.from(atob(enriched.pdfBase64), (c) => c.charCodeAt(0))], {
      type: 'application/pdf',
    });
    const url = URL.createObjectURL(blob);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(url, '_blank');
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = `JH견적서_${enriched.inquiryId || '견적'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  function downloadExcel() {
    if (!enriched?.excelBase64) return;
    const blob = new Blob([Uint8Array.from(atob(enriched.excelBase64), (c) => c.charCodeAt(0))], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JH견적서_${enriched.inquiryId || '견적'}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function openModal(kind) {
    setModal(kind);
    setSubmitState('idle');
    setSubmitResult(null);
    setNote('');
  }

  function closeModal() {
    setModal(null);
    setSubmitState('idle');
    setSubmitResult(null);
    setNote('');
  }

  async function submitInquiry() {
    if (submitState === 'submitting') return;
    setSubmitState('submitting');
    try {
      const body = {
        inquiry_id: enriched?.inquiryId || null,
        kind: modal === 'visit' ? 'visit' : 'consult',
        customer_name: customer?.customerName || null,
        customer_phone: customer?.phone || null,
        email: customer?.email || null,
        address: customer?.address || null,
        space_type: enriched?.type || null,
        area: enriched?.area ? Number(enriched.area) : null,
        note: note || null,
      };
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
      const data = await res.json();
      setSubmitResult(data);
      setSubmitState('ok');
    } catch (err) {
      setSubmitResult({ error: err?.message || '알 수 없는 오류' });
      setSubmitState('error');
    }
  }

  return (
    <div className="bg-[#13131a] border border-white/[0.07] rounded-2xl p-6 sm:p-8 mb-8">
      <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-1">
        다음 단계
      </div>
      <div className="text-[#6b6a80] text-[0.82rem] mb-5">
        상담 연계 또는 견적 저장을 원하시면 아래 버튼을 이용해 주세요.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <ActionButton
          label="📞 상담 요청하기"
          desc="전문가가 입력 정보를 바탕으로 연락드립니다."
          primary
          onClick={() => openModal('consult')}
        />
        <ActionButton
          label="🗓 현장 방문 상담 예약"
          desc="정확한 견적은 실측이 정답입니다."
          onClick={() => openModal('visit')}
        />
        <ActionButton
          label="↓ 견적서 PDF 저장"
          desc={enriched?.pdfBase64 ? '분석 결과를 PDF로 저장합니다.' : '준비 중'}
          onClick={downloadPdf}
          disabled={!enriched?.pdfBase64}
        />
        <ActionButton
          label="↓ 견적서 Excel 저장"
          desc={enriched?.excelBase64 ? '세부 내역을 엑셀로 받아보세요.' : '준비 중'}
          onClick={downloadExcel}
          disabled={!enriched?.excelBase64}
        />
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={onReset}
          className="w-full py-3 rounded-xl text-[0.9rem] font-semibold"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#a09eb8',
            cursor: 'pointer',
          }}
        >
          ↺ 처음부터 다시 입력하기
        </button>
      </div>

      {modal && (
        <SimpleModal
          title={modal === 'visit' ? '현장 방문 상담 예약' : '상담 요청 안내'}
          onClose={closeModal}
        >
          {submitState !== 'ok' && (
            <>
              <p className="text-[#c4c2d8] text-[0.9rem] leading-[1.65]">
                {modal === 'visit'
                  ? '현장 방문 상담은 실측이 포함되며 평일 기준 약 40~60분 소요됩니다.'
                  : '입력하신 연락처로 영업일 기준 1일 이내 담당자가 연락드립니다.'}
              </p>

              <div className="mt-3 rounded-lg px-3 py-2 text-[0.8rem]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-[#6b6a80]">요청번호</div>
                <div className="text-[#22d3a0] font-mono">{enriched?.inquiryId || '-'}</div>
              </div>

              <div className="mt-3">
                <label className="block text-[#8b8a9e] text-[0.82rem] mb-1">추가 요청 메모 (선택)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="원하는 연락 시간대, 추가 문의 등"
                  rows={3}
                  className="w-full bg-[#0d0d12] border border-white/[0.08] rounded-lg text-[#e8e6f0] px-3 py-2 text-[0.85rem] outline-none resize-y"
                />
              </div>

              {submitState === 'error' && submitResult?.error && (
                <div
                  className="mt-3 rounded px-3 py-2 text-[0.82rem]"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
                >
                  ⚠ 접수 실패: {submitResult.error}
                </div>
              )}

              <button
                type="button"
                onClick={submitInquiry}
                disabled={submitState === 'submitting'}
                className="w-full mt-4 py-2.5 rounded-lg font-semibold"
                style={{
                  background: modal === 'visit'
                    ? 'rgba(34,211,160,0.15)'
                    : 'linear-gradient(135deg,#7c6af7,#5b4fd4)',
                  color: modal === 'visit' ? '#22d3a0' : '#fff',
                  border: modal === 'visit' ? '1px solid rgba(34,211,160,0.4)' : 'none',
                  cursor: submitState === 'submitting' ? 'not-allowed' : 'pointer',
                  opacity: submitState === 'submitting' ? 0.6 : 1,
                }}
              >
                {submitState === 'submitting'
                  ? '접수 중...'
                  : modal === 'visit' ? '방문 예약 요청 보내기' : '상담 요청 보내기'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="w-full mt-2 py-2 rounded-lg text-[0.82rem]"
                style={{ background: 'transparent', color: '#6b6a80', border: 'none', cursor: 'pointer' }}
              >
                취소
              </button>
            </>
          )}

          {submitState === 'ok' && submitResult && (
            <>
              <div className="text-center py-2">
                <div className="text-[2rem] mb-2">✓</div>
                <div className="text-[#22d3a0] text-[1rem] font-bold">접수 완료</div>
              </div>
              <div
                className="rounded-lg px-4 py-3 mt-2 text-[0.85rem] leading-[1.6]"
                style={{ background: 'rgba(34,211,160,0.06)', border: '1px solid rgba(34,211,160,0.22)', color: '#a0d9cc' }}
              >
                {submitResult.message}
              </div>
              <div className="mt-3 space-y-1 text-[0.8rem]">
                <div className="flex justify-between">
                  <span className="text-[#6b6a80]">요청번호</span>
                  <span className="text-[#22d3a0] font-mono">{submitResult.inquiry_id}</span>
                </div>
                {submitResult.received_at && (
                  <div className="flex justify-between">
                    <span className="text-[#6b6a80]">접수 시각</span>
                    <span className="text-[#c4c2d8]">{submitResult.received_at}</span>
                  </div>
                )}
                {customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-[#6b6a80]">연락 예정</span>
                    <span className="text-[#c4c2d8]">{customerPhone}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-full mt-4 py-2.5 rounded-lg font-semibold"
                style={{
                  background: 'linear-gradient(135deg,#7c6af7,#5b4fd4)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                확인
              </button>
            </>
          )}
        </SimpleModal>
      )}
    </div>
  );
}

function ActionButton({ label, desc, primary, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-left px-4 py-3 rounded-xl transition-opacity duration-150"
      style={{
        background: primary ? 'linear-gradient(135deg,#7c6af7,#5b4fd4)' : 'rgba(255,255,255,0.03)',
        border: primary ? 'none' : '1px solid rgba(255,255,255,0.07)',
        color: primary ? '#fff' : '#c4c2d8',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div className="font-bold text-[0.9rem]">{label}</div>
      <div
        className="text-[0.75rem] mt-0.5 leading-[1.5]"
        style={{ color: primary ? 'rgba(255,255,255,0.8)' : '#6b6a80' }}
      >
        {desc}
      </div>
    </button>
  );
}

function SimpleModal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[#e8e6f0] text-[1rem] font-bold mb-3">{title}</div>
        {children}
      </div>
    </div>
  );
}
