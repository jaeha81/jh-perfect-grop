'use client';
import { Section, Field, Select, BooleanToggle } from './FormPrimitives';
import StepNav from './StepNav';
import {
  REGIONS,
  LOADING_DIFFICULTY,
  PARKING_ACCESS,
  DUST_NOISE_RESTRICTION,
  WASTE_LEVEL,
  COMPLAINT_RISK,
} from '@/data/estimate-options';
import { validateStep } from '@/lib/estimate-validators';

export default function StepSiteConditions({ state, dispatch, onNext }) {
  const s = state.site;
  const set = (field) => (e) =>
    dispatch({
      type: 'UPDATE_FIELD',
      group: 'site',
      field,
      value: e.target ? e.target.value : e,
    });
  const setBool = (field) => (val) =>
    dispatch({ type: 'UPDATE_FIELD', group: 'site', field, value: val });

  const check = validateStep(3, state);

  return (
    <Section
      title="STEP 3 · 현장 여건"
      desc="반입 동선·작업 시간·운영 상태는 비용과 일정에 직접 영향을 미칩니다."
    >
      <Field label="지역" required>
        <Select value={s.region} onChange={set('region')} options={REGIONS} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="엘리베이터 유무">
          <BooleanToggle value={s.hasElevator} onChange={setBool('hasElevator')} labels={['있음', '없음']} />
        </Field>
        <Field label="화물 엘리베이터 유무">
          <BooleanToggle value={s.hasFreightElevator} onChange={setBool('hasFreightElevator')} labels={['있음', '없음']} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="자재 반입 난이도">
          <Select value={s.loadingDifficulty} onChange={set('loadingDifficulty')} options={LOADING_DIFFICULTY} />
        </Field>
        <Field label="주차/하차 가능 여부">
          <Select value={s.parkingAccess} onChange={set('parkingAccess')} options={PARKING_ACCESS} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="소음/분진 제한">
          <Select value={s.dustNoiseRestriction} onChange={set('dustNoiseRestriction')} options={DUST_NOISE_RESTRICTION} />
        </Field>
        <Field label="폐기물 발생 수준">
          <Select value={s.wasteLevel} onChange={set('wasteLevel')} options={WASTE_LEVEL} />
        </Field>
      </div>

      <Field label="민원 가능성">
        <Select value={s.complaintRisk} onChange={set('complaintRisk')} options={COMPLAINT_RISK} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
        <Field label="야간 작업 필요">
          <BooleanToggle value={s.needsNightWork} onChange={setBool('needsNightWork')} />
        </Field>
        <Field label="주말 작업 필요">
          <BooleanToggle value={s.needsWeekendWork} onChange={setBool('needsWeekendWork')} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="운영 중 공사">
          <BooleanToggle value={s.isOperatingDuringConstruction} onChange={setBool('isOperatingDuringConstruction')} />
        </Field>
        <Field label="외부 장비 필요" hint="크레인·사다리차 등">
          <BooleanToggle value={s.specialEquipmentNeed} onChange={setBool('specialEquipmentNeed')} />
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
