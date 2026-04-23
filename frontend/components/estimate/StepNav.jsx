'use client';
import { useState } from 'react';

export default function StepNav({
  onNext,
  onPrev,
  canNext = true,
  nextLabel = '다음 단계',
  showPrev = true,
  errorMessages = [],
}) {
  const [showErrors, setShowErrors] = useState(false);

  function handleNext() {
    if (!canNext) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    onNext?.();
  }

  return (
    <div className="mt-6">
      {showErrors && errorMessages.length > 0 && (
        <div
          className="rounded-lg px-4 py-3 mb-3 text-[0.83rem] leading-[1.55]"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
        >
          {errorMessages.map((m, i) => (
            <div key={i}>• {m}</div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {showPrev && (
          <button
            type="button"
            onClick={onPrev}
            className="px-5 py-3 rounded-xl text-[0.92rem] font-semibold"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#a09eb8',
              cursor: 'pointer',
            }}
          >
            이전
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-3 rounded-xl text-white text-[1rem] font-bold transition-opacity duration-150"
          style={{
            background: 'linear-gradient(135deg,#7c6af7,#5b4fd4)',
            opacity: canNext ? 1 : 0.6,
            cursor: canNext ? 'pointer' : 'pointer',
            border: 'none',
          }}
        >
          {nextLabel} →
        </button>
      </div>
    </div>
  );
}
