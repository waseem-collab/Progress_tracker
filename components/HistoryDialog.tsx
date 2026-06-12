'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Entry {
  status: string;
  at: number;
  note?: string;
}

interface Props {
  open: boolean;
  entries: Entry[];
  labels: Record<string, string>;
  dotClass?: (status: string) => string;
  onClose: () => void;
}

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  const days = Math.floor(diff / 86_400_000);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

function absoluteTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HistoryDialog({
  open,
  entries,
  labels,
  dotClass,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const dialog = (
    <div
      className="modal-backdrop history-backdrop"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="history-dialog" role="dialog" aria-labelledby="historyTitle">
        <div className="history-dialog-header">
          <h3 id="historyTitle">Status history</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="history-list">
          {entries.length === 0 ? (
            <div className="history-empty">No history yet</div>
          ) : (
            entries.map((entry, i) => (
              <div key={i} className="history-entry">
                <div className="history-rail">
                  <span className={`history-dot dot ${dotClass ? dotClass(entry.status) : entry.status}`} />
                  {i < entries.length - 1 && <span className="history-line" />}
                </div>
                <div className="history-body">
                  <div className="history-status">{labels[entry.status] || entry.status}</div>
                  <div className="history-time">
                    {i === 0 ? 'Created' : 'Moved'} · {relativeTime(entry.at)}
                    <span className="history-time-abs"> · {absoluteTime(entry.at)}</span>
                  </div>
                  {entry.note && <div className="history-note">{entry.note}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
