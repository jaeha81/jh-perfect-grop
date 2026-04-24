'use client';
import { formatKRW } from '@/lib/estimate-formatters';

export default function ResultComparisonCards({ tiers }) {
  const order = ['budget', 'standard', 'premium'];

  return (
    <div className="bg-[#13100d] border border-white/[0.07] rounded-2xl p-6 sm:p-8 mb-5">
      <div className="text-[#a09080] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-1">
        비교 견적 — 저가 / 표준 / 고급
      </div>
      <div className="text-[#6b6a80] text-[0.82rem] mb-5">
        동일 범위에서 자재·마감 등급만 달리한 기준별 견적입니다.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {order.map((k) => {
          const t = tiers[k];
          if (!t) return null;
          const rec = t.recommended;
          return (
            <div
              key={k}
              className="rounded-xl p-5 flex flex-col"
              style={{
                background: rec ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.025)',
                border: `1.5px solid ${rec ? 'rgba(255,107,53,0.46)' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: rec ? '0 4px 20px rgba(255,107,53,0.15)' : 'none',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[0.72rem] font-bold px-2 py-0.5 rounded"
                  style={{
                    background: k === 'premium'
                      ? 'rgba(251,191,36,0.15)'
                      : k === 'standard'
                      ? 'rgba(255,107,53,0.15)'
                      : 'rgba(255,255,255,0.06)',
                    color: k === 'premium' ? '#fbbf24' : k === 'standard' ? '#FF8C5A' : '#7a6a5a',
                  }}
                >
                  {t.label}
                </span>
                {rec && (
                  <span
                    className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#FF6B35', color: '#fff' }}
                  >
                    ✨ 추천
                  </span>
                )}
              </div>

              <div className="text-[#e8e6f0] text-[1.35rem] font-extrabold leading-tight">
                {formatKRW(t.min)}
              </div>
              <div className="text-[#8b8a9e] text-[0.82rem] mt-1">
                ~ {formatKRW(t.max)}
              </div>

              <div className="text-[#6b6a80] text-[0.78rem] mt-3 leading-[1.55]">
                {t.desc}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-[#555] text-[0.78rem] leading-[1.55]">
        * 금액은 입력 기반 자동 산출이며, 자재 브랜드·세부 사양·현장 실측에 따라 변동될 수 있습니다.
      </div>
    </div>
  );
}
