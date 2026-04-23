'use client';
import { Section, Field, TextInput, Select, RadioGroup } from './FormPrimitives';
import StepNav from './StepNav';
import {
  CONSULTATION_PURPOSES,
  BUDGET_RANGES,
  CONTACT_PREFERENCES,
} from '@/data/estimate-options';
import { validateStep } from '@/lib/estimate-validators';

export default function StepCustomerInfo({ state, dispatch, onNext }) {
  const c = state.customer;
  const set = (field) => (e) =>
    dispatch({
      type: 'UPDATE_FIELD',
      group: 'customer',
      field,
      value: e.target ? e.target.value : e,
    });

  const check = validateStep(1, state);

  return (
    <Section title="STEP 1 · 고객 기본정보" desc="상담 진행 시 필요한 기본 정보를 입력해 주세요. 이름과 연락처만 필수입니다.">
      <Field label="고객명" required>
        <TextInput value={c.customerName} onChange={set('customerName')} placeholder="홍길동" />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="연락처" required hint="숫자/하이픈">
          <TextInput value={c.phone} onChange={set('phone')} placeholder="010-1234-5678" />
        </Field>
        <Field label="이메일">
          <TextInput value={c.email} onChange={set('email')} placeholder="name@domain.com" type="email" />
        </Field>
      </div>

      <Field label="현장 주소" hint="도로명 또는 지번 주소">
        <TextInput value={c.address} onChange={set('address')} placeholder="예) 서울시 강남구 ○○로 123" />
      </Field>

      <Field label="상담 목적">
        <Select value={c.consultationPurpose} onChange={set('consultationPurpose')} options={CONSULTATION_PURPOSES} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="예산 범위">
          <Select value={c.budgetRange} onChange={set('budgetRange')} options={BUDGET_RANGES} />
        </Field>
        <Field label="연락 선호 방식">
          <Select value={c.contactPreference} onChange={set('contactPreference')} options={CONTACT_PREFERENCES} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="희망 착공일">
          <TextInput type="date" value={c.preferredStartDate} onChange={set('preferredStartDate')} />
        </Field>
        <Field label="희망 완료일 / 오픈일">
          <TextInput type="date" value={c.preferredEndDate} onChange={set('preferredEndDate')} />
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
