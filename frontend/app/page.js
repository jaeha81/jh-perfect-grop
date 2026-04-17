'use client';
import { useState, useRef, useEffect } from 'react';

const AGENTS = ['SCANNER', 'ESTIMATOR', 'PRICER', 'VALIDATOR', 'REPORTER'];

// 이력 관련 상수 및 함수
const HISTORY_KEY = 'jh_estimate_history';
const MAX_HISTORY = 10;

function saveToHistory(estimateData) {
  try {
    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('ko-KR'),
      type: estimateData.type,
      area: estimateData.area,
      min_cost: estimateData.min_cost,
      max_cost: estimateData.max_cost,
      unit_price: estimateData.unit_price,
      breakdown: estimateData.breakdown,
      validator_flags: estimateData.validator_flags,
      expert_comment: estimateData.expert_comment,
    };
    const updated = [entry, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch { return []; }
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

const DEMO_VALUES = {
  type: '인테리어',
  area: '99.17',
  description: '아파트 전체 인테리어, 주방 풀셋 교체(씽크대/가전), 욕실 2개 타일+양변기+세면대, 거실+방3개 강마루, 도배 전체 실크, 조명 LED 전체 교체',
};

export default function Home() {
  const [form, setForm] = useState({ type: '인테리어', area: '', description: '' });
  const [imgFile, setImgFile] = useState(null);   // { preview, base64 }
  const [imgHover, setImgHover] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [doneSteps, setDoneSteps] = useState([]);
  const [parallelSteps, setParallelSteps] = useState(new Set()); // 병렬 실행 단계
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [compareResult, setCompareResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [editBreakdown, setEditBreakdown] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [dismissedFlags, setDismissedFlags] = useState(new Set());
  const fileRef = useRef();

  // 마운트 시 이력 로드
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const fmt = (n) => n != null ? n.toLocaleString('ko-KR') + '원' : '-';

  // 데모 자동 입력
  function loadDemo() {
    setForm(DEMO_VALUES);
  }

  // VALIDATOR 강조 데모 (바닥재만 → 이상치 탐지)
  function loadDemoValidator() {
    setForm({ type: '인테리어', area: '99.17', description: '바닥재(강마루)만 교체. 다른 공사 없음.' });
  }

  // 비교 견적 데모 (프리미엄 시나리오)
  function loadDemoCompare() {
    setForm({ type: '리모델링', area: '132.0', description: '40평 리모델링, 주방·욕실 2개 전면 교체, 창호 전체 교체(LG지인), 거실+방4개 강마루, 도배 전체, 전기 전면, 냉난방 시스템에어컨 4대' });
  }

  // 이미지 → base64 변환
  function handleImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const base64 = dataUrl.split(',')[1];
      setImgFile({ preview: dataUrl, base64 });
    };
    reader.readAsDataURL(file);
  }

  async function submit(e) {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    setActiveStep(-1); setDoneSteps([]); setParallelSteps(new Set());

    const body = {
      ...form,
      area: parseFloat(form.area),
      ...(imgFile ? { image_base64: imgFile.base64 } : {}),
    };

    try {
      const res = await fetch('/api/estimate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const dataLine = line.trim();
          if (!dataLine.startsWith('data:')) continue;
          try {
            const parsed = JSON.parse(dataLine.slice(5).trim());
            const { event, agent, step, data } = parsed;

            if (event === 'pipeline_start') {
              setActiveStep(0);
              setDoneSteps([]);
            } else if (event === 'agent_start') {
              setActiveStep(step);
              if (parsed.parallel) setParallelSteps(prev => new Set([...prev, step]));
            } else if (event === 'agent_done') {
              setDoneSteps(prev => [...new Set([...prev, step])]);
              setActiveStep(step + 1 < AGENTS.length ? step + 1 : -1);
            } else if (event === 'complete') {
              setDoneSteps([0, 1, 2, 3, 4]);
              setActiveStep(-1);
              setResult(data);
              setHistory(saveToHistory(data));
            } else if (event === 'error') {
              throw new Error(parsed.message);
            }
          } catch (parseErr) {
            console.warn('[SSE] JSON parse failed:', line, parseErr);
          }
        }
      }
    } catch (err) {
      setError(err.message);
      setActiveStep(-1);
    } finally {
      setLoading(false);
    }
  }

  async function submitCompare(e) {
    e.preventDefault();
    if (parseFloat(form.area) <= 0 || !form.description.trim()) return;
    setError(''); setCompareResult(null); setLoading(true);
    setActiveStep(0); setDoneSteps([]); setParallelSteps(new Set([2, 3]));

    const body = {
      ...form,
      area: parseFloat(form.area),
      ...(imgFile ? { image_base64: imgFile.base64 } : {}),
    };

    try {
      const res = await fetch('/api/estimate/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const data = await res.json();
      setDoneSteps([0, 1, 2, 3, 4]);
      setActiveStep(-1);
      setParallelSteps(new Set([2, 3])); // PRICER+VALIDATOR 병렬 유지 표시
      setCompareResult(data);
    } catch (err) {
      setError(err.message);
      setActiveStep(-1);
    } finally {
      setLoading(false);
    }
  }

  // PDF 다운로드
  function downloadPdf() {
    if (!result?.pdf_base64) return;
    const blob = new Blob([Uint8Array.from(atob(result.pdf_base64), c => c.charCodeAt(0))], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JH견적서_${result.type}_${result.area}m².pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Excel 다운로드
  function downloadExcel() {
    if (!result?.excel_base64) return;
    const blob = new Blob([Uint8Array.from(atob(result.excel_base64), c => c.charCodeAt(0))], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JH견적서_${result.type}_${result.area}m².xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 단가 수동 조정 — 편집 시작
  function startEdit() {
    setEditBreakdown({ ...result.breakdown });
    setEditMode(true);
  }

  // 단가 수동 조정 — 재계산
  async function recalculate() {
    setRecalculating(true);
    setError('');
    try {
      const res = await fetch('/api/estimate/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: result.type,
          area: result.area,
          breakdown: editBreakdown,
          work_items: result.work_items,
          summary: result.summary,
          scanner_context: result.scanner_context,
        }),
      });
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const data = await res.json();
      setResult(data);
      setEditMode(false);
      setDismissedFlags(new Set());
      setHistory(saveToHistory(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setRecalculating(false);
    }
  }

  // VALIDATOR 플래그 무시
  function toggleDismissFlag(i) {
    setDismissedFlags(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  // breakdown 합계 (editMode면 editBreakdown 기준)
  const activeBreakdown = editMode ? editBreakdown : (result?.breakdown || {});
  const total = Object.values(activeBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 sm:px-8 py-8 bg-[#0a0a0f]">
      <div className="w-full max-w-[680px] mx-auto">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-[2.2rem] font-extrabold m-0 bg-transparent"
              style={{ background: 'linear-gradient(135deg,#7c6af7,#22d3a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              JH EstimateAI
            </h1>
            <p className="text-[#6b6a80] text-[0.9rem] mt-1">18년 현장 경험 기반 · 5 에이전트 AI 견적 시스템</p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(v => !v)}
              className="text-[0.8rem] font-semibold px-3 py-1.5 rounded-lg border"
              style={{ background: 'rgba(124,106,247,0.12)', border: '1px solid rgba(124,106,247,0.3)', color: '#a78bfa' }}
            >
              이력 {history.length}건
            </button>
          )}
        </div>

        {/* 이력 패널 */}
        {showHistory && history.length > 0 && (
          <div className="rounded-2xl p-6 mb-5" style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-[0.78rem] font-semibold tracking-widest uppercase mb-4" style={{ color: '#a09eb8' }}>최근 견적 이력</div>
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                  onClick={() => { setResult(h); setShowHistory(false); setDoneSteps([0,1,2,3,4]); setCompareResult(null); }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[0.75rem] px-2 py-0.5 rounded" style={{ background: 'rgba(124,106,247,0.15)', color: '#a78bfa' }}>{h.type}</span>
                    <span className="text-[0.85rem]" style={{ color: '#c4c2d8' }}>{h.area}m²</span>
                    <span className="text-[0.82rem]" style={{ color: '#8b8a9e' }}>{h.date}</span>
                  </div>
                  <span className="text-[0.85rem] font-semibold" style={{ color: '#7c6af7' }}>
                    {h.min_cost?.toLocaleString('ko-KR')}원~
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { localStorage.removeItem(HISTORY_KEY); setHistory([]); setShowHistory(false); }}
              className="mt-3 text-[0.75rem]"
              style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              이력 삭제
            </button>
          </div>
        )}

        {/* 입력 폼 카드 */}
        <div className="bg-[#13131a] border border-white/[0.07] rounded-2xl p-8 mb-5">
          <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-5">견적 정보 입력</div>

          {/* 데모 버튼 3종 */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <button
              type="button"
              onClick={loadDemo}
              className="py-[0.55rem] rounded-lg text-[0.78rem] font-semibold cursor-pointer transition-colors duration-150"
              style={{ background: 'rgba(34,211,160,0.1)', border: '1px solid rgba(34,211,160,0.35)', color: '#22d3a0' }}
            >
              ▶ 정상 시나리오
            </button>
            <button
              type="button"
              onClick={loadDemoValidator}
              className="py-[0.55rem] rounded-lg text-[0.78rem] font-semibold cursor-pointer transition-colors duration-150"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', color: '#fbbf24' }}
            >
              ⚠ VALIDATOR 시나리오
            </button>
            <button
              type="button"
              onClick={loadDemoCompare}
              className="py-[0.55rem] rounded-lg text-[0.78rem] font-semibold cursor-pointer transition-colors duration-150"
              style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.35)', color: '#a78bfa' }}
            >
              ⚖ 비교 시나리오
            </button>
          </div>

          <form onSubmit={submit}>

            <div className="mb-[1.1rem]">
              <label className="block text-[#8b8a9e] text-[0.83rem] mb-[0.4rem] font-medium">공사 유형</label>
              <select
                className="w-full bg-[#0d0d12] border border-white/[0.09] rounded-lg text-[#e8e6f0] px-4 py-[0.65rem] text-[0.95rem] outline-none"
                value={form.type}
                onChange={set('type')}
              >
                <option>인테리어</option>
                <option>신축</option>
                <option>리모델링</option>
              </select>
            </div>

            <div className="mb-[1.1rem]">
              <label className="block text-[#8b8a9e] text-[0.83rem] mb-[0.4rem] font-medium">면적 (m²) <span style={{fontWeight:'normal',opacity:0.7}}>— 1평 ≈ 3.3m²</span></label>
              <input
                className="w-full bg-[#0d0d12] border border-white/[0.09] rounded-lg text-[#e8e6f0] px-4 py-[0.65rem] text-[0.95rem] outline-none"
                type="number"
                min="1"
                step="any"
                placeholder="예: 84.5"
                value={form.area}
                onChange={set('area')}
                required
              />
            </div>

            <div className="mb-[1.1rem]">
              <label className="block text-[#8b8a9e] text-[0.83rem] mb-[0.4rem] font-medium">공사 설명</label>
              <textarea
                className="w-full bg-[#0d0d12] border border-white/[0.09] rounded-lg text-[#e8e6f0] px-4 py-[0.65rem] text-[0.95rem] outline-none resize-y min-h-[80px]"
                placeholder="예: 아파트 전체 인테리어, 주방·욕실 포함, 강마루+실크도배"
                value={form.description}
                onChange={set('description')}
                required
              />
            </div>

            {/* 이미지 업로드 (SCANNER) */}
            <div className="mb-[1.1rem]">
              <label className="block text-[#8b8a9e] text-[0.83rem] mb-[0.4rem] font-medium">
                공간 사진 첨부 <span className="text-[#555] font-normal">(선택 · SCANNER 분석)</span>
              </label>
              <div
                className="w-full rounded-[10px] p-5 text-center cursor-pointer box-border transition-[border-color] duration-200"
                style={{
                  border: imgHover ? '2px dashed rgba(124,106,247,0.7)' : '2px dashed rgba(124,106,247,0.3)',
                }}
                onClick={() => fileRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setImgHover(true); }}
                onDragLeave={() => setImgHover(false)}
                onDrop={(e) => { e.preventDefault(); setImgHover(false); handleImage(e.dataTransfer.files[0]); }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleImage(e.target.files[0])}
                />
                {imgFile ? (
                  <img src={imgFile.preview} alt="preview" className="max-w-full max-h-[160px] rounded-lg object-cover mt-[0.6rem]" />
                ) : (
                  <span className="text-[#555] text-[0.85rem]">클릭하거나 이미지를 드래그하세요</span>
                )}
              </div>
              {imgFile && (
                <button
                  type="button"
                  onClick={() => setImgFile(null)}
                  className="mt-[0.4rem] bg-transparent border-none text-[#555] cursor-pointer text-[0.8rem]"
                >
                  ✕ 이미지 제거
                </button>
              )}
            </div>

            <button
              className="w-full py-[0.85rem] border-none rounded-[10px] text-white text-[1rem] font-bold cursor-pointer mt-[0.5rem] tracking-[0.02em] transition-opacity duration-200"
              style={{
                background: 'linear-gradient(135deg,#7c6af7,#5b4fd4)',
                opacity: loading ? 0.55 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              type="submit"
              disabled={loading}
            >
              {loading ? '에이전트 분석 중...' : '견적 산출하기'}
            </button>
            <button
              type="button"
              onClick={submitCompare}
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl font-bold text-[0.9rem]"
              style={{ background: 'rgba(34,211,160,0.1)', border: '1px solid rgba(34,211,160,0.3)', color: '#22d3a0', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.55 : 1 }}
            >
              {loading ? '분석 중...' : '⚖ 저가/표준/고급 비교 견적'}
            </button>
            {error && <p className="text-[#f87171] text-[0.85rem] mt-[0.5rem]">⚠ {error}</p>}
          </form>
        </div>

        {/* 에이전트 파이프라인 진행 */}
        {(loading || result) && (
          <div className="bg-[#13131a] border border-white/[0.07] rounded-2xl p-8 mb-5">
            <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-5">에이전트 파이프라인</div>
            <div className="flex items-center gap-[0.4rem] mb-4 flex-wrap">
              {AGENTS.map((name, i) => {
                const done = doneSteps.includes(i);
                const active = activeStep === i;
                const isParallel = parallelSteps.has(i);
                // VALIDATOR(3)→REPORTER(4) 사이는 병렬 구분선
                const connector = i === 3 ? ' ⟹ ' : ' → ';
                return (
                  <span key={name} className="flex items-center gap-[0.4rem]">
                    <span className="relative">
                      <span
                        className="text-xs sm:text-sm font-semibold px-[0.75rem] py-[0.35rem] rounded-[20px] transition-all duration-300"
                        style={{
                          background: done ? 'rgba(34,211,160,0.15)' : active ? 'rgba(124,106,247,0.2)' : 'rgba(255,255,255,0.05)',
                          color: done ? '#22d3a0' : active ? '#a78bfa' : '#555',
                          border: `1px solid ${done ? 'rgba(34,211,160,0.3)' : active ? 'rgba(124,106,247,0.4)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        {done ? '✓ ' : active ? '⟳ ' : ''}{name}
                      </span>
                      {isParallel && (
                        <span
                          className="absolute -top-[0.9rem] left-1/2 -translate-x-1/2 text-[0.6rem] font-bold px-[0.4rem] py-[0.1rem] rounded-full whitespace-nowrap"
                          style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}
                        >
                          병렬
                        </span>
                      )}
                    </span>
                    {i < AGENTS.length - 1 && (
                      <span style={{ color: i === 3 ? '#7c6af7' : '#333', fontSize: '0.85rem' }}>{connector}</span>
                    )}
                  </span>
                );
              })}
            </div>
            {parallelSteps.size > 0 && (
              <div className="text-[0.72rem] text-[#fbbf24]/60 mb-2">
                {compareResult
                  ? '⟹ 병렬 가동 — 저가·표준·고급 3등급 PRICER+VALIDATOR 동시 실행'
                  : '⟹ 병렬 가동 — PDF·Excel·요약 동시 생성'}
              </div>
            )}
          </div>
        )}

        {/* 결과 */}
        {result && (
          <>
            {/* SCANNER 결과 */}
            {result.scanner_context && (
              <div className="bg-[#13131a] border border-white/[0.07] rounded-2xl p-8 mb-5">
                <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-5">SCANNER — 공간 분석 결과</div>
                <div className="bg-[rgba(34,211,160,0.06)] border border-[rgba(34,211,160,0.2)] rounded-lg px-4 py-[0.8rem] mb-[0.8rem] text-[#7ac9bb] text-[0.85rem] leading-[1.55]">
                  {result.scanner_context}
                </div>
              </div>
            )}

            {/* 견적 요약 */}
            <div className="bg-[#13131a] border border-white/[0.07] rounded-2xl p-8 mb-5">
              <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-5">견적 결과</div>
              <div className="text-[2rem] font-extrabold text-[#7c6af7] mb-[0.4rem]">
                {fmt(result.min_cost)} ~ {fmt(result.max_cost)}
              </div>
              <div className="text-[#555] text-[0.82rem] mb-6">
                {result.area}m² · {result.type} · 기준단가 {fmt(result.unit_price)}/m²
              </div>

              {/* breakdown 바 차트 + 단가 수동 조정 */}
              <div className="flex items-center justify-between mb-[0.8rem]">
                <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase">공종별 내역</div>
                {!editMode ? (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="text-[0.75rem] px-3 py-1 rounded-lg font-semibold transition-colors duration-150"
                    style={{ background: 'rgba(124,106,247,0.12)', border: '1px solid rgba(124,106,247,0.3)', color: '#a78bfa', cursor: 'pointer' }}
                  >
                    ✎ 단가 수정
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={recalculate}
                      disabled={recalculating}
                      className="text-[0.75rem] px-3 py-1 rounded-lg font-semibold transition-colors duration-150"
                      style={{ background: 'rgba(34,211,160,0.15)', border: '1px solid rgba(34,211,160,0.4)', color: '#22d3a0', cursor: recalculating ? 'not-allowed' : 'pointer', opacity: recalculating ? 0.6 : 1 }}
                    >
                      {recalculating ? '재계산 중...' : '↻ 재계산'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      disabled={recalculating}
                      className="text-[0.75rem] px-3 py-1 rounded-lg font-semibold"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#555', cursor: 'pointer' }}
                    >
                      취소
                    </button>
                  </div>
                )}
              </div>
              {Object.entries(activeBreakdown).map(([k, v]) => {
                const pct = total > 0 ? Math.round(v / total * 100) : 0;
                return (
                  <div key={k} className="mb-[0.55rem]">
                    <div className="flex justify-between mb-[0.2rem] items-center">
                      <span className="text-xs sm:text-sm text-[#8b8a9e]">{k}</span>
                      {editMode ? (
                        <input
                          type="number"
                          min="0"
                          step="10000"
                          value={v}
                          onChange={e => setEditBreakdown(prev => ({ ...prev, [k]: parseInt(e.target.value) || 0 }))}
                          className="text-xs sm:text-sm font-semibold text-right rounded px-2 py-0.5 w-[120px]"
                          style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.4)', color: '#c4c2d8', outline: 'none' }}
                        />
                      ) : (
                        <span className="text-xs sm:text-sm text-[#c4c2d8] font-semibold">
                          {fmt(v)} <span className="text-[#444] font-normal">({pct}%)</span>
                        </span>
                      )}
                    </div>
                    <div className="h-[6px] bg-white/[0.06] rounded overflow-hidden">
                      <div
                        className="h-full rounded"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#7c6af7,#22d3a0)', transition: 'width .8s ease' }}
                      />
                    </div>
                  </div>
                );
              })}
              {editMode && (
                <div className="mt-2 pt-2 border-t border-white/[0.06] flex justify-between text-[0.82rem]">
                  <span className="text-[#8b8a9e]">수정 후 합계</span>
                  <span className="font-bold text-[#a78bfa]">{total.toLocaleString('ko-KR')}원</span>
                </div>
              )}

              {result.summary && (
                <p className="text-[#8b8a9e] text-[0.88rem] leading-[1.65] mt-4 pt-4 border-t border-white/[0.06]">
                  {result.summary}
                </p>
              )}

              {/* 다운로드 버튼 영역 */}
              <div className="flex gap-2 flex-wrap mt-4">
                {result.pdf_base64 && (
                  <button
                    className="inline-flex items-center gap-2 px-5 py-[0.65rem] bg-[rgba(124,106,247,0.15)] border border-[rgba(124,106,247,0.4)] rounded-lg text-[#a78bfa] text-[0.88rem] font-semibold cursor-pointer hover:bg-[rgba(124,106,247,0.25)] transition-colors duration-200"
                    onClick={downloadPdf}
                  >
                    ↓ 견적서 PDF 다운로드
                  </button>
                )}
                {result.excel_base64 && (
                  <button
                    className="inline-flex items-center gap-2 px-5 py-[0.65rem] bg-[rgba(34,211,160,0.1)] border border-[rgba(34,211,160,0.35)] rounded-lg text-[#22d3a0] text-[0.88rem] font-semibold cursor-pointer hover:bg-[rgba(34,211,160,0.2)] transition-colors duration-200"
                    onClick={downloadExcel}
                  >
                    ↓ 견적서 Excel 다운로드
                  </button>
                )}
              </div>
            </div>

            {/* VALIDATOR 결과 */}
            {(result.validator_flags?.length > 0 || result.expert_comment) && (
              <div className="bg-[#13131a] border border-white/[0.07] rounded-2xl p-8 mb-5">
                <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-5">VALIDATOR — 18년 현장 검증</div>

                {/* is_valid === false 경고 배너 */}
                {result.is_valid === false && (
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1.5px solid rgba(239,68,68,0.4)' }}
                  >
                    <span className="text-xl">🚨</span>
                    <div>
                      <div className="text-[#f87171] text-[0.88rem] font-bold">견적 검증 실패 — 현장 기준 미충족</div>
                      <div className="text-[#f87171]/70 text-[0.78rem] mt-0.5">아래 플래그를 검토하고 단가를 수정하거나 전문가 상담을 권장합니다.</div>
                    </div>
                  </div>
                )}

                {result.validator_flags?.map((flag, i) => {
                  const dismissed = dismissedFlags.has(i);
                  // 키워드 기반 위험도 판별
                  const dangerKeywords = ['저가 의심', '누락 의심', '품질 위험'];
                  const isDanger = dangerKeywords.some(kw => flag.message?.includes(kw) || flag.category?.includes(kw));
                  const isError = flag.severity === 'error' || isDanger;
                  // 뱃지 아이콘 및 라벨
                  const badgeIcon = dismissed ? '' : isError ? '🚨' : '⚠️';
                  const badgeLabel = dismissed ? '무시됨' : isError ? '위험' : '주의';
                  return (
                    <div
                      key={i}
                      className="flex gap-[0.6rem] items-start px-[0.9rem] py-[0.7rem] rounded-lg mb-[0.6rem] transition-opacity duration-200"
                      style={{
                        background: dismissed ? 'rgba(255,255,255,0.02)' : isError ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                        border: `1px solid ${dismissed ? 'rgba(255,255,255,0.06)' : isError ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
                        opacity: dismissed ? 0.45 : 1,
                      }}
                    >
                      <span
                        className="px-[0.5rem] py-[0.15rem] rounded text-[0.72rem] font-bold whitespace-nowrap"
                        style={{
                          background: dismissed ? 'rgba(255,255,255,0.06)' : isError ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                          color: dismissed ? '#555' : isError ? '#f87171' : '#fbbf24',
                        }}
                      >
                        {badgeIcon} {badgeLabel}
                      </span>
                      <div className="flex-1">
                        <div
                          className="text-[0.84rem] mb-[0.2rem]"
                          style={{ color: isDanger ? '#f87171' : '#c4c2d8' }}
                        >
                          [{flag.category}] {flag.message}
                        </div>
                        {!dismissed && <div className="text-[#6b6a80] text-[0.78rem]">→ {flag.suggestion}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleDismissFlag(i)}
                        className="text-[0.72rem] px-2 py-0.5 rounded whitespace-nowrap self-center"
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#555', cursor: 'pointer' }}
                        title={dismissed ? '다시 표시' : '무시'}
                      >
                        {dismissed ? '↺' : '✕ 무시'}
                      </button>
                    </div>
                  );
                })}

                {result.expert_comment && (
                  <div className="bg-[rgba(34,211,160,0.05)] border border-[rgba(34,211,160,0.2)] rounded-[10px] px-5 py-4">
                    <div className="text-[#22d3a0] text-[0.75rem] font-bold mb-2 tracking-[0.06em]">전문가 총평</div>
                    <div className="text-[#a0d9cc] text-[0.88rem] leading-[1.65]">{result.expert_comment}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* 비교 견적 결과 */}
        {compareResult && (
          <div className="rounded-2xl p-6 mb-5" style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-[0.78rem] font-semibold tracking-widest uppercase mb-4" style={{ color: '#a09eb8' }}>비교 견적 — 저가 / 표준 / 고급</div>
            <div className="grid grid-cols-3 gap-3">
              {Object.values(compareResult.compare || {}).map((tier) => (
                <div key={tier.tier} className="rounded-xl p-4 text-center" style={{
                  background: tier.tier === 'standard' ? 'rgba(124,106,247,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${tier.is_valid === false ? 'rgba(239,68,68,0.4)' : tier.tier === 'standard' ? 'rgba(124,106,247,0.3)' : 'rgba(255,255,255,0.07)'}`,
                }}>
                  <div className="text-[0.75rem] font-bold mb-2" style={{ color: tier.tier === 'premium' ? '#fbbf24' : tier.tier === 'standard' ? '#a78bfa' : '#6b6a80' }}>
                    {tier.is_valid === false && <span className="mr-1">⚠️</span>}{tier.tier_label}
                  </div>
                  <div className="text-[1rem] font-bold" style={{ color: '#e8e6f0' }}>
                    {tier.min_cost?.toLocaleString('ko-KR')}원
                  </div>
                  <div className="text-[0.75rem] mt-1" style={{ color: '#555' }}>
                    ~ {tier.max_cost?.toLocaleString('ko-KR')}원
                  </div>
                  <div className="text-[0.72rem] mt-1" style={{ color: '#6b6a80' }}>
                    {tier.unit_price?.toLocaleString('ko-KR')}원/m²
                  </div>
                  {tier.validator_flags?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/[0.06] text-[0.7rem]" style={{ color: '#fbbf24' }}>
                      검증 경고 {tier.validator_flags.length}건
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
