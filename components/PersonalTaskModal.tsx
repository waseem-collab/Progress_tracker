'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PersonalTask, PersonalStatus, Priority } from '@/lib/types';
import DatePicker from './DatePicker';
import ConfirmDialog from './ConfirmDialog';
import Dropdown from './Dropdown';

export interface PersonalTaskFormData {
  title: string;
  description: string;
  dueDate: string | null;
  status: PersonalStatus;
  priority: Priority;
}

interface Props {
  task: PersonalTask | null;
  initialStatus: PersonalStatus;
  origin?: { x: number; y: number } | null;
  onClose: () => void;
  onSave: (data: PersonalTaskFormData) => void;
  onDelete: (id: string) => void;
}

export default function PersonalTaskModal({
  task,
  initialStatus,
  origin,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const isEditing = !!task;
  const titleRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<PersonalStatus>(task?.status ?? initialStatus);
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'low');
  const [dueDate, setDueDate] = useState<string>(task?.dueDate ?? '');
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useLayoutEffect(() => {
    if (!origin || !modalRef.current) return;
    const r = modalRef.current.getBoundingClientRect();
    modalRef.current.style.setProperty('--origin-x', `${origin.x - r.left}px`);
    modalRef.current.style.setProperty('--origin-y', `${origin.y - r.top}px`);
  }, [origin]);

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setError('Title is required');
      return;
    }
    setError(null);
    onSave({
      title: t,
      description: description.trim(),
      dueDate: dueDate || null,
      status,
      priority,
    });
  };

  const handleDelete = () => {
    if (!task) return;
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!task) return;
    setConfirmOpen(false);
    onDelete(task.id);
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
        aria-labelledby="personalTaskTitle"
      >
        <div className="modal-header">
          <h2 id="personalTaskTitle">{isEditing ? 'Edit Task' : 'New Task'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <label htmlFor="personalTitle">
              Title <span className="req">*</span>
            </label>
            <input
              ref={titleRef}
              id="personalTitle"
              type="text"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to do?"
            />
          </div>
          <div className="form-row">
            <label htmlFor="personalPriority">Priority</label>
            <Dropdown
              id="personalPriority"
              options={[
                { id: 'low', name: 'Low' },
                { id: 'medium', name: 'Medium' },
                { id: 'high', name: 'High' },
              ]}
              value={priority}
              onChange={(v) => setPriority(v as Priority)}
            />
          </div>
          {isEditing && (
            <div className="form-row">
              <label htmlFor="personalStatus">Status</label>
              <Dropdown
                id="personalStatus"
                options={[
                  { id: 'enrolled', name: 'Enrolled' },
                  { id: 'ongoing', name: 'Ongoing' },
                  { id: 'completed', name: 'Completed' },
                ]}
                value={status}
                onChange={(v) => setStatus(v as PersonalStatus)}
              />
            </div>
          )}
          <div className="form-row">
            <label>Due date</label>
            <DatePicker value={dueDate || null} onChange={(v) => setDueDate(v ?? '')} />
          </div>
          <div className="form-row">
            <label htmlFor="personalDesc">Notes</label>
            <textarea
              id="personalDesc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any extra context…"
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-footer">
            {isEditing && (
              <button type="button" className="btn btn-danger delete-btn" onClick={handleDelete}>
                Delete
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Task
            </button>
          </div>
        </form>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete this task?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
