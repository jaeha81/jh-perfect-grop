'use client';
// 폼 내부 재사용 컴포넌트 — 같은 톤의 다크 UI 유지

export function Section({ title, desc, children }) {
  return (
    <div
      className="animate-fade-in-up rounded-2xl p-6 sm:p-8 mb-5"
      style={{
        background: 'linear-gradient(160deg,#161209 0%,#13100d 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {title && (
        <div className="flex items-center gap-2.5 mb-2">
          <div
            style={{
              width: 3, height: 16, borderRadius: 2,
              background: 'linear-gradient(180deg,#FF6B35 0%,#FF8C5A 100%)',
              flexShrink: 0,
              boxShadow: '0 0 8px rgba(255,107,53,0.4)',
            }}
          />
          <div className="text-[#c8b8a8] text-[0.76rem] font-bold tracking-[0.1em] uppercase">
            {title}
          </div>
        </div>
      )}
      {desc && <div className="text-[#6b5f50] text-[0.85rem] mb-5 leading-[1.65] mt-2">{desc}</div>}
      {!desc && title && <div className="mb-5" />}
      {children}
    </div>
  );
}

export function Field({ label, required, hint, children }) {
  return (
    <div className="mb-5">
      <label className="block text-[#a09080] text-[0.84rem] mb-[0.45rem] font-semibold tracking-[0.01em]">
        {label}
        {required && <span className="text-[#f87171] ml-1 font-bold">*</span>}
        {hint && <span className="text-[#4a3e30] font-normal ml-2 text-[0.77rem]">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, type = 'text', ...rest }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border rounded-xl text-[#e8e6f0] px-4 py-3 text-[0.94rem] outline-none"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.08)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        caretColor: '#FF6B35',
      }}
      {...rest}
    />
  );
}

export function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full border rounded-xl text-[#e8e6f0] px-4 py-3 text-[0.94rem] outline-none resize-y min-h-[80px]"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.08)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        caretColor: '#FF6B35',
      }}
    />
  );
}

export function Select({ value, onChange, options, placeholder = '선택' }) {
  return (
    <select
      value={value ?? ''}
      onChange={onChange}
      className="w-full border rounded-xl text-[#e8e6f0] px-4 py-3 text-[0.94rem] outline-none"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.08)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        paddingRight: '2.5rem',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23FF6B35' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
}

export function RadioGroup({ value, onChange, options, name }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        const active = value === v;
        return (
          <button
            type="button"
            key={v}
            onClick={() => onChange(v)}
            className="px-4 py-2 rounded-xl text-[0.85rem] font-semibold"
            style={{
              background: active ? 'rgba(255,107,53,0.14)' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${active ? 'rgba(255,107,53,0.46)' : 'rgba(255,255,255,0.07)'}`,
              color: active ? '#FF8C5A' : '#7a6a5a',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              transform: active ? 'translateY(-1px)' : 'none',
              boxShadow: active ? '0 4px 14px rgba(255,107,53,0.2)' : 'none',
            }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function CheckboxGrid({ options, selected, onToggle, columns = 2 }) {
  const colClass =
    columns === 1 ? 'grid-cols-1'
    : columns === 2 ? 'grid-cols-2'
    : columns === 3 ? 'grid-cols-2 sm:grid-cols-3'
    : 'grid-cols-2 sm:grid-cols-4';
  return (
    <div className={`grid ${colClass} gap-2`}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value ?? o.key;
        const l = typeof o === 'string' ? o : o.label ?? o.key;
        const active = selected.includes(v);
        return (
          <button
            type="button"
            key={v}
            onClick={() => onToggle(v)}
            className="px-3 py-2.5 rounded-xl text-[0.84rem] text-left font-medium"
            style={{
              background: active ? 'rgba(34,211,160,0.1)' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${active ? 'rgba(34,211,160,0.38)' : 'rgba(255,255,255,0.07)'}`,
              color: active ? '#22d3a0' : '#7a6a5a',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              transform: active ? 'translateY(-1px)' : 'none',
              boxShadow: active ? '0 4px 14px rgba(34,211,160,0.12)' : 'none',
            }}
          >
            <span className="mr-1.5 font-bold text-[0.78rem]">{active ? '✓' : '○'}</span>
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function BooleanToggle({ value, onChange, labels = ['예', '아니오'] }) {
  return (
    <div className="flex gap-2">
      {[true, false].map((b, i) => {
        const active = value === b;
        return (
          <button
            type="button"
            key={String(b)}
            onClick={() => onChange(b)}
            className="px-4 py-2.5 rounded-xl text-[0.86rem] font-semibold flex-1"
            style={{
              background: active ? 'rgba(255,107,53,0.14)' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${active ? 'rgba(255,107,53,0.46)' : 'rgba(255,255,255,0.07)'}`,
              color: active ? '#FF8C5A' : '#7a6a5a',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              transform: active ? 'translateY(-1px)' : 'none',
              boxShadow: active ? '0 4px 14px rgba(255,107,53,0.18)' : 'none',
            }}
          >
            {labels[i]}
          </button>
        );
      })}
    </div>
  );
}

export function Note({ children, tone = 'info' }) {
  const bg =
    tone === 'warn'  ? 'rgba(245,158,11,0.07)'  :
    tone === 'error' ? 'rgba(239,68,68,0.07)'    :
                       'rgba(255,107,53,0.05)';
  const border =
    tone === 'warn'  ? 'rgba(245,158,11,0.22)'  :
    tone === 'error' ? 'rgba(239,68,68,0.2)'     :
                       'rgba(255,107,53,0.18)';
  const color =
    tone === 'warn'  ? '#fbbf24' :
    tone === 'error' ? '#f87171' :
                       '#c8a882';
  return (
    <div
      className="rounded-xl px-4 py-3.5 text-[0.83rem] leading-[1.65]"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      {children}
    </div>
  );
}
