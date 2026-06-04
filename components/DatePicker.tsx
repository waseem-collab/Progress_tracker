'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  formatYMD,
  parseYMD,
  isSameDay,
  startOfToday,
  formatMonth,
  formatFullDate,
  getMonthGrid,
} from '@/lib/dateUtils';

interface Props {
  value: string | null;
  onChange: (value: string | null) => void;
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DatePicker({ value, onChange }: Props) {
  const selected = parseYMD(value);
  const today = startOfToday();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(selected || today);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
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

  const grid = getMonthGrid(view.getFullYear(), view.getMonth());

  const panel = open && (
    <>
      <div className="datepicker-backdrop" onClick={() => setOpen(false)} />
      <div
        ref={panelRef}
        className="datepicker-panel datepicker-panel-centered"
        role="dialog"
        aria-label="Date picker"
      >
      <div className="cal-header">
        <button
          type="button"
          className="cal-nav"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="cal-month-label">{formatMonth(view)}</div>
        <button
          type="button"
          className="cal-nav"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="cal-weekrow">
        {DAY_HEADERS.map((d, i) => (
          <div key={i} className="cal-weekday">{d}</div>
        ))}
      </div>
      <div className="cal-grid">
        {grid.map((day, i) => {
          const isOutside = day.getMonth() !== view.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = selected && isSameDay(day, selected);
          return (
            <button
              type="button"
              key={i}
              className={`cal-day${isOutside ? ' outside' : ''}${isToday ? ' today' : ''}${
                isSelected ? ' selected' : ''
              }`}
              onClick={() => {
                onChange(formatYMD(day));
                setOpen(false);
              }}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
      <div className="cal-footer">
        <button
          type="button"
          className="cal-link"
          onClick={() => {
            setView(today);
            onChange(formatYMD(today));
            setOpen(false);
          }}
        >
          Today
        </button>
        {value && (
          <button
            type="button"
            className="cal-link cal-link-clear"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            Clear
          </button>
        )}
      </div>
      </div>
    </>
  );

  return (
    <div className="datepicker">
      <button
        ref={triggerRef}
        type="button"
        className={`datepicker-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="datepicker-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
        <span className={`datepicker-value${!selected ? ' placeholder' : ''}`}>
          {selected ? formatFullDate(selected) : 'Pick a date'}
        </span>
        <span className="datepicker-chevron" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {mounted && panel && createPortal(panel, document.body)}
    </div>
  );
}
