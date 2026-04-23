'use client';
import { formatArea, formatDate } from '@/lib/estimate-formatters';

export default function ResultSummary({ form, enriched }) {
  const c = form.customer;
  const s = form.space;
  const priorityFocus = form.finish.priorityFocus?.join(' · ') || '미입력';

  return (
    <div className="bg-[#13131a] border border-white/[0.07] rounded-2xl p-6 sm:p-8 mb-5">
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
