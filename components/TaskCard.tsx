'use client';

import { useState } from 'react';
import type { Task } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/types';
import { ageLabel } from '@/lib/dateUtils';
import HistoryDialog from './HistoryDialog';

interface Props {
  task: Task;
  label: string;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function TaskCard({ task, label, onClick }: Props) {
  const [dragging, setDragging] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const due = dueDateInfo(task.dueDate);
  const historyEntries =
    task.history ?? [{ status: task.status, at: task.createdAt }];

  const dotClass = (s: string) => (s === 'in-progress' ? 'progress' : s);

  return (
    <div
      className={`card priority-${task.priority}${dragging ? ' dragging' : ''}`}
      draggable
      onDragStart={(e) => {
        setDragging(true);
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => setDragging(false)}
      onClick={(e) => onClick(e)}
    >
      <div className="card-content">
      <div className="card-header-row">
        <button
          type="button"
          className="card-info-btn"
          aria-label="Status history"
          title="Status history"
          onClick={(e) => {
            e.stopPropagation();
            setHistoryOpen(true);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>
        <div className="card-title">{task.title}</div>
      </div>
      <span className="card-client">
        <svg className="card-client-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        {label}
      </span>
      {task.description && <div className="card-desc">{task.description}</div>}
      <div className="card-meta">
        <span className={`badge priority-${task.priority}`}>{task.priority}</span>
      </div>
      </div>
      <div className="card-side-stack">
        <span className="card-age" title={`Created ${ageLabel(task.createdAt)} ago`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {ageLabel(task.createdAt)}
        </span>
        {due && (
          <span className={`card-due ${due.cls}`} title={due.tooltip}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {due.text}
          </span>
        )}
      </div>
      <HistoryDialog
        open={historyOpen}
        entries={historyEntries}
        labels={STATUS_LABEL}
        dotClass={dotClass}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}

function dueDateInfo(dateStr: string | null) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  const short = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const tooltip = due.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  if (diffDays < 0) return { cls: 'overdue', text: short, tooltip: `Overdue · ${tooltip}` };
  if (diffDays === 0) return { cls: 'soon', text: 'Today', tooltip };
  if (diffDays === 1) return { cls: 'soon', text: 'Tomorrow', tooltip };
  if (diffDays <= 6) return { cls: 'soon', text: short, tooltip };
  return { cls: '', text: short, tooltip };
}
