'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  open: boolean;
  taskTitle?: string;
  onSubmit: (note: string) => void;
  onCancel: () => void;
}

export default function CompletionNoteDialog({
  open,
  taskTitle,
  onSubmit,
  onCancel,
}: Props) {
  const [note, setNote] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setNote('');
      const t = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      // ⌘/Ctrl + Enter submits
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        onSubmit(note.trim());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, note, onSubmit, onCancel]);

  if (!open) return null;

  const handleSubmit = () => onSubmit(note.trim());

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="modal completion-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="completionTitle"
      >
        <div className="modal-header">
          <h2 id="completionTitle">Mark as completed</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onCancel}
            aria-label="Cancel"
          >
            ×
          </button>
        </div>
        <div className="modal-body completion-body">
          {taskTitle && <p className="completion-task-title">{taskTitle}</p>}
          <label htmlFor="completionNote" className="completion-label">
            Completion note <span className="completion-optional">(optional)</span>
          </label>
          <textarea
            ref={textareaRef}
            id="completionNote"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was done? Any links, blockers resolved, takeaways…"
          />
          <p className="completion-hint">Press ⌘ + Enter to save.</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={handleSubmit}>
            Skip
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            {note.trim() ? 'Save & complete' : 'Mark complete'}
          </button>
        </div>
      </div>
    </div>
  );
}
