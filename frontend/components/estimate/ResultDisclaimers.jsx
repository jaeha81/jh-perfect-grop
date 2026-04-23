'use client';

const DISCLAIMERS = [
  '본 견적은 입력하신 정보를 기반으로 자동 분석된 결과이며, 최종 금액이 아닙니다.',
  '최종 견적은 현장 실측 후 자재 브랜드·사양·수량이 확정되면서 조정됩니다.',
  '자재 수급 상황, 공사 기간, 계절적 요인에 따라 금액이 변동될 수 있습니다.',
  '사진만으로 파악이 어려운 설비·배관·배선·누수 상태는 반드시 현장 확인이 필요합니다.',
];

export default function ResultDisclaimers() {
  return (
    <div
      className="rounded-2xl p-6 sm:p-8 mb-5"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}
    >
      <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-3">
        유의사항
      </div>
      <ul className="space-y-2">
        {DISCLAIMERS.map((d, i) => (
          <li key={i} className="flex gap-2 text-[#8b8a9e] text-[0.82rem] leading-[1.6]">
            <span className="text-[#555] shrink-0">{i + 1}.</span>
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
