'use client';
import { useState } from 'react';

export default function ResultActions({ enriched, onReset, customerPhone }) {
  const [showConsult, setShowConsult] = useState(false);
  const [showVisit, setShowVisit] = useState(false);

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
          onClick={() => setShowConsult(true)}
        />
        <ActionButton
          label="🗓 현장 방문 상담 예약"
          desc="정확한 견적은 실측이 정답입니다."
          onClick={() => setShowVisit(true)}
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

      {showConsult && (
        <SimpleModal title="상담 요청 안내" onClose={() => setShowConsult(false)}>
          <p className="text-[#c4c2d8] text-[0.9rem] leading-[1.65]">
            입력하신 연락처 <span className="text-[#a78bfa] font-semibold">{customerPhone || '미입력'}</span>로 상담 연락을 드립니다.
          </p>
          <p className="text-[#8b8a9e] text-[0.82rem] leading-[1.6] mt-2">
            견적 요청번호 <span className="text-[#22d3a0] font-mono">{enriched?.inquiryId}</span>를 함께 기억해 주세요.
            상담사가 입력 정보를 확인한 뒤 영업일 기준 1일 이내 연락드립니다.
          </p>
          <button
            type="button"
            onClick={() => setShowConsult(false)}
            className="w-full mt-4 py-2.5 rounded-lg font-semibold"
            style={{ background: 'linear-gradient(135deg,#7c6af7,#5b4fd4)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            확인
          </button>
        </SimpleModal>
      )}

      {showVisit && (
        <SimpleModal title="현장 방문 상담 예약" onClose={() => setShowVisit(false)}>
          <p className="text-[#c4c2d8] text-[0.9rem] leading-[1.65]">
            현장 방문 상담은 실측이 포함되며 평일 기준 약 40~60분 소요됩니다.
          </p>
          <p className="text-[#8b8a9e] text-[0.82rem] leading-[1.6] mt-2">
            예약 확정 시 <span className="text-[#22d3a0] font-mono">{enriched?.inquiryId}</span> 번호로 일정 조율이 가능합니다.
            방문 전 현장 사진·도면이 있으면 더 정밀한 분석이 가능합니다.
          </p>
          <button
            type="button"
            onClick={() => setShowVisit(false)}
            className="w-full mt-4 py-2.5 rounded-lg font-semibold"
            style={{ background: 'rgba(34,211,160,0.15)', color: '#22d3a0', border: '1px solid rgba(34,211,160,0.4)', cursor: 'pointer' }}
          >
            확인
          </button>
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
        className="w-full max-w-[420px] rounded-2xl p-6"
        style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[#e8e6f0] text-[1rem] font-bold mb-3">{title}</div>
        {children}
      </div>
    </div>
  );
}
