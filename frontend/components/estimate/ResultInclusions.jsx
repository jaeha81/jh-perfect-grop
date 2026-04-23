'use client';

export default function ResultInclusions({ included = [], separate = [], excluded = [] }) {
  const BLOCKS = [
    {
      key: 'included',
      label: '포함 항목',
      desc: '본 견적 금액에 포함됩니다.',
      items: included,
      colors: { bg: 'rgba(34,211,160,0.08)', border: 'rgba(34,211,160,0.3)', chip: '#22d3a0' },
      emptyText: '선택된 공사 범위가 없습니다.',
    },
    {
      key: 'separate',
      label: '별도 항목',
      desc: '별도 견적으로 분리 표기됩니다. 실제 사양에 따라 현장 확인 후 확정됩니다.',
      items: separate,
      colors: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.3)', chip: '#fbbf24' },
      emptyText: '선택한 별도 항목이 없습니다.',
    },
    {
      key: 'excluded',
      label: '제외 항목',
      desc: '본 견적 범위에 포함되지 않습니다.',
      items: excluded,
      colors: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.25)', chip: '#f87171' },
      emptyText: '',
    },
  ];

  return (
    <div className="bg-[#13131a] border border-white/[0.07] rounded-2xl p-6 sm:p-8 mb-5">
      <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-1">
        포함 / 별도 / 제외 항목
      </div>
      <div className="text-[#6b6a80] text-[0.82rem] mb-5">
        견적 범위를 명확히 구분합니다. 별도·제외 항목은 필요 시 별도 협의됩니다.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {BLOCKS.map((b) => (
          <div
            key={b.key}
            className="rounded-xl p-4"
            style={{ background: b.colors.bg, border: `1px solid ${b.colors.border}` }}
          >
            <div className="font-bold text-[0.88rem] mb-1" style={{ color: b.colors.chip }}>
              {b.label}
            </div>
            <div className="text-[#8b8a9e] text-[0.75rem] leading-[1.5] mb-3">{b.desc}</div>
            {b.items.length === 0 ? (
              <div className="text-[#555] text-[0.8rem] italic">{b.emptyText || '해당 없음'}</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {b.items.map((it, i) => (
                  <span
                    key={`${b.key}-${i}`}
                    className="inline-block px-2.5 py-1 rounded text-[0.78rem]"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${b.colors.border}`,
                      color: b.colors.chip,
                    }}
                  >
                    {it}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
