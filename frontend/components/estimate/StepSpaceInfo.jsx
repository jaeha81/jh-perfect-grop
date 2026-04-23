'use client';
import { Section, Field, TextInput, Select } from './FormPrimitives';
import StepNav from './StepNav';
import {
  SPACE_TYPES,
  SPACE_SUBTYPES,
  BUILDING_STATUS,
  OCCUPANCY_STATUS,
  FINISH_CONDITION,
  SITE_VISIT_STATUS,
} from '@/data/estimate-options';
import { validateStep } from '@/lib/estimate-validators';

export default function StepSpaceInfo({ state, dispatch, onNext }) {
  const s = state.space;
  const set = (field) => (e) =>
    dispatch({
      type: 'UPDATE_FIELD',
      group: 'space',
      field,
      value: e.target ? e.target.value : e,
    });

  const subtypes = SPACE_SUBTYPES[s.spaceType] || [];
  const check = validateStep(2, state);

  return (
    <Section title="STEP 2 · 공간 유형 및 기본정보" desc="공간 성격에 따라 적용 기준과 계산 계수가 달라집니다.">
      <Field label="공간 유형" required>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SPACE_TYPES.map((t) => {
            const active = s.spaceType === t.value;
            return (
              <button
                type="button"
                key={t.value}
                onClick={() => {
                  dispatch({ type: 'UPDATE_FIELD', group: 'space', field: 'spaceType', value: t.value });
                  dispatch({ type: 'UPDATE_FIELD', group: 'space', field: 'spaceSubtype', value: '' });
                }}
                className="px-3 py-3 rounded-xl text-left transition-colors duration-150"
                style={{
                  background: active ? 'rgba(124,106,247,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? 'rgba(124,106,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <div className="text-[#e8e6f0] text-[0.88rem] font-semibold">{t.label}</div>
                <div className="text-[#6b6a80] text-[0.72rem] mt-0.5 leading-[1.4]">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </Field>

      {subtypes.length > 0 && (
        <Field label="세부 용도">
          <Select value={s.spaceSubtype} onChange={set('spaceSubtype')} options={subtypes} />
        </Field>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="총 면적 (m²)" required hint="1평 ≈ 3.3m²">
          <TextInput type="number" min="1" step="any" value={s.totalArea} onChange={set('totalArea')} placeholder="예: 84.5" />
        </Field>
        <Field label="전용/실사용 면적 (m²)">
          <TextInput type="number" min="0" step="any" value={s.usableArea} onChange={set('usableArea')} placeholder="예: 72.0" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="층수">
          <TextInput type="number" min="1" value={s.floorLevel} onChange={set('floorLevel')} placeholder="예: 3" />
        </Field>
        <Field label="천장 높이 (m)">
          <TextInput type="number" min="0" step="0.1" value={s.ceilingHeight} onChange={set('ceilingHeight')} placeholder="예: 2.4" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="건물 상태">
          <Select value={s.buildingStatus} onChange={set('buildingStatus')} options={BUILDING_STATUS} />
        </Field>
        <Field label="공실/운영/거주 상태">
          <Select value={s.occupancyStatus} onChange={set('occupancyStatus')} options={OCCUPANCY_STATUS} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="현재 마감 상태">
          <Select value={s.finishCondition} onChange={set('finishCondition')} options={FINISH_CONDITION} />
        </Field>
        <Field label="현장 방문 여부">
          <Select value={s.siteVisitStatus} onChange={set('siteVisitStatus')} options={SITE_VISIT_STATUS} />
        </Field>
      </div>

      <StepNav
        onNext={onNext}
        onPrev={() => dispatch({ type: 'PREV_STEP' })}
        canNext={check.ok}
        errorMessages={!check.ok ? check.messages : []}
      />
    </Section>
  );
}
