'use client';
// 폼 내부 재사용 컴포넌트 — 같은 톤의 다크 UI 유지

export function Section({ title, desc, children }) {
  return (
    <div
      className="animate-fade-in-up rounded-2xl p-6 sm:p-8 mb-5"
      style={{
        background: 'linear-gradient(160deg,#14141e 0%,#13131a 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 24px rgba(0,0,0,0.25)',
      }}
    >
      {title && (
        <div className="flex items-center gap-2 mb-2">
          <div
            style={{
              width: 3, height: 14, borderRadius: 2,
              background: 'linear-gradient(180deg,#FF6B35,#FF8C5A)',
              flexShrink: 0,
            }}
          />
          <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase">
            {title}
          </div>
        </div>
      )}
      {desc && <div className="text-[#6b6a80] text-[0.86rem] mb-5 leading-[1.6] mt-2">{desc}</div>}
      {!desc && title && <div className="mb-5" />}
      {children}
    </div>
  );
}

export function Field({ label, required, hint, children }) {
  return (
    <div className="mb-5">
      <label className="block text-[#9b9ab0] text-[0.86rem] mb-[0.5rem] font-medium">
        {label}
        {required && <span className="text-[#f87171] ml-1">*</span>}
        {hint && <span className="text-[#4a4960] font-normal ml-2 text-[0.78rem]">{hint}</span>}
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
      className="w-full border rounded-xl text-[#e8e6f0] px-4 py-3 text-[0.95rem] outline-none"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.09)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
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
      className="w-full border rounded-xl text-[#e8e6f0] px-4 py-3 text-[0.95rem] outline-none resize-y min-h-[80px]"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.09)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    />
  );
}

export function Select({ value, onChange, options, placeholder = '선택' }) {
  return (
    <select
      value={value ?? ''}
      onChange={onChange}
      className="w-full border rounded-xl text-[#e8e6f0] px-4 py-3 text-[0.95rem] outline-none"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.09)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
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
            className="px-4 py-2 rounded-xl text-[0.86rem] font-medium"
            style={{
              background: active ? 'rgba(255,107,53,0.14)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? 'rgba(255,107,53,0.46)' : 'rgba(255,255,255,0.08)'}`,
              color: active ? '#FF8C5A' : '#a09080',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              transform: active ? 'translateY(-1px)' : 'none',
              boxShadow: active ? '0 4px 14px rgba(255,107,53,0.18)' : 'none',
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
            className="px-3 py-2.5 rounded-xl text-[0.85rem] text-left"
            style={{
              background: active ? 'rgba(34,211,160,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? 'rgba(34,211,160,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: active ? '#22d3a0' : '#c4c2d8',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              transform: active ? 'translateY(-1px)' : 'none',
              boxShadow: active ? '0 4px 14px rgba(34,211,160,0.12)' : 'none',
            }}
          >
            <span className="mr-2 font-bold">{active ? '✓' : '○'}</span>
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
            className="px-4 py-2.5 rounded-xl text-[0.86rem] font-medium flex-1"
            style={{
              background: active ? 'rgba(255,107,53,0.14)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? 'rgba(255,107,53,0.46)' : 'rgba(255,255,255,0.08)'}`,
              color: active ? '#FF8C5A' : '#a09080',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
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
  const bg = tone === 'warn' ? 'rgba(245,158,11,0.07)' : 'rgba(34,211,160,0.05)';
  const border = tone === 'warn' ? 'rgba(245,158,11,0.22)' : 'rgba(34,211,160,0.2)';
  const color = tone === 'warn' ? '#fbbf24' : '#7ac9bb';
  return (
    <div
      className="rounded-xl px-4 py-3.5 text-[0.83rem] leading-[1.6]"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      {children}
    </div>
  );
}
