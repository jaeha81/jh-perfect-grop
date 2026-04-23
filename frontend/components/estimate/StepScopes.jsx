'use client';
import { Section, Field, RadioGroup, BooleanToggle, TextInput, CheckboxGrid } from './FormPrimitives';
import StepNav from './StepNav';
import { WORK_SCOPES } from '@/data/estimate-options';
import { getActiveConditionalGroups } from '@/data/estimate-conditional';
import { validateStep } from '@/lib/estimate-validators';

export default function StepScopes({ state, dispatch, onNext }) {
  const { selected = [], conditional = {} } = state.scopes;
  const check = validateStep(4, state);

  // 그룹별로 묶어 표시
  const groups = WORK_SCOPES.reduce((acc, s) => {
    (acc[s.group] ||= []).push(s);
    return acc;
  }, {});

  const activeConditionals = getActiveConditionalGroups(state);

  return (
    <Section
      title="STEP 4 · 공사 범위"
      desc="시공이 필요한 공종을 모두 선택해 주세요. 최소 1개 이상."
    >
      {Object.entries(groups).map(([groupName, items]) => (
        <div key={groupName} className="mb-4">
          <div className="text-[#6b6a80] text-[0.75rem] font-semibold tracking-wider uppercase mb-2">
            {groupName}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {items.map((it) => {
              const active = selected.includes(it.key);
              return (
                <button
                  type="button"
                  key={it.key}
                  onClick={() => dispatch({ type: 'TOGGLE_SCOPE', scope: it.key })}
                  className="px-3 py-2 rounded-lg text-[0.83rem] text-left transition-colors duration-150"
                  style={{
                    background: active ? 'rgba(34,211,160,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(34,211,160,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: active ? '#22d3a0' : '#c4c2d8',
                  }}
                >
                  <span className="mr-2 font-bold">{active ? '✓' : '○'}</span>
                  {it.key}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selected.length > 0 && (
        <div className="mt-2 text-[0.82rem] text-[#8b8a9e]">
          선택 {selected.length}개: <span className="text-[#22d3a0]">{selected.join(', ')}</span>
        </div>
      )}

      {/* 조건부 질문 */}
      {activeConditionals.length > 0 && (
        <div className="mt-6 pt-5 border-t border-white/[0.06]">
          <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-3">
            선택 항목 기반 추가 질문
          </div>
          {activeConditionals.map((group) => (
            <div key={group.id} className="mb-5">
              <div className="text-[#c4c2d8] text-[0.88rem] font-semibold mb-2">
                ↳ {group.title}
              </div>
              <div className="space-y-3 pl-3 border-l-2 border-[rgba(124,106,247,0.25)]">
                {group.questions.map((q) => (
                  <Field key={q.key} label={q.label}>
                    {q.type === 'boolean' && (
                      <BooleanToggle
                        value={conditional[q.key] ?? null}
                        onChange={(val) => dispatch({ type: 'SET_CONDITIONAL', key: q.key, value: val })}
                      />
                    )}
                    {q.type === 'number' && (
                      <TextInput
                        type="number"
                        min={q.min ?? 0}
                        max={q.max}
                        value={conditional[q.key] ?? ''}
                        onChange={(e) =>
                          dispatch({ type: 'SET_CONDITIONAL', key: q.key, value: e.target.value })
                        }
                      />
                    )}
                    {q.type === 'radio' && (
                      <RadioGroup
                        value={conditional[q.key] ?? ''}
                        onChange={(v) => dispatch({ type: 'SET_CONDITIONAL', key: q.key, value: v })}
                        options={q.options}
                      />
                    )}
                    {q.type === 'select' && (
                      <RadioGroup
                        value={conditional[q.key] ?? ''}
                        onChange={(v) => dispatch({ type: 'SET_CONDITIONAL', key: q.key, value: v })}
                        options={q.options}
                      />
                    )}
                    {q.type === 'checkboxes' && (
                      <CheckboxGrid
                        options={q.options}
                        selected={Array.isArray(conditional[q.key]) ? conditional[q.key] : []}
                        onToggle={(opt) =>
                          dispatch({ type: 'TOGGLE_CONDITIONAL_CHECKBOX', key: q.key, option: opt })
                        }
                        columns={3}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <StepNav
        onNext={onNext}
        onPrev={() => dispatch({ type: 'PREV_STEP' })}
        canNext={check.ok}
        errorMessages={!check.ok ? check.messages : []}
      />
    </Section>
  );
}
