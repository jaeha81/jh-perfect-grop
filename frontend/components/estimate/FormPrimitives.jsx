'use client';
// 폼 내부 재사용 컴포넌트 — 같은 톤의 다크 UI 유지

export function Section({ title, desc, children }) {
  return (
    <div className="bg-[#13131a] border border-white/[0.07] rounded-2xl p-6 sm:p-8 mb-5">
      {title && (
        <div className="text-[#a09eb8] text-[0.78rem] font-semibold tracking-[0.08em] uppercase mb-2">
          {title}
        </div>
      )}
      {desc && <div className="text-[#6b6a80] text-[0.85rem] mb-5 leading-[1.55]">{desc}</div>}
      {!desc && title && <div className="mb-5" />}
      {children}
    </div>
  );
}

export function Field({ label, required, hint, children }) {
  return (
    <div className="mb-[1.1rem]">
      <label className="block text-[#8b8a9e] text-[0.85rem] mb-[0.4rem] font-medium">
        {label}
        {required && <span className="text-[#f87171] ml-1">*</span>}
        {hint && <span className="text-[#555] font-normal ml-2 text-[0.78rem]">{hint}</span>}
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
      className="w-full bg-[#0d0d12] border border-white/[0.09] rounded-lg text-[#e8e6f0] px-4 py-[0.65rem] text-[0.95rem] outline-none focus:border-[rgba(124,106,247,0.5)]"
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
      className="w-full bg-[#0d0d12] border border-white/[0.09] rounded-lg text-[#e8e6f0] px-4 py-[0.65rem] text-[0.95rem] outline-none resize-y min-h-[80px] focus:border-[rgba(124,106,247,0.5)]"
    />
  );
}

export function Select({ value, onChange, options, placeholder = '선택' }) {
  return (
    <select
      value={value ?? ''}
      onChange={onChange}
      className="w-full bg-[#0d0d12] border border-white/[0.09] rounded-lg text-[#e8e6f0] px-4 py-[0.65rem] text-[0.95rem] outline-none focus:border-[rgba(124,106,247,0.5)]"
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
            className="px-4 py-2 rounded-lg text-[0.85rem] font-medium transition-colors duration-150"
            style={{
              background: active ? 'rgba(124,106,247,0.18)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? 'rgba(124,106,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: active ? '#c4b5fd' : '#a09eb8',
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
            className="px-3 py-2 rounded-lg text-[0.85rem] text-left transition-colors duration-150"
            style={{
              background: active ? 'rgba(34,211,160,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? 'rgba(34,211,160,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: active ? '#22d3a0' : '#c4c2d8',
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
            className="px-4 py-2 rounded-lg text-[0.85rem] font-medium flex-1 transition-colors duration-150"
            style={{
              background: active ? 'rgba(124,106,247,0.18)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? 'rgba(124,106,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: active ? '#c4b5fd' : '#a09eb8',
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
  const bg = tone === 'warn' ? 'rgba(245,158,11,0.08)' : 'rgba(34,211,160,0.06)';
  const border = tone === 'warn' ? 'rgba(245,158,11,0.25)' : 'rgba(34,211,160,0.22)';
  const color = tone === 'warn' ? '#fbbf24' : '#7ac9bb';
  return (
    <div
      className="rounded-lg px-4 py-3 text-[0.82rem] leading-[1.55]"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      {children}
    </div>
  );
}
