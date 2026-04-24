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
    <div className="mt-8">
      {showErrors && errorMessages.length > 0 && (
        <div
          className="animate-scale-in rounded-xl px-5 py-4 mb-4 text-[0.84rem] leading-[1.6]"
          style={{
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
          }}
        >
          {errorMessages.map((m, i) => (
            <div key={i} className="flex items-start gap-2">
              <span style={{ color: '#f87171', flexShrink: 0 }}>•</span>
              <span>{m}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        {showPrev && (
          <button
            type="button"
            onClick={onPrev}
            className="btn-secondary px-6 py-3.5 rounded-xl text-[0.92rem] font-semibold"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: '#a09eb8',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            이전
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          className="btn-primary flex-1 py-3.5 rounded-xl text-white text-[1rem] font-bold"
          style={{
            background: canNext
              ? 'linear-gradient(135deg,#FF6B35,#CC4E1F)'
              : 'linear-gradient(135deg,#3d2010,#2a1508)',
            opacity: canNext ? 1 : 0.55,
            cursor: 'pointer',
            border: 'none',
            boxShadow: canNext ? '0 6px 24px rgba(255,107,53,0.38)' : 'none',
          }}
        >
          {nextLabel} →
        </button>
      </div>
    </div>
  );
}
