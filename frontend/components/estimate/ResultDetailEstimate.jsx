'use client';
import { formatKRW } from '@/lib/estimate-formatters';

const CATEGORY_HINTS = {
  '철거/해체': '기존 마감/설비 철거 및 폐기물 반출',
  '바닥공사': '바닥 마감재 시공 (자재 + 인건비)',
  '벽체공사': '벽체 마감 (도배/도장/타일/필름 등)',
  '벽체/도장': '벽체 마감 (도배/도장/타일/필름 등)',
  '천장': '천장 하지·마감 + 몰딩',
  '창호': '발코니창·현관문·방문 교체',
  '전기': '전기 배선·분전반·콘센트·조명 기구',
  '설비/배관': '급수·배수·위생기구·보일러 등',
  '주방': '싱크대·가전·후드 등 주방 일체',
  '냉난방': '에어컨·보일러·환기 시스템',
  '마감/기타': '몰딩·방수·단열·유리·금속 등 잔여 마감',
};

export default function ResultDetailEstimate({ breakdown, workItems }) {
  const total = Object.values(breakdown || {}).reduce((a, b) => a + (b || 0), 0);
  const entries = Object.entries(breakdown || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-[#13100d] border border-white/[0.07] rounded-2xl p-6 sm:p-8 mb-5">
      <div className="text-[#a09080] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-1">
        공종별 세부견적서
      </div>
      <div className="text-[#6b5f50] text-[0.82rem] mb-5">
        표준형 기준 공종별 금액 배분입니다. 실제 수량·단가는 실측 후 조정됩니다.
      </div>

      {entries.length === 0 && (
        <div className="text-[#555] text-[0.85rem] text-center py-4">
          공종별 데이터가 없습니다.
        </div>
      )}

      {entries.map(([k, v]) => {
        const pct = total > 0 ? Math.round((v / total) * 100) : 0;
        const hint = CATEGORY_HINTS[k] || '';
        return (
          <div key={k} className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <div>
                <span className="text-[#c8b8a8] text-[0.9rem] font-medium">{k}</span>
                {hint && <span className="text-[#555] text-[0.75rem] ml-2">— {hint}</span>}
              </div>
              <span className="text-[#e8e6f0] text-[0.88rem] font-semibold whitespace-nowrap">
                {formatKRW(v)} <span className="text-[#555] font-normal">({pct}%)</span>
              </span>
            </div>
            <div className="h-[6px] bg-white/[0.06] rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#FF6B35,#22d3a0)' }}
              />
            </div>
          </div>
        );
      })}

      {entries.length > 0 && (
        <div className="pt-3 mt-3 border-t border-white/[0.06] flex justify-between">
          <span className="text-[#8b8a9e] text-[0.85rem]">합계 (별도항목 제외)</span>
          <span className="text-[#e8e6f0] text-[1rem] font-extrabold">{formatKRW(total)}</span>
        </div>
      )}

      {workItems && workItems.length > 0 && (
        <details className="mt-4">
          <summary className="text-[#FF8C5A] text-[0.82rem] cursor-pointer">
            세부 항목 {workItems.length}건 보기
          </summary>
          <div className="mt-2 space-y-1 max-h-[300px] overflow-y-auto">
            {workItems.map((it, i) => (
              <div
                key={i}
                className="flex justify-between text-[0.78rem] px-3 py-1.5 rounded"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <span className="text-[#c8b8a8] truncate">
                  {it.category ? `[${it.category}] ` : ''}{it.subcategory || it.name || '-'}
                </span>
                <span className="text-[#8b8a9e] whitespace-nowrap ml-2">
                  {it.quantity ? `${it.quantity}${it.unit || ''} · ` : ''}
                  {it.total ? formatKRW(it.total) : it.amount ? formatKRW(it.amount) : '-'}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
