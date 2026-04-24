'use client';

const AGENTS = [
  { name: 'SCANNER',   desc: '공간 분석', icon: '🔍' },
  { name: 'ESTIMATOR', desc: '수량 산출', icon: '📐' },
  { name: 'PRICER',    desc: '단가 적용', icon: '💰' },
  { name: 'VALIDATOR', desc: '현장 검증', icon: '✅' },
  { name: 'REPORTER',  desc: '리포트 생성', icon: '📄' },
];

function SpinIcon() {
  return (
    <svg
      width="18" height="18" viewBox="0 0 18 18" fill="none"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <circle cx="9" cy="9" r="7" stroke="rgba(255,107,53,0.25)" strokeWidth="2" />
      <path d="M9 2a7 7 0 0 1 7 7" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function AnalysisLoading({ activeStep, doneSteps, parallelSteps }) {
  const donePct = Math.round((doneSteps.length / AGENTS.length) * 100);

  return (
    <div
      className="animate-fade-in rounded-3xl p-6 sm:p-10 mb-5"
      style={{
        background: 'linear-gradient(160deg,#1a1008 0%,#13100d 100%)',
        border: '1px solid rgba(255,107,53,0.18)',
        boxShadow: '0 4px 60px rgba(255,107,53,0.08)',
      }}
    >
      {/* 헤더 */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{
            background: 'rgba(255,107,53,0.1)',
            border: '1px solid rgba(255,107,53,0.25)',
          }}
        >
          <span style={{ fontSize: '2rem' }}>🤖</span>
        </div>
        <div className="text-[0.75rem] font-semibold tracking-[0.1em] uppercase mb-2" style={{ color: '#a09080' }}>
          에이전트 분석 중
        </div>
        <div className="text-[#e8e6f0] text-[1.05rem] font-semibold">
          5개 에이전트가 입력 정보를 분석하고 있습니다
        </div>
        <div className="text-[0.86rem] mt-1" style={{ color: '#6b5f50' }}>
          잠시만 기다려 주세요…
        </div>

        {/* 미니 진행바 */}
        <div
          className="h-[4px] rounded-full overflow-hidden mt-5 max-w-[240px] mx-auto"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className="h-full rounded-full progress-bar-fill transition-all duration-700"
            style={{ width: `${donePct}%` }}
          />
        </div>
        <div className="text-[0.72rem] mt-1.5" style={{ color: '#555' }}>{donePct}% 완료</div>
      </div>

      {/* 에이전트 목록 */}
      <div className="space-y-2.5">
        {AGENTS.map((a, i) => {
          const done = doneSteps.includes(i);
          const active = activeStep === i;
          const parallel = parallelSteps.includes(i);

          const bg = done
            ? 'rgba(34,211,160,0.07)'
            : active
            ? 'rgba(255,107,53,0.09)'
            : 'rgba(255,255,255,0.02)';
          const border = done
            ? 'rgba(34,211,160,0.25)'
            : active
            ? 'rgba(255,107,53,0.35)'
            : 'rgba(255,255,255,0.05)';

          return (
            <div
              key={a.name}
              className="flex items-center gap-4 px-5 py-3.5 rounded-2xl"
              style={{
                background: bg,
                border: `1px solid ${border}`,
                transition: 'all 0.4s ease',
                transform: active ? 'translateX(3px)' : 'none',
              }}
            >
              {/* 아이콘 */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[0.9rem] font-bold flex-shrink-0"
                style={{
                  background: done
                    ? 'rgba(34,211,160,0.18)'
                    : active
                    ? 'rgba(255,107,53,0.18)'
                    : 'rgba(255,255,255,0.04)',
                  color: done ? '#22d3a0' : active ? '#FF6B35' : '#555',
                }}
              >
                {done ? '✓' : active ? <SpinIcon /> : <span style={{ fontSize: '1.1rem' }}>{a.icon}</span>}
              </div>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold text-[0.9rem]"
                    style={{ color: done ? '#22d3a0' : active ? '#e8e6f0' : '#555' }}
                  >
                    {a.name}
                  </span>
                  {parallel && (
                    <span
                      className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}
                    >
                      병렬
                    </span>
                  )}
                </div>
                <div
                  className="text-[0.78rem]"
                  style={{ color: done ? '#22d3a0' : active ? '#a09080' : '#444' }}
                >
                  {a.desc}
                </div>
              </div>

              {/* 상태 */}
              <div
                className="text-[0.78rem] font-semibold flex-shrink-0"
                style={{ color: done ? '#22d3a0' : active ? '#FF6B35' : '#333' }}
              >
                {done ? '완료 ✓' : active ? '진행 중' : '대기'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center text-[0.77rem]" style={{ color: '#3a2e22' }}>
        본 견적은 AI 자동 분석 결과이며, 최종 견적은 현장 확인 후 확정됩니다.
      </div>
    </div>
  );
}
