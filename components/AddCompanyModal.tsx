'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface Props {
  existing: string[];
  origin?: { x: number; y: number } | null;
  onClose: () => void;
  onAdd: (name: string) => void;
}

export default function AddCompanyModal({ existing, origin, onClose, onAdd }: Props) {
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
      setError('Company name is required');
      return;
    }
    if (existing.some((c) => c.toLowerCase() === n.toLowerCase())) {
      setError('A company with this name already exists');
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
        aria-labelledby="addCompanyTitle"
      >
        <div className="modal-header">
          <h2 id="addCompanyTitle">Add Company</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="modal-body" onSubmit={submit} noValidate>
          <div className="form-row">
            <label htmlFor="companyName">
              Company name <span className="req">*</span>
            </label>
            <input
              ref={inputRef}
              id="companyName"
              type="text"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
