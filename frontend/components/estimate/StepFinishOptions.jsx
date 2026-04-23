'use client';
import { Section, Field, CheckboxGrid } from './FormPrimitives';
import StepNav from './StepNav';
import { FINISH_GRADES, SPECIAL_ITEMS, PRIORITY_FOCUS } from '@/data/estimate-options';
import { validateStep } from '@/lib/estimate-validators';

export default function StepFinishOptions({ state, dispatch, onNext }) {
  const f = state.finish;
  const check = validateStep(5, state);

  return (
    <Section
      title="STEP 5 · 마감 수준 및 별도항목"
      desc="전체 마감 등급과 비용·품질 중 어느 쪽을 더 중요하게 보는지 선택해 주세요. 별도항목은 일반 견적과 분리 표기됩니다."
    >
      <Field label="전체 마감 등급" required>
        <div className="grid grid-cols-2 gap-2">
          {FINISH_GRADES.map((g) => {
            const active = f.finishGrade === g.value;
            return (
              <button
                type="button"
                key={g.value}
                onClick={() =>
                  dispatch({ type: 'UPDATE_FIELD', group: 'finish', field: 'finishGrade', value: g.value })
                }
                className="px-4 py-3 rounded-xl text-left transition-colors duration-150"
                style={{
                  background: active ? 'rgba(124,106,247,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? 'rgba(124,106,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <div className="text-[#e8e6f0] text-[0.9rem] font-semibold">{g.label}</div>
                <div className="text-[#6b6a80] text-[0.75rem] mt-0.5 leading-[1.4]">{g.desc}</div>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="우선 기준 (복수 선택 가능)">
        <CheckboxGrid
          options={PRIORITY_FOCUS}
          selected={f.priorityFocus}
          onToggle={(v) => dispatch({ type: 'TOGGLE_PRIORITY', item: v })}
          columns={3}
        />
      </Field>

      <Field
        label="별도 항목"
        hint="선택한 항목은 본 견적에서 분리 표기됩니다"
      >
        <CheckboxGrid
          options={SPECIAL_ITEMS}
          selected={f.specialItems}
          onToggle={(v) => dispatch({ type: 'TOGGLE_SPECIAL', item: v })}
          columns={3}
        />
      </Field>

      <div
        className="rounded-lg px-4 py-3 text-[0.8rem] leading-[1.55] mt-2"
        style={{ background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.18)', color: '#a09eb8' }}
      >
        별도 항목은 <span className="text-[#a78bfa] font-semibold">금액이 별도로 표기</span>되며,
        실제 수량·사양에 따라 현장 확인 후 최종 금액이 확정됩니다.
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
