'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Company } from '@/lib/types';

interface Props {
  company: Company;
  existingSiteNames: string[];
  origin?: { x: number; y: number } | null;
  onClose: () => void;
  onAdd: (name: string) => void;
}

export default function AddSiteModal({
  company,
  existingSiteNames,
  origin,
  onClose,
  onAdd,
}: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!origin || !modalRef.current) return;
    const r = modalRef.current.getBoundingClientRect();
    modalRef.current.style.setProperty('--origin-x', `${origin.x - r.left}px`);
    modalRef.current.style.setProperty('--origin-y', `${origin.y - r.top}px`);
  }, [origin]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      setError('Site name is required');
      return;
    }
    if (existingSiteNames.some((s) => s.toLowerCase() === n.toLowerCase())) {
      setError(`"${company.name}" already has a site with this name`);
      return;
    }
    setError(null);
    onAdd(n);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="addSiteTitle"
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h2 id="addSiteTitle">Add Site</h2>
            <span className="modal-client-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                <path d="M6 12H4a2 2 0 0 0-2 2v8h4M18 9h2a2 2 0 0 1 2 2v11h-4M10 6h4M10 10h4M10 14h2" />
              </svg>
              {company.name}
            </span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="modal-body" onSubmit={submit} noValidate>
          <div className="form-row">
            <label htmlFor="siteName">
              Site name <span className="req">*</span>
            </label>
            <input
              ref={inputRef}
              id="siteName"
              type="text"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HQ, Region East, Production Floor"
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Site
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
