'use client';
import { STEP_LABELS } from '@/lib/estimate-state';

export default function StepHeader({ currentStep, onPrev, onReset, inquiryId }) {
  const total = STEP_LABELS.length;
  const current = STEP_LABELS.find((s) => s.step === currentStep);
  const pct = current ? Math.round((current.step / total) * 100) : 0;

  return (
    <div className="animate-fade-in mb-7">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentStep <= 1}
          className="btn-secondary flex items-center gap-1 text-[0.85rem] font-semibold px-3 py-1.5 rounded-lg"
          style={{
            color: currentStep <= 1 ? '#2a2a38' : '#a09eb8',
            background: currentStep <= 1 ? 'transparent' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${currentStep <= 1 ? 'transparent' : 'rgba(255,255,255,0.07)'}`,
            cursor: currentStep <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          ← 이전
        </button>

        <div className="text-center">
          <div className="text-[0.72rem] text-[#6b6a80] font-medium tracking-wide uppercase">
            {current ? `STEP ${current.step} / ${total}` : ''}
          </div>
          {current && (
            <div className="text-[0.88rem] font-semibold mt-0.5" style={{ color: '#FF6B35' }}>
              {current.label}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onReset}
          className="text-[0.78rem] text-[#555] hover:text-[#f87171] transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-red-500/10"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          처음부터
        </button>
      </div>

      {/* 진행바 */}
      <div
        className="h-[7px] rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <div
          className="h-full rounded-full progress-bar-fill transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* 스텝 도트 */}
      {current && (
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {STEP_LABELS.map((s) => {
            const done = s.step < current.step;
            const active = s.step === current.step;
            return (
              <span
                key={s.step}
                className="flex items-center gap-1 text-[0.71rem] px-2 py-0.5 rounded-full transition-all duration-300"
                style={{
                  background: active
                    ? 'rgba(255,107,53,0.16)'
                    : done
                    ? 'rgba(34,211,160,0.1)'
                    : 'transparent',
                  color: active ? '#FF6B35' : done ? '#22d3a0' : '#3a3a50',
                  fontWeight: active ? 600 : 400,
                  border: active ? '1px solid rgba(255,107,53,0.28)' : '1px solid transparent',
                }}
              >
                {done ? '✓' : s.step}. {s.label}
              </span>
            );
          })}
        </div>
      )}

      {inquiryId && (
        <div className="text-[0.7rem] text-[#333] mt-1.5">
          #{inquiryId}
        </div>
      )}
    </div>
  );
}
