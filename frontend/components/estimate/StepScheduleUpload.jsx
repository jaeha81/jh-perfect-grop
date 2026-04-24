'use client';
import { useRef, useState } from 'react';
import { Section, Field, TextInput, TextArea, Select } from './FormPrimitives';
import StepNav from './StepNav';
import { WORK_TIMEFRAMES, SCHEDULE_PRIORITIES } from '@/data/estimate-options';
import { validateUpload } from '@/lib/estimate-validators';

const UPLOAD_ZONES = [
  {
    kind: 'photos',
    label: '현장사진',
    icon: '📷',
    accept: 'image/jpeg,image/png,image/webp',
    hint: 'JPG/PNG/WEBP · 최대 10MB · 최대 4장',
    placeholder: '현장 상태, 기존 인테리어 사진',
    border: 'rgba(124,106,247,0.35)',
    bg: 'rgba(124,106,247,0.04)',
    badge: { bg: 'rgba(124,106,247,0.15)', color: '#a78bfa' },
    maxCount: 4,
  },
  {
    kind: 'drawings',
    label: '도면/이미지',
    icon: '📐',
    accept: 'image/jpeg,image/png,image/webp,application/pdf',
    hint: 'JPG/PNG/WEBP · 최대 10MB · 최대 2장 (PDF는 파일명만 기록)',
    placeholder: '평면도, 배치도 — JPG/PNG를 올려야 AI 분석 가능',
    border: 'rgba(34,211,160,0.35)',
    bg: 'rgba(34,211,160,0.04)',
    badge: { bg: 'rgba(34,211,160,0.12)', color: '#34d3a0' },
    maxCount: 2,
  },
  {
    kind: 'sketches',
    label: '스케치',
    icon: '✏️',
    accept: 'image/jpeg,image/png,image/webp',
    hint: 'JPG/PNG/WEBP · 최대 10MB · 최대 2장',
    placeholder: '손으로 그린 레이아웃, 아이디어 스케치',
    border: 'rgba(251,191,36,0.35)',
    bg: 'rgba(251,191,36,0.04)',
    badge: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
    maxCount: 2,
  },
];

/* ─── 미리보기 패널 (우측) ─────────────────────────── */
function PreviewPanel({ uploads }) {
  const totalCount =
    uploads.photos.length + uploads.drawings.length + uploads.sketches.length;

  if (totalCount === 0) {
    return (
      <div
        className="hidden lg:flex flex-col items-center justify-center rounded-xl text-center px-4 py-10 gap-3"
        style={{ border: '1px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
      >
        <span className="text-3xl opacity-30">🖼</span>
        <p className="text-[0.78rem] text-[#555] leading-[1.6]">
          파일을 업로드하면<br />여기서 미리 볼 수 있어요
        </p>
      </div>
    );
  }

  return (
    <div
      className="hidden lg:flex flex-col gap-4 rounded-xl p-4 sticky top-4"
      style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
    >
      <p className="text-[0.78rem] text-[#888] font-semibold tracking-wider uppercase">
        업로드 미리보기 ({totalCount}개)
      </p>

      {UPLOAD_ZONES.map((zone) => {
        const files = uploads[zone.kind];
        if (files.length === 0) return null;
        return (
          <div key={zone.kind} className="flex flex-col gap-2">
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-medium w-fit"
              style={{ background: zone.badge.bg, color: zone.badge.color }}
            >
              {zone.icon} {zone.label} {files.length}개
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {files.map((f, i) => (
                <div key={i} className="rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }}>
                  {f.preview ? (
                    <img
                      src={f.preview}
                      alt={f.name}
                      className="w-full h-full object-cover"
                      title={f.name}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center gap-1 p-1"
                      style={{ background: 'rgba(34,211,160,0.08)', border: '1px solid rgba(34,211,160,0.15)' }}
                    >
                      <span className="text-lg">📄</span>
                      <span
                        className="text-[0.6rem] text-center leading-tight text-[#888] truncate w-full px-1"
                        title={f.name}
                      >
                        {f.name}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── 업로드 존 (공통 컴포넌트) ──────────────────────── */
function UploadZone({ zone, files, dispatch, inputRef }) {
  const [dragging, setDragging] = useState(false);

  function readFile(file, onDone) {
    const reader = new FileReader();
    reader.onload = (e) => onDone(e.target.result);
    reader.readAsDataURL(file);
  }

  function handleFile(file) {
    if (!file) return;
    // 존별 최대 파일 수 초과 방지
    if (zone.maxCount && files.length >= zone.maxCount) {
      dispatch({ type: 'SET_ERROR', message: `${zone.label}는 최대 ${zone.maxCount}개까지 업로드할 수 있습니다.` });
      return;
    }
    const check = validateUpload(file, zone.kind);
    if (!check.ok) {
      dispatch({ type: 'SET_ERROR', message: check.reason });
      return;
    }
    // PDF는 미리보기 없이 파일명만 저장
    if (file.type === 'application/pdf') {
      dispatch({
        type: 'ADD_UPLOAD',
        kind: zone.kind,
        file: { name: file.name, type: file.type, size: file.size, preview: null, base64: null, isPdf: true },
      });
      // PDF base64 따로 읽기 (백엔드 전송용)
      readFile(file, (dataUrl) => {
        // PDF는 preview 없이 base64만 업데이트 — 여기선 단순히 재dispatch
        // (파일이 이미 추가됐으므로 별도 처리 불필요, 향후 확장 가능)
      });
      return;
    }
    readFile(file, (dataUrl) => {
      const base64 = dataUrl.split(',')[1];
      dispatch({
        type: 'ADD_UPLOAD',
        kind: zone.kind,
        file: { name: file.name, type: file.type, size: file.size, preview: dataUrl, base64 },
      });
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 드롭 존 */}
      <div
        className="w-full rounded-xl p-4 text-center cursor-pointer transition-all duration-150"
        style={{
          border: `2px dashed ${dragging ? zone.border : zone.border.replace('0.35', '0.2')}`,
          background: dragging ? zone.bg : 'transparent',
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          Array.from(e.dataTransfer.files || []).forEach(handleFile);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={zone.accept}
          multiple
          className="hidden"
          onChange={(e) => {
            Array.from(e.target.files || []).forEach(handleFile);
            e.target.value = '';
          }}
        />
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-2xl">{zone.icon}</span>
          <span className="text-[0.82rem] font-semibold" style={{ color: zone.badge.color }}>
            {zone.label}
          </span>
          <span className="text-[0.75rem] text-[#555]">{zone.placeholder}</span>
          <span
            className="text-[0.68rem] px-2 py-0.5 rounded-full mt-0.5"
            style={{ background: zone.badge.bg, color: zone.badge.color }}
          >
            {zone.hint}
          </span>
        </div>
      </div>

      {/* 업로드된 파일 목록 */}
      {files.length > 0 && (
        <div className={zone.kind === 'drawings' ? 'flex flex-col gap-1' : 'grid grid-cols-3 sm:grid-cols-4 gap-2'}>
          {files.map((f, i) =>
            zone.kind === 'drawings' ? (
              /* 도면: 리스트 형태 */
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-[0.8rem]"
                style={{ background: 'rgba(34,211,160,0.05)', border: '1px solid rgba(34,211,160,0.12)' }}
              >
                <span className="text-[#c4c2d8] truncate">
                  {f.type === 'application/pdf' ? '📄' : '🖼'} {f.name}
                </span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'REMOVE_UPLOAD', kind: zone.kind, index: i })}
                  className="ml-2 shrink-0 text-[0.7rem] w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#888', border: 'none', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            ) : (
              /* 사진/스케치: 썸네일 그리드 */
              <div key={i} className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }}>
                {f.preview ? (
                  <img src={f.preview} alt={f.name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center gap-1 p-1"
                    style={{ background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.15)' }}
                  >
                    <span className="text-lg">🖼</span>
                    <span className="text-[0.6rem] text-center leading-tight text-[#888] truncate w-full px-1" title={f.name}>
                      {f.name}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'REMOVE_UPLOAD', kind: zone.kind, index: i })}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[0.65rem]"
                  style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ─── 메인 컴포넌트 ───────────────────────────────── */
export default function StepScheduleUpload({ state, dispatch, onSubmit, submitting }) {
  const s = state.schedule;
  const photoRef = useRef();
  const drawingRef = useRef();
  const sketchRef = useRef();

  const inputRefs = { photos: photoRef, drawings: drawingRef, sketches: sketchRef };

  const set = (field) => (e) =>
    dispatch({
      type: 'UPDATE_FIELD',
      group: 'schedule',
      field,
      value: e.target ? e.target.value : e,
    });

  return (
    <Section
      title="STEP 6 · 일정 / 업로드"
      desc="일정은 모두 선택 항목이지만 구체적일수록 일정 리스크를 정확하게 진단할 수 있습니다."
    >
      {/* 일정 필드 */}
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

      {/* 업로드 + 미리보기 패널 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start mt-1">
        {/* 왼쪽: 3개 업로드 존 */}
        <div className="flex flex-col gap-4">
          <p className="text-[0.78rem] text-[#888] font-semibold tracking-wider uppercase -mb-1">
            파일 업로드 <span className="text-[#555] normal-case font-normal">(모두 선택사항)</span>
          </p>
          {UPLOAD_ZONES.map((zone) => (
            <UploadZone
              key={zone.kind}
              zone={zone}
              files={state.uploads[zone.kind]}
              dispatch={dispatch}
              inputRef={inputRefs[zone.kind]}
            />
          ))}
        </div>

        {/* 오른쪽: 실시간 미리보기 */}
        <PreviewPanel uploads={state.uploads} />
      </div>

      <Field label="추가 요청사항">
        <TextArea
          value={state.additionalRequests}
          onChange={(e) =>
            dispatch({ type: 'UPDATE_FIELD', group: '_root', field: 'additionalRequests', value: e.target.value })
          }
          placeholder="자재 브랜드, 디자인 톤, 특이사항 등 자유롭게 입력"
        />
      </Field>

      <div
        className="rounded-lg px-4 py-3 mt-1 text-[0.82rem] leading-[1.6]"
        style={{ background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.18)', color: '#a09eb8' }}
      >
        📎 사진·도면 이미지(JPG/PNG)·스케치를 함께 올리면 AI가 공간을 더 정밀하게 분석합니다. PDF는 파일명만 기록되며 AI 이미지 분석에는 도면 JPG/PNG를 권장합니다.
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
