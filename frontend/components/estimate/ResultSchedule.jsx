'use client';
import { formatDays, formatDate } from '@/lib/estimate-formatters';

const RISK_STYLES = {
  normal:   { bg: 'rgba(34,211,160,0.1)',  border: 'rgba(34,211,160,0.3)',  color: '#22d3a0', icon: '✓' },
  moderate: { bg: 'rgba(124,106,247,0.1)', border: 'rgba(124,106,247,0.3)', color: '#a78bfa', icon: '◎' },
  tight:    { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)',  color: '#fbbf24', icon: '⚠' },
  critical: { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   color: '#f87171', icon: '🚨' },
  unknown:  { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', color: '#8b8a9e', icon: 'i' },
};

export default function ResultSchedule({ schedule }) {
  if (!schedule) return null;
  const risk = RISK_STYLES[schedule.risk.level] || RISK_STYLES.unknown;

  return (
    <div className="bg-[#13131a] border border-white/[0.07] rounded-2xl p-6 sm:p-8 mb-5">
      <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-1">
        예상 공사 일정
      </div>
      <div className="text-[#6b6a80] text-[0.82rem] mb-5">
        공사 범위 기반 권장 기간입니다. 희망 일정과의 적정성을 함께 진단합니다.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <MetricBox label="권장 총 기간" value={formatDays(schedule.recommendedDays)} highlight />
        <MetricBox label="희망 착공" value={formatDate(schedule.preferredStartDate)} />
        <MetricBox label="희망 완료" value={formatDate(schedule.preferredEndDate)} />
        <MetricBox label="오픈/입주" value={formatDate(schedule.openingDate)} />
      </div>

      <div
        className="flex items-start gap-3 rounded-lg px-4 py-3"
        style={{ background: risk.bg, border: `1px solid ${risk.border}` }}
      >
        <span className="text-[1.1rem]">{risk.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-[0.88rem]" style={{ color: risk.color }}>
            일정 진단 — {schedule.risk.label}
          </div>
          <div className="text-[#8b8a9e] text-[0.8rem] mt-1 leading-[1.55]">
            {schedule.risk.message}
          </div>
        </div>
      </div>

      {(schedule.workTimeframe || schedule.schedulePriority) && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {schedule.workTimeframe && (
            <Chip label="작업 시간대" value={schedule.workTimeframe} />
          )}
          {schedule.schedulePriority && (
            <Chip label="일정 우선" value={schedule.schedulePriority} />
          )}
        </div>
      )}
    </div>
  );
}

function MetricBox({ label, value, highlight }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: highlight ? 'rgba(124,106,247,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${highlight ? 'rgba(124,106,247,0.3)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div className="text-[#6b6a80] text-[0.7rem] uppercase tracking-wider">{label}</div>
      <div
        className="text-[0.92rem] font-bold mt-1"
        style={{ color: highlight ? '#a78bfa' : '#e8e6f0' }}
      >
        {value}
      </div>
    </div>
  );
}

function Chip({ label, value }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[0.78rem]"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span className="text-[#555]">{label}:</span>
      <span className="text-[#c4c2d8]">{value}</span>
    </span>
  );
}
