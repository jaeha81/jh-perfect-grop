'use client';
import { formatArea, formatDate } from '@/lib/estimate-formatters';

export default function ResultSummary({ form, enriched }) {
  const c = form.customer;
  const s = form.space;
  const priorityFocus = form.finish.priorityFocus?.join(' · ') || '미입력';

  return (
    <div className="bg-[#13131a] border border-white/[0.07] rounded-2xl p-6 sm:p-8 mb-5">
      {/* AI 생성물 표시 — AI 기본법 제34조 / 대회 기준 "AI GENERATED" */}
      <div
        className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg"
        style={{ background: 'rgba(124,111,205,0.12)', border: '1px solid rgba(124,111,205,0.25)' }}
      >
        <span className="text-base" aria-hidden="true">🤖</span>
        <span className="text-[0.75rem] font-semibold tracking-wide" style={{ color: '#a090e8' }}>
          AI 자동 생성 견적 (AI GENERATED)
        </span>
        <span className="text-[0.72rem] text-[#6b6a80] ml-1">
          · 5 에이전트 파이프라인 · Claude Sonnet 4.6
        </span>
      </div>

      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase">
            견적 요청 요약
          </div>
          <div className="text-[#6b6a80] text-[0.78rem] mt-1">#{form.inquiryId}</div>
        </div>
        <div
          className="px-3 py-1 rounded-full text-[0.72rem] font-bold"
          style={{ background: 'rgba(34,211,160,0.15)', color: '#22d3a0' }}
        >
          견적 완료
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <SummaryRow label="고객명" value={c.customerName || '미입력'} />
        <SummaryRow label="연락처" value={c.phone || '미입력'} />
        <SummaryRow label="현장 주소" value={c.address || '미입력'} />
        <SummaryRow label="공간 유형" value={`${s.spaceType}${s.spaceSubtype ? ' / ' + s.spaceSubtype : ''}`} />
        <SummaryRow label="면적" value={formatArea(s.totalArea)} />
        <SummaryRow label="희망 일정" value={
          c.preferredStartDate || c.preferredEndDate
            ? `${formatDate(c.preferredStartDate)} ~ ${formatDate(c.preferredEndDate)}`
            : '미입력'
        } />
        <SummaryRow label="우선 기준" value={priorityFocus} />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div>
      <div className="text-[#6b6a80] text-[0.72rem] uppercase tracking-wider">{label}</div>
      <div className="text-[#e8e6f0] text-[0.92rem] mt-0.5">{value}</div>
    </div>
  );
}
