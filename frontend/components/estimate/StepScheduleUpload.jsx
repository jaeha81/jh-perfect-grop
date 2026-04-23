'use client';
import { useRef } from 'react';
import { Section, Field, TextInput, TextArea, Select } from './FormPrimitives';
import StepNav from './StepNav';
import { WORK_TIMEFRAMES, SCHEDULE_PRIORITIES } from '@/data/estimate-options';
import { validateUpload } from '@/lib/estimate-validators';

export default function StepScheduleUpload({ state, dispatch, onSubmit, submitting }) {
  const s = state.schedule;
  const photoRef = useRef();
  const drawingRef = useRef();

  const set = (field) => (e) =>
    dispatch({
      type: 'UPDATE_FIELD',
      group: 'schedule',
      field,
      value: e.target ? e.target.value : e,
    });

  function readFile(file, onDone) {
    const reader = new FileReader();
    reader.onload = (e) => onDone(e.target.result);
    reader.readAsDataURL(file);
  }

  function handleUpload(kind, file) {
    if (!file) return;
    const check = validateUpload(file);
    if (!check.ok) {
      dispatch({ type: 'SET_ERROR', message: check.reason });
      return;
    }
    readFile(file, (dataUrl) => {
      const base64 = dataUrl.split(',')[1];
      dispatch({
        type: 'ADD_UPLOAD',
        kind,
        file: { name: file.name, type: file.type, size: file.size, preview: dataUrl, base64 },
      });
    });
  }

  return (
    <Section
      title="STEP 6 · 일정 / 업로드"
      desc="일정은 모두 선택 항목이지만 구체적일수록 일정 리스크를 정확하게 진단할 수 있습니다."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="희망 착공일">
          <TextInput type="date" value={s.preferredStartDate} onChange={set('preferredStartDate')} />
        </Field>
        <Field label="희망 완료일">
          <TextInput type="date" value={s.preferredEndDate} onChange={set('preferredEndDate')} />
        </Field>
        <Field label="오픈일 / 입주일">
          <TextInput type="date" value={s.openingDate} onChange={set('openingDate')} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="공사 가능 시간대">
          <Select value={s.workTimeframe} onChange={set('workTimeframe')} options={WORK_TIMEFRAMES} />
        </Field>
        <Field label="일정 우선 기준">
          <Select value={s.schedulePriority} onChange={set('schedulePriority')} options={SCHEDULE_PRIORITIES} />
        </Field>
      </div>

      <Field label="우선 완료 필요 구역" hint="예: 주방 먼저 오픈 등">
        <TextInput value={s.priorityZone} onChange={set('priorityZone')} placeholder="해당 없으면 비워두세요" />
      </Field>

      <Field label="사진 업로드" hint="JPG/PNG/WEBP, 10MB 이하">
        <div
          className="w-full rounded-lg p-5 text-center cursor-pointer"
          style={{ border: '2px dashed rgba(124,106,247,0.3)' }}
          onClick={() => photoRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            Array.from(e.dataTransfer.files || []).forEach((f) => handleUpload('photos', f));
          }}
        >
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => Array.from(e.target.files || []).forEach((f) => handleUpload('photos', f))}
          />
          <span className="text-[#555] text-[0.85rem]">클릭하거나 이미지를 드래그하세요</span>
        </div>
        {state.uploads.photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
            {state.uploads.photos.map((f, i) => (
              <div key={i} className="relative rounded overflow-hidden">
                <img src={f.preview} alt={f.name} className="w-full h-[80px] object-cover" />
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'REMOVE_UPLOAD', kind: 'photos', index: i })}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full text-[0.7rem]"
                  style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      <Field label="도면 업로드" hint="PDF/JPG/PNG, 10MB 이하">
        <div
          className="w-full rounded-lg p-4 text-center cursor-pointer"
          style={{ border: '2px dashed rgba(34,211,160,0.25)' }}
          onClick={() => drawingRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            Array.from(e.dataTransfer.files || []).forEach((f) => handleUpload('drawings', f));
          }}
        >
          <input
            ref={drawingRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => Array.from(e.target.files || []).forEach((f) => handleUpload('drawings', f))}
          />
          <span className="text-[#555] text-[0.85rem]">평면도·배치도가 있으면 더 정확합니다</span>
        </div>
        {state.uploads.drawings.length > 0 && (
          <div className="flex flex-col gap-1 mt-2">
            {state.uploads.drawings.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded text-[0.82rem]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="text-[#c4c2d8] truncate">📄 {f.name}</span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'REMOVE_UPLOAD', kind: 'drawings', index: i })}
                  className="text-[#555] text-[0.75rem]"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      <Field label="추가 요청사항">
        <TextArea
          value={state.additionalRequests}
          onChange={(e) => dispatch({ type: 'UPDATE_FIELD', group: '_root', field: 'additionalRequests', value: e.target.value })}
          placeholder="자재 브랜드, 디자인 톤, 특이사항 등 자유롭게 입력"
        />
      </Field>

      <div
        className="rounded-lg px-4 py-3 mt-1 text-[0.82rem] leading-[1.6]"
        style={{ background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.18)', color: '#a09eb8' }}
      >
        입력하신 정보가 구체적일수록 견적 정확도가 높아집니다. 사진 및 도면을 함께 올리면 더 정밀한 분석이 가능합니다.
      </div>

      <StepNav
        onNext={onSubmit}
        onPrev={() => dispatch({ type: 'PREV_STEP' })}
        canNext={!submitting}
        nextLabel={submitting ? '분석 준비 중...' : '견적 분석 시작'}
        errorMessages={state.error ? [state.error] : []}
      />
    </Section>
  );
}
