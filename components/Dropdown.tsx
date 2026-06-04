'use client';

import { useEffect, useRef, useState } from 'react';

interface Option {
  id: string;
  name: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  width?: number | string;
  id?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  width,
  id,
  onAddNew,
  addNewLabel = '+ Add new',
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const style: React.CSSProperties = {};
  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }

  return (
    <div className="dropdown" ref={ref} style={style}>
      <button
        type="button"
        id={id}
        className={`dropdown-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="dropdown-value">{current?.name ?? placeholder}</span>
        <svg
          viewBox="0 0 12 7"
          width="10"
          height="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
          aria-hidden="true"
        >
          <polyline points="1 1 6 6 11 1" />
        </svg>
      </button>
      {open && (
        <div className="dropdown-menu" role="listbox">
          {options.map((o) => (
            <button
              key={o.id || '__empty'}
              type="button"
              role="option"
              aria-selected={o.id === value}
              className={`dropdown-item${o.id === value ? ' active' : ''}`}
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
            >
              {o.name}
            </button>
          ))}
          {onAddNew && (
            <>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item dropdown-add"
                onClick={() => {
                  setOpen(false);
                  onAddNew();
                }}
              >
                {addNewLabel}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
