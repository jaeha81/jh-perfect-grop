'use client';
import { formatSavedAgo } from '@/lib/estimate-storage';
import { STEP_LABELS } from '@/lib/estimate-state';

export default function ResumeBanner({ draft, onResume, onDiscard }) {
  if (!draft) return null;
  const stepLabel = STEP_LABELS.find((s) => s.step === draft.step)?.label
    || (draft.step > 6 ? '분석 직전 단계' : '입력 중');

  return (
    <div
      className="rounded-2xl p-5 mb-5"
      style={{
        background: 'linear-gradient(135deg, rgba(124,106,247,0.1), rgba(34,211,160,0.06))',
        border: '1px solid rgba(124,106,247,0.3)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="text-[1.4rem]">📝</div>
        <div className="flex-1">
          <div className="text-[#e8e6f0] text-[0.92rem] font-semibold">
            작성 중이던 견적 요청이 남아 있습니다
          </div>
          <div className="text-[#8b8a9e] text-[0.8rem] mt-1 leading-[1.55]">
            마지막 저장: {formatSavedAgo(draft.savedAt)} · 단계: {stepLabel}
            {draft.customer?.customerName ? ` · ${draft.customer.customerName}` : ''}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={onResume}
              className="px-4 py-2 rounded-lg text-[0.85rem] font-semibold"
              style={{
                background: 'linear-gradient(135deg,#7c6af7,#5b4fd4)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              이어서 작성하기 →
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="px-4 py-2 rounded-lg text-[0.85rem]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: '#8b8a9e',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
              }}
            >
              새로 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
