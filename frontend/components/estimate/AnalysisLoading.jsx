'use client';

const AGENTS = [
  { name: 'SCANNER',   desc: '공간 분석' },
  { name: 'ESTIMATOR', desc: '수량 산출' },
  { name: 'PRICER',    desc: '단가 적용' },
  { name: 'VALIDATOR', desc: '현장 검증' },
  { name: 'REPORTER',  desc: '리포트 생성' },
];

export default function AnalysisLoading({ activeStep, doneSteps, parallelSteps }) {
  return (
    <div className="bg-[#13131a] border border-white/[0.07] rounded-2xl p-6 sm:p-8 mb-5">
      <div className="text-center mb-6">
        <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-2">
          에이전트 분석 중
        </div>
        <div className="text-[#c4c2d8] text-[0.95rem]">
          5개 에이전트가 입력 정보를 분석 중입니다. 잠시만 기다려 주세요.
        </div>
      </div>

      <div className="space-y-2">
        {AGENTS.map((a, i) => {
          const done = doneSteps.includes(i);
          const active = activeStep === i;
          const parallel = parallelSteps.includes(i);

          const bg = done ? 'rgba(34,211,160,0.08)' : active ? 'rgba(124,106,247,0.1)' : 'rgba(255,255,255,0.02)';
          const border = done ? 'rgba(34,211,160,0.3)' : active ? 'rgba(124,106,247,0.4)' : 'rgba(255,255,255,0.06)';
          const label = done ? '완료' : active ? '진행 중' : '대기';

          return (
            <div
              key={a.name}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-300"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[0.85rem] font-bold"
                style={{
                  background: done ? 'rgba(34,211,160,0.2)' : active ? 'rgba(124,106,247,0.25)' : 'rgba(255,255,255,0.05)',
                  color: done ? '#22d3a0' : active ? '#a78bfa' : '#555',
                }}
              >
                {done ? '✓' : active ? '⟳' : i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#e8e6f0] font-semibold text-[0.9rem]">{a.name}</span>
                  {parallel && (
                    <span
                      className="text-[0.65rem] font-bold px-2 py-0.5 rounded"
                      style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}
                    >
                      병렬
                    </span>
                  )}
                </div>
                <div className="text-[#6b6a80] text-[0.78rem]">{a.desc}</div>
              </div>
              <div className="text-[0.78rem]" style={{ color: done ? '#22d3a0' : active ? '#a78bfa' : '#555' }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 text-center text-[#555] text-[0.78rem]">
        본 견적은 AI 자동 분석 결과이며, 최종 견적은 현장 확인 후 확정됩니다.
      </div>
    </div>
  );
}
