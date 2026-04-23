'use client';

export default function ResultCommentary({ validatorFlags = [], expertComment, commentary = [], adjustments }) {
  const hasFlags = validatorFlags.length > 0;
  const hasAdjustments = adjustments?.siteFactors?.length > 0;

  return (
    <div className="bg-[#13131a] border border-white/[0.07] rounded-2xl p-6 sm:p-8 mb-5">
      <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-1">
        AI 분석 의견
      </div>
      <div className="text-[#6b6a80] text-[0.82rem] mb-5">
        18년 현장 기준 VALIDATOR + 입력 기반 분석 코멘트입니다.
      </div>

      {/* 프론트 생성 실무 코멘트 */}
      {commentary.length > 0 && (
        <div className="space-y-2 mb-4">
          {commentary.map((c, i) => (
            <div
              key={i}
              className="flex gap-2 rounded-lg px-4 py-3"
              style={{ background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.18)' }}
            >
              <span className="text-[#a78bfa] text-[0.9rem]">•</span>
              <span className="text-[#c4c2d8] text-[0.85rem] leading-[1.6]">{c}</span>
            </div>
          ))}
        </div>
      )}

      {/* VALIDATOR flags */}
      {hasFlags && (
        <div className="space-y-2 mb-4">
          <div className="text-[#fbbf24] text-[0.78rem] font-semibold mb-1">
            ⚠ VALIDATOR 현장 검증 결과 {validatorFlags.length}건
          </div>
          {validatorFlags.slice(0, 5).map((flag, i) => {
            const dangerKeywords = ['저가 의심', '누락 의심', '품질 위험'];
            const isError =
              flag.severity === 'error' ||
              dangerKeywords.some((kw) => flag.message?.includes(kw) || flag.category?.includes(kw));
            return (
              <div
                key={i}
                className="rounded-lg px-3 py-2 text-[0.82rem]"
                style={{
                  background: isError ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                  border: `1px solid ${isError ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
                  color: isError ? '#f87171' : '#fbbf24',
                }}
              >
                <span className="font-semibold">[{flag.category}]</span> {flag.message}
                {flag.suggestion && (
                  <div className="text-[#8b8a9e] text-[0.78rem] mt-1">→ {flag.suggestion}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 전문가 총평 */}
      {expertComment && (
        <div
          className="rounded-lg px-4 py-3 mb-4"
          style={{ background: 'rgba(34,211,160,0.06)', border: '1px solid rgba(34,211,160,0.22)' }}
        >
          <div className="text-[#22d3a0] text-[0.75rem] font-bold mb-1 tracking-wider">
            전문가 총평
          </div>
          <div className="text-[#a0d9cc] text-[0.85rem] leading-[1.65]">{expertComment}</div>
        </div>
      )}

      {/* 현장 여건 보정 요약 */}
      {hasAdjustments && (
        <div className="mt-3">
          <div className="text-[#6b6a80] text-[0.72rem] uppercase tracking-wider mb-2">
            현장 여건 보정 내역
          </div>
          <div className="flex flex-wrap gap-1.5">
            {adjustments.siteFactors.map((f, i) => (
              <span
                key={i}
                className="inline-block px-2 py-0.5 rounded text-[0.75rem]"
                style={{ background: 'rgba(124,106,247,0.08)', color: '#a78bfa', border: '1px solid rgba(124,106,247,0.2)' }}
              >
                {f.label} +{Math.round(f.pct * 100)}%
              </span>
            ))}
          </div>
          <div className="text-[#555] text-[0.72rem] mt-2">
            종합 보정 계수 × {adjustments.compositeMultiplier?.toFixed(2)} (기본 단가 기반 자동 산출)
          </div>
        </div>
      )}

      {commentary.length === 0 && !hasFlags && !expertComment && !hasAdjustments && (
        <div className="text-[#555] text-[0.85rem] text-center py-4">
          특이사항이 발견되지 않았습니다.
        </div>
      )}
    </div>
  );
}
