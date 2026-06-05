'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Task, TaskStatus, Priority } from '@/lib/types';
import DatePicker from './DatePicker';
import ConfirmDialog from './ConfirmDialog';
import Dropdown from './Dropdown';

export interface TaskFormData {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  siteId: string;
}

interface Props {
  task: Task | null;
  initialStatus: TaskStatus;
  initialSiteId?: string;
  initialCompanyId?: string;
  companies: { id: string; name: string }[];
  sites: { id: string; name: string; companyId: string }[];
  contextLabel: string;
  origin?: { x: number; y: number } | null;
  onClose: () => void;
  onSave: (data: TaskFormData) => void;
  onDelete: (id: string) => void;
  onRequestAddSite?: (companyId: string) => void;
}

export default function TaskModal({
  task,
  initialStatus,
  initialSiteId,
  initialCompanyId,
  companies,
  sites,
  contextLabel,
  origin,
  onClose,
  onSave,
  onDelete,
  onRequestAddSite,
}: Props) {
  const isEditing = !!task;
  const titleRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'low');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? initialStatus);
  const [dueDate, setDueDate] = useState<string>(task?.dueDate ?? '');
  // Derive the company for an existing task from its site, otherwise use the initial.
  const editingCompanyId = task
    ? sites.find((s) => s.id === task.siteId)?.companyId ?? ''
    : '';
  const [companyId, setCompanyId] = useState<string>(
    editingCompanyId || initialCompanyId || companies[0]?.id || ''
  );
  // Sites available for the currently-selected company.
  const sitesInCompany = sites.filter((s) => s.companyId === companyId);
  const [siteId, setSiteId] = useState<string>(
    task?.siteId ?? initialSiteId ?? sitesInCompany[0]?.id ?? ''
  );

  const handleCompanyChange = (newCompanyId: string) => {
    if (newCompanyId === companyId) return;
    setCompanyId(newCompanyId);
    // Reset site to the first site of the newly-picked company.
    const firstSite = sites.find((s) => s.companyId === newCompanyId);
    setSiteId(firstSite?.id ?? '');
  };
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // When a new site appears in the list (e.g. added via "+ Add Site"), auto-select it
  // and switch to its company so the picker reflects the new value.
  const prevSiteIdsRef = useRef(new Set(sites.map((s) => s.id)));
  useEffect(() => {
    const prev = prevSiteIdsRef.current;
    const added = sites.find((s) => !prev.has(s.id));
    if (added) {
      setCompanyId(added.companyId);
      setSiteId(added.id);
    }
    prevSiteIdsRef.current = new Set(sites.map((s) => s.id));
  }, [sites]);

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
    if (!siteId) {
      setError('Site is required');
      return;
    }
    setError(null);
    onSave({
      title: t,
      description: description.trim(),
      priority,
      status,
      dueDate: dueDate || null,
      siteId,
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
        aria-labelledby="modalTitle"
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h2 id="modalTitle">{isEditing ? 'Edit Task' : 'New Task'}</h2>
            <span className="modal-client-pill" title="Site context">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {contextLabel}
            </span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <label htmlFor="taskTitle">
              Title <span className="req">*</span>
            </label>
            <input
              ref={titleRef}
              id="taskTitle"
              type="text"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the task"
            />
          </div>
          <div className="form-row two-col">
            <div>
              <label htmlFor="taskCompany">
                Company <span className="req">*</span>
              </label>
              <Dropdown
                id="taskCompany"
                options={companies}
                value={companyId}
                onChange={handleCompanyChange}
              />
            </div>
            <div>
              <label htmlFor="taskSite">
                Site <span className="req">*</span>
              </label>
              <Dropdown
                id="taskSite"
                options={
                  sitesInCompany.length === 0
                    ? [{ id: '', name: '(No sites in this company)' }]
                    : sitesInCompany.map((s) => ({ id: s.id, name: s.name }))
                }
                value={siteId}
                onChange={setSiteId}
                onAddNew={onRequestAddSite ? () => onRequestAddSite(companyId) : undefined}
                addNewLabel="+ Add Site"
              />
            </div>
          </div>
          {isEditing ? (
            <div className="form-row two-col">
              <div>
                <label htmlFor="taskPriority">Priority</label>
                <Dropdown
                  id="taskPriority"
                  options={[
                    { id: 'low', name: 'Low' },
                    { id: 'medium', name: 'Medium' },
                    { id: 'high', name: 'High' },
                  ]}
                  value={priority}
                  onChange={(v) => setPriority(v as Priority)}
                />
              </div>
              <div>
                <label htmlFor="taskStatus">Status</label>
                <Dropdown
                  id="taskStatus"
                  options={[
                    { id: 'enrolled', name: 'Enrolled' },
                    { id: 'escalated', name: 'Escalated to Team' },
                    { id: 'in-progress', name: 'In Progress' },
                    { id: 'completed', name: 'Completed' },
                    { id: 'rejected', name: 'Rejected' },
                  ]}
                  value={status}
                  onChange={(v) => setStatus(v as TaskStatus)}
                />
              </div>
            </div>
          ) : (
            <div className="form-row">
              <label htmlFor="taskPriority">Priority</label>
              <Dropdown
                id="taskPriority"
                options={[
                  { id: 'low', name: 'Low' },
                  { id: 'medium', name: 'Medium' },
                  { id: 'high', name: 'High' },
                ]}
                value={priority}
                onChange={(v) => setPriority(v as Priority)}
              />
            </div>
          )}
          <div className="form-row">
            <label>Due date</label>
            <DatePicker value={dueDate || null} onChange={(v) => setDueDate(v ?? '')} />
          </div>
          <div className="form-row">
            <label htmlFor="taskDescription">Description / notes</label>
            <textarea
              id="taskDescription"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context, ticket links, blockers…"
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
