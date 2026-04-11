'use client';
import { useState, useRef } from 'react';

// ── 스타일 ──────────────────────────────────────────────
const s = {
  wrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', background: '#0a0a0f' },
  inner: { width: '100%', maxWidth: '680px' },

  // 헤더
  logo: { fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.3rem', background: 'linear-gradient(135deg,#7c6af7,#22d3a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sub: { color: '#6b6a80', margin: '0 0 2rem', fontSize: '0.9rem' },

  // 카드
  card: { background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '2rem', marginBottom: '1.2rem' },
  cardTitle: { color: '#a09eb8', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.2rem' },

  // 폼
  field: { marginBottom: '1.1rem' },
  label: { display: 'block', color: '#8b8a9e', fontSize: '0.83rem', marginBottom: '0.4rem', fontWeight: 500 },
  input: { width: '100%', background: '#0d0d12', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '8px', color: '#e8e6f0', padding: '0.65rem 1rem', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' },
  select: { width: '100%', background: '#0d0d12', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '8px', color: '#e8e6f0', padding: '0.65rem 1rem', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' },
  textarea: { width: '100%', background: '#0d0d12', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '8px', color: '#e8e6f0', padding: '0.65rem 1rem', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: '80px' },

  // 이미지 업로드
  imgUpload: { width: '100%', border: '2px dashed rgba(124,106,247,0.3)', borderRadius: '10px', padding: '1.2rem', textAlign: 'center', cursor: 'pointer', boxSizing: 'border-box', transition: 'border-color .2s' },
  imgUploadHover: { borderColor: 'rgba(124,106,247,0.7)' },
  imgPreview: { maxWidth: '100%', maxHeight: '160px', borderRadius: '8px', objectFit: 'cover', marginTop: '0.6rem' },

  // 버튼
  btn: { width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg,#7c6af7,#5b4fd4)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem', letterSpacing: '0.02em' },
  btnDisabled: { opacity: 0.55, cursor: 'not-allowed' },

  // 에이전트 파이프라인 표시
  pipeline: { display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  agentStep: (active, done) => ({
    padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600,
    background: done ? 'rgba(34,211,160,0.15)' : active ? 'rgba(124,106,247,0.2)' : 'rgba(255,255,255,0.05)',
    color: done ? '#22d3a0' : active ? '#a78bfa' : '#555',
    border: `1px solid ${done ? 'rgba(34,211,160,0.3)' : active ? 'rgba(124,106,247,0.4)' : 'rgba(255,255,255,0.06)'}`,
    transition: 'all .3s',
  }),
  pipelineArrow: { color: '#333', fontSize: '0.85rem' },

  // 결과 섹션
  sectionTitle: { color: '#a09eb8', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.8rem' },
  costRange: { fontSize: '1.5rem', fontWeight: 800, color: '#7c6af7', marginBottom: '0.4rem' },
  costSub: { color: '#555', fontSize: '0.82rem', marginBottom: '1.4rem' },

  // breakdown 바
  barWrap: { marginBottom: '0.55rem' },
  barLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.83rem' },
  barKey: { color: '#8b8a9e' },
  barVal: { color: '#c4c2d8', fontWeight: 600 },
  barTrack: { height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' },
  barFill: (pct) => ({ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#7c6af7,#22d3a0)', borderRadius: '4px', transition: 'width .8s ease' }),

  // 요약
  summary: { color: '#8b8a9e', fontSize: '0.88rem', lineHeight: 1.65, marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' },

  // VALIDATOR 플래그
  flag: (sev) => ({
    display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
    padding: '0.7rem 0.9rem', borderRadius: '8px', marginBottom: '0.6rem',
    background: sev === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
    border: `1px solid ${sev === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
  }),
  flagBadge: (sev) => ({
    padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
    background: sev === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
    color: sev === 'error' ? '#f87171' : '#fbbf24',
  }),
  flagText: { flex: 1 },
  flagMsg: { color: '#c4c2d8', fontSize: '0.84rem', marginBottom: '0.2rem' },
  flagSug: { color: '#6b6a80', fontSize: '0.78rem' },

  // 전문가 총평
  expertBox: { background: 'rgba(34,211,160,0.05)', border: '1px solid rgba(34,211,160,0.2)', borderRadius: '10px', padding: '1rem 1.2rem' },
  expertText: { color: '#a0d9cc', fontSize: '0.88rem', lineHeight: 1.65 },

  // PDF 버튼
  pdfBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.2rem', background: 'rgba(124,106,247,0.15)', border: '1px solid rgba(124,106,247,0.4)', borderRadius: '8px', color: '#a78bfa', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', marginTop: '1rem' },

  // SCANNER 박스
  scannerBox: { background: 'rgba(34,211,160,0.06)', border: '1px solid rgba(34,211,160,0.2)', borderRadius: '8px', padding: '0.8rem 1rem', marginBottom: '0.8rem', color: '#7ac9bb', fontSize: '0.85rem', lineHeight: 1.55 },

  // 에러
  err: { color: '#f87171', fontSize: '0.85rem', marginTop: '0.5rem' },
};

const AGENTS = ['SCANNER', 'ESTIMATOR', 'PRICER', 'VALIDATOR', 'REPORTER'];

// ── 컴포넌트 ─────────────────────────────────────────────
export default function Home() {
  const [form, setForm] = useState({ type: '인테리어', area: '', description: '' });
  const [imgFile, setImgFile] = useState(null);   // { preview, base64 }
  const [imgHover, setImgHover] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [doneSteps, setDoneSteps] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const fmt = (n) => n != null ? n.toLocaleString('ko-KR') + '원' : '-';

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

  // 에이전트 단계별 진행 시뮬레이션
  async function simulatePipeline(fetchPromise) {
    const delays = [300, 1200, 600, 1500, 800]; // 각 에이전트 예상 소요
    let elapsed = 0;
    for (let i = 0; i < AGENTS.length; i++) {
      await new Promise(r => setTimeout(r, elapsed === 0 ? 200 : delays[i - 1]));
      setActiveStep(i);
      elapsed += delays[i];
    }
    return fetchPromise;
  }

  async function submit(e) {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    setActiveStep(0); setDoneSteps([]);

    const body = {
      ...form,
      area: parseFloat(form.area),
      ...(imgFile ? { image_base64: imgFile.base64 } : {}),
    };

    try {
      const fetchP = fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // 파이프라인 진행 표시 (비동기)
      let stepIdx = 0;
      const stepTimer = setInterval(() => {
        if (stepIdx < AGENTS.length) {
          setActiveStep(stepIdx);
          setDoneSteps(prev => stepIdx > 0 ? [...prev, stepIdx - 1] : prev);
          stepIdx++;
        }
      }, 900);

      const res = await fetchP;
      clearInterval(stepTimer);

      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const data = await res.json();

      setDoneSteps([0, 1, 2, 3, 4]);
      setActiveStep(-1);
      setResult(data);
    } catch (e) {
      setError(e.message);
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
    a.click();
    URL.revokeObjectURL(url);
  }

  // breakdown 합계
  const total = result ? Object.values(result.breakdown || {}).reduce((a, b) => a + b, 0) : 0;

  return (
    <div style={s.wrap}>
      <div style={s.inner}>

        {/* 헤더 */}
        <h1 style={s.logo}>JH EstimateAI</h1>
        <p style={s.sub}>18년 현장 경험 기반 · 5 에이전트 AI 견적 시스템</p>

        {/* 입력 폼 */}
        <div style={s.card}>
          <div style={s.cardTitle}>견적 정보 입력</div>
          <form onSubmit={submit}>

            <div style={s.field}>
              <label style={s.label}>공사 유형</label>
              <select style={s.select} value={form.type} onChange={set('type')}>
                <option>인테리어</option>
                <option>신축</option>
                <option>리모델링</option>
              </select>
            </div>

            <div style={s.field}>
              <label style={s.label}>면적 (m²)</label>
              <input style={s.input} type="number" min="1" step="0.1" placeholder="예: 84.5" value={form.area} onChange={set('area')} required />
            </div>

            <div style={s.field}>
              <label style={s.label}>공사 설명</label>
              <textarea style={s.textarea} placeholder="예: 아파트 전체 인테리어, 주방·욕실 포함, 강마루+실크도배" value={form.description} onChange={set('description')} required />
            </div>

            {/* 이미지 업로드 (SCANNER) */}
            <div style={s.field}>
              <label style={s.label}>공간 사진 첨부 <span style={{ color: '#555', fontWeight: 400 }}>(선택 · SCANNER 분석)</span></label>
              <div
                style={{ ...s.imgUpload, ...(imgHover ? s.imgUploadHover : {}) }}
                onClick={() => fileRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setImgHover(true); }}
                onDragLeave={() => setImgHover(false)}
                onDrop={(e) => { e.preventDefault(); setImgHover(false); handleImage(e.dataTransfer.files[0]); }}
              >
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImage(e.target.files[0])} />
                {imgFile ? (
                  <img src={imgFile.preview} alt="preview" style={s.imgPreview} />
                ) : (
                  <span style={{ color: '#555', fontSize: '0.85rem' }}>클릭하거나 이미지를 드래그하세요</span>
                )}
              </div>
              {imgFile && (
                <button type="button" onClick={() => setImgFile(null)} style={{ marginTop: '0.4rem', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.8rem' }}>
                  ✕ 이미지 제거
                </button>
              )}
            </div>

            <button style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }} type="submit" disabled={loading}>
              {loading ? '에이전트 분석 중...' : '견적 산출하기'}
            </button>
            {error && <p style={s.err}>⚠ {error}</p>}
          </form>
        </div>

        {/* 에이전트 파이프라인 진행 */}
        {(loading || result) && (
          <div style={s.card}>
            <div style={s.cardTitle}>에이전트 파이프라인</div>
            <div style={s.pipeline}>
              {AGENTS.map((name, i) => (
                <span key={name}>
                  <span style={s.agentStep(activeStep === i, doneSteps.includes(i))}>
                    {doneSteps.includes(i) ? '✓ ' : activeStep === i ? '⟳ ' : ''}{name}
                  </span>
                  {i < AGENTS.length - 1 && <span style={s.pipelineArrow}> → </span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 결과 */}
        {result && (
          <>
            {/* SCANNER 결과 */}
            {result.scanner_context && (
              <div style={s.card}>
                <div style={s.cardTitle}>SCANNER — 공간 분석 결과</div>
                <div style={s.scannerBox}>{result.scanner_context}</div>
              </div>
            )}

            {/* 견적 요약 */}
            <div style={s.card}>
              <div style={s.cardTitle}>견적 결과</div>
              <div style={s.costRange}>{fmt(result.min_cost)} ~ {fmt(result.max_cost)}</div>
              <div style={s.costSub}>{result.area}m² · {result.type} · 기준단가 {fmt(result.unit_price)}/m²</div>

              {/* breakdown 바 차트 */}
              <div style={s.sectionTitle}>공종별 내역</div>
              {Object.entries(result.breakdown || {}).map(([k, v]) => {
                const pct = total > 0 ? Math.round(v / total * 100) : 0;
                return (
                  <div key={k} style={s.barWrap}>
                    <div style={s.barLabel}>
                      <span style={s.barKey}>{k}</span>
                      <span style={s.barVal}>{fmt(v)} <span style={{ color: '#444', fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div style={s.barTrack}><div style={s.barFill(pct)} /></div>
                  </div>
                );
              })}

              {result.summary && <p style={s.summary}>{result.summary}</p>}

              {/* PDF 다운로드 */}
              {result.pdf_base64 && (
                <button style={s.pdfBtn} onClick={downloadPdf}>
                  ↓ 견적서 PDF 다운로드
                </button>
              )}
            </div>

            {/* VALIDATOR 결과 */}
            {(result.validator_flags?.length > 0 || result.expert_comment) && (
              <div style={s.card}>
                <div style={s.cardTitle}>VALIDATOR — 18년 현장 검증</div>

                {result.validator_flags?.map((flag, i) => (
                  <div key={i} style={s.flag(flag.severity)}>
                    <span style={s.flagBadge(flag.severity)}>
                      {flag.severity === 'error' ? '오류' : '주의'}
                    </span>
                    <div style={s.flagText}>
                      <div style={s.flagMsg}>[{flag.category}] {flag.message}</div>
                      <div style={s.flagSug}>→ {flag.suggestion}</div>
                    </div>
                  </div>
                ))}

                {result.expert_comment && (
                  <div style={s.expertBox}>
                    <div style={{ color: '#22d3a0', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.06em' }}>전문가 총평</div>
                    <div style={s.expertText}>{result.expert_comment}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
