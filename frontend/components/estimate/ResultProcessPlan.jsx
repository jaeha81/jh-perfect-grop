'use client';

export default function ResultProcessPlan({ phases = [] }) {
  if (!phases.length) return null;

  return (
    <div className="bg-[#13131a] border border-white/[0.07] rounded-2xl p-6 sm:p-8 mb-5">
      <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-1">
        공정 계획
      </div>
      <div className="text-[#6b6a80] text-[0.82rem] mb-5">
        공사 범위 기반 예상 공정 순서입니다. 현장 상황에 따라 병렬 진행 또는 순서 조정이 가능합니다.
      </div>

      <div className="relative pl-6">
        <div
          className="absolute left-[11px] top-2 bottom-2 w-[2px]"
          style={{ background: 'linear-gradient(180deg,#7c6af7,#22d3a0)' }}
        />
        {phases.map((p, i) => (
          <div key={p.key} className="relative mb-4 last:mb-0">
            <div
              className="absolute -left-6 top-1 w-[24px] h-[24px] rounded-full flex items-center justify-center text-[0.7rem] font-bold"
              style={{
                background: i === 0
                  ? 'linear-gradient(135deg,#7c6af7,#5b4fd4)'
                  : i === phases.length - 1
                  ? 'linear-gradient(135deg,#22d3a0,#0f9e7a)'
                  : 'rgba(124,106,247,0.2)',
                color: i === 0 || i === phases.length - 1 ? '#fff' : '#a78bfa',
                border: i === 0 || i === phases.length - 1 ? 'none' : '1px solid rgba(124,106,247,0.3)',
              }}
            >
              {i + 1}
            </div>
            <div
              className="rounded-lg px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                <span className="text-[#e8e6f0] text-[0.92rem] font-semibold">{p.label}</span>
                <span
                  className="text-[0.7rem] font-bold px-2 py-0.5 rounded"
                  style={{ background: 'rgba(124,106,247,0.15)', color: '#a78bfa' }}
                >
                  약 {p.days}일
                </span>
              </div>
              <div className="text-[#8b8a9e] text-[0.8rem] leading-[1.55]">{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
