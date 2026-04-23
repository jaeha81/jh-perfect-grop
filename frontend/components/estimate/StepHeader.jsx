'use client';
import { STEP_LABELS } from '@/lib/estimate-state';

export default function StepHeader({ currentStep, onPrev, onReset, inquiryId }) {
  const total = STEP_LABELS.length;
  const current = STEP_LABELS.find((s) => s.step === currentStep);
  const pct = current ? Math.round((current.step / total) * 100) : 0;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentStep <= 1}
          className="text-[0.85rem] font-semibold transition-opacity duration-150"
          style={{
            color: currentStep <= 1 ? '#333' : '#a09eb8',
            background: 'none',
            border: 'none',
            cursor: currentStep <= 1 ? 'not-allowed' : 'pointer',
            padding: 0,
          }}
        >
          ← 이전 단계
        </button>
        <div className="text-[0.78rem] text-[#6b6a80]">
          {current ? `STEP ${current.step} / ${total}` : ''}
          {inquiryId && <span className="ml-2 text-[#444]">#{inquiryId}</span>}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-[0.78rem] text-[#555] hover:text-[#f87171] transition-colors duration-150"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          처음부터
        </button>
      </div>
      <div className="h-[6px] bg-white/[0.06] rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-500"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#7c6af7,#22d3a0)' }}
        />
      </div>
      {current && (
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          {STEP_LABELS.map((s) => (
            <span
              key={s.step}
              className="text-[0.72rem] px-2 py-0.5 rounded"
              style={{
                background: s.step === current.step ? 'rgba(124,106,247,0.15)' : 'transparent',
                color: s.step < current.step ? '#22d3a0' : s.step === current.step ? '#a78bfa' : '#444',
              }}
            >
              {s.step < current.step ? '✓' : s.step}. {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
