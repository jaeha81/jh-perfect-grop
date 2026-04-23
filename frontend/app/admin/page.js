'use client';
import { useEffect, useState } from 'react';

const KIND_LABEL = { consult: '📞 상담 요청', visit: '🗓 방문 예약' };
const KIND_COLOR = { consult: '#7c6af7', visit: '#22d3a0' };

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ko-KR', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  async function fetchInquiries(t) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/inquiries${t ? `?token=${encodeURIComponent(t)}` : ''}`, {
        method: 'GET',
      });
      if (res.status === 401) { setError('토큰이 올바르지 않습니다.'); setLoading(false); return; }
      if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setAuthed(true);
    } catch (e) {
      setError(e?.message || '조회 실패');
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    fetchInquiries(token);
  }

  function refresh() {
    fetchInquiries(token);
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
        <div
          className="w-full max-w-[380px] rounded-2xl p-8"
          style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-[1.1rem] font-bold text-[#e8e6f0] mb-1">JH EstimateAI 관리자</div>
          <div className="text-[0.8rem] text-[#6b6a80] mb-6">상담 접수 내역을 조회합니다.</div>
          <form onSubmit={handleLogin}>
            <label className="block text-[#8b8a9e] text-[0.82rem] mb-1">관리자 토큰 (없으면 공란)</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ADMIN_TOKEN"
              className="w-full bg-[#0d0d12] border border-white/[0.08] rounded-lg text-[#e8e6f0] px-3 py-2 text-[0.9rem] outline-none mb-4"
            />
            {error && (
              <div className="mb-3 text-[0.82rem] text-[#f87171]">⚠ {error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-white text-[0.95rem]"
              style={{
                background: 'linear-gradient(135deg,#7c6af7,#5b4fd4)',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              {loading ? '조회 중...' : '접속'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-8">
      <div className="max-w-[900px] mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[1.2rem] font-bold text-[#e8e6f0]">상담 접수 관리</div>
            <div className="text-[0.78rem] text-[#6b6a80] mt-0.5">
              총 <span className="text-[#22d3a0] font-bold">{total}</span>건
            </div>
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-xl text-[0.85rem] font-semibold"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#a09eb8',
              cursor: 'pointer',
            }}
          >
            ↺ 새로고침
          </button>
        </div>

        {loading && (
          <div className="text-center text-[#6b6a80] py-16">조회 중...</div>
        )}
        {error && !loading && (
          <div className="text-center text-[#f87171] py-8">⚠ {error}</div>
        )}

        {!loading && items.length === 0 && (
          <div
            className="text-center py-16 rounded-2xl"
            style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-[2rem] mb-2">📭</div>
            <div className="text-[#6b6a80] text-[0.9rem]">접수된 상담이 없습니다.</div>
          </div>
        )}

        {/* 목록 */}
        {!loading && items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, i) => (
              <button
                key={item.inquiry_id || i}
                onClick={() => setSelected(selected?.inquiry_id === item.inquiry_id ? null : item)}
                className="w-full text-left rounded-xl px-5 py-4 transition-all"
                style={{
                  background: selected?.inquiry_id === item.inquiry_id
                    ? 'rgba(124,106,247,0.12)'
                    : '#13131a',
                  border: `1px solid ${selected?.inquiry_id === item.inquiry_id
                    ? 'rgba(124,106,247,0.4)'
                    : 'rgba(255,255,255,0.06)'}`,
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="shrink-0 text-[0.72rem] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${KIND_COLOR[item.kind] || '#7c6af7'}22`,
                        color: KIND_COLOR[item.kind] || '#7c6af7',
                        border: `1px solid ${KIND_COLOR[item.kind] || '#7c6af7'}44`,
                      }}
                    >
                      {KIND_LABEL[item.kind] || item.kind}
                    </span>
                    <span className="text-[#e8e6f0] text-[0.9rem] font-semibold truncate">
                      {item.customer_name || '(이름 없음)'}
                    </span>
                    <span className="text-[#6b6a80] text-[0.82rem] truncate hidden sm:block">
                      {item.customer_phone || '-'}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[#a09eb8] text-[0.75rem]">{formatDate(item.received_at)}</div>
                    <div className="text-[#6b6a80] text-[0.72rem] font-mono">{item.inquiry_id}</div>
                  </div>
                </div>

                {/* 상세 펼침 */}
                {selected?.inquiry_id === item.inquiry_id && (
                  <div
                    className="mt-4 rounded-xl px-4 py-3 space-y-2"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    {[
                      ['요청번호', item.inquiry_id],
                      ['고객명', item.customer_name],
                      ['연락처', item.customer_phone],
                      ['이메일', item.email],
                      ['주소', item.address],
                      ['공간 유형', item.space_type],
                      ['면적', item.area ? `${item.area}m²` : null],
                      ['접수 시각', item.received_at],
                      ['추가 메모', item.note],
                    ].map(([label, value]) =>
                      value ? (
                        <div key={label} className="flex gap-3">
                          <span className="text-[#6b6a80] text-[0.8rem] w-20 shrink-0">{label}</span>
                          <span className="text-[#c4c2d8] text-[0.85rem] break-all">{value}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-[#333] text-[0.7rem]">
          JH EstimateAI Admin · 데이터는 서버 파일 기반 (MVP) · 프로덕션은 Supabase 연동 필요
        </div>
      </div>
    </div>
  );
}
