'use client';
import { useState } from 'react';

const s = {
  wrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  card: { background: '#16161e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '560px' },
  title: { fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem', background: 'linear-gradient(135deg,#7c6af7,#22d3a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sub: { color: '#8b8a9e', margin: '0 0 2rem', fontSize: '0.95rem' },
  label: { display: 'block', color: '#a09eb8', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 },
  input: { width: '100%', background: '#0f0f13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e8e6f0', padding: '0.7rem 1rem', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' },
  select: { width: '100%', background: '#0f0f13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e8e6f0', padding: '0.7rem 1rem', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' },
  textarea: { width: '100%', background: '#0f0f13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e8e6f0', padding: '0.7rem 1rem', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: '80px' },
  field: { marginBottom: '1.2rem' },
  btn: { width: '100%', padding: '0.8rem', background: 'linear-gradient(135deg,#7c6af7,#5b4fd4)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' },
  result: { marginTop: '2rem', background: '#0f0f13', border: '1px solid rgba(124,106,247,0.3)', borderRadius: '12px', padding: '1.5rem' },
  row: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem' },
  key: { color: '#8b8a9e' },
  val: { color: '#e8e6f0', fontWeight: 600 },
  summary: { color: '#a09eb8', fontSize: '0.9rem', lineHeight: 1.6, marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' },
  err: { color: '#f87171', fontSize: '0.85rem', marginTop: '0.5rem' },
  breakdown: { marginTop: '0.8rem' },
  brow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem', color: '#6b6a80' },
};

export default function Home() {
  const [form, setForm] = useState({ type: '인테리어', area: '', description: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, area: parseFloat(form.area) }),
      });
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n) => n?.toLocaleString('ko-KR') + '원';

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h1 style={s.title}>JH EstimateAI</h1>
        <p style={s.sub}>AI 기반 인테리어 / 건설 견적 자동화</p>
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
            <textarea style={s.textarea} placeholder="예: 아파트 전체 인테리어, 주방·욕실 포함" value={form.description} onChange={set('description')} required />
          </div>
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? '견적 계산 중...' : '견적 산출하기'}
          </button>
          {error && <p style={s.err}>{error}</p>}
        </form>

        {result && (
          <div style={s.result}>
            <div style={s.row}><span style={s.key}>예상 범위</span><span style={{ ...s.val, color: '#7c6af7' }}>{fmt(result.min_cost)} ~ {fmt(result.max_cost)}</span></div>
            <div style={s.row}><span style={s.key}>공사 유형</span><span style={s.val}>{result.type}</span></div>
            <div style={s.row}><span style={s.key}>면적</span><span style={s.val}>{result.area} m²</span></div>
            <div style={s.row}><span style={s.key}>기준 단가</span><span style={s.val}>{fmt(result.unit_price)}/m²</span></div>
            <div style={s.breakdown}>
              {Object.entries(result.breakdown).map(([k, v]) => (
                <div key={k} style={s.brow}><span>{k}</span><span>{fmt(v)}</span></div>
              ))}
            </div>
            <p style={s.summary}>{result.summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}
