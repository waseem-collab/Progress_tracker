'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import type { PersonalTask, PersonalStatus } from '@/lib/types';
import { PERSONAL_STATUSES, PERSONAL_STATUS_LABEL } from '@/lib/types';
import { loadPersonalTasks, savePersonalTasks, uid } from '@/lib/storage';
import PersonalTaskCard from './PersonalTaskCard';
import PersonalTaskModal, { type PersonalTaskFormData } from './PersonalTaskModal';

interface Props {
  onShowToast: (msg: string) => void;
  registerNewTaskHandler: (
    handler: ((e: React.MouseEvent<HTMLElement>) => void) | null
  ) => void;
}

export default function PersonalTasks({ onShowToast, registerNewTaskHandler }: Props) {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [mounted, setMounted] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [initialStatus, setInitialStatus] = useState<PersonalStatus>('enrolled');

  const [dragOverStatus, setDragOverStatus] = useState<PersonalStatus | null>(null);

  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const captureOrigin = (e: { currentTarget: EventTarget & HTMLElement }) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  // Load once Clerk has a userId
  useEffect(() => {
    if (!isLoaded || !userId) return;
    setTasks(loadPersonalTasks(userId));
    setMounted(true);
  }, [isLoaded, userId]);

  // Persist
  useEffect(() => {
    if (mounted && userId) savePersonalTasks(userId, tasks);
  }, [tasks, mounted, userId]);

  const openNew = (e: React.MouseEvent<HTMLElement>, status: PersonalStatus = 'enrolled') => {
    captureOrigin(e);
    setEditingTask(null);
    setInitialStatus(status);
    setModalOpen(true);
  };

  // Expose the "New Task" opener to parent (used for the topbar button)
  useEffect(() => {
    registerNewTaskHandler(openNew);
    return () => registerNewTaskHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (e: React.MouseEvent<HTMLElement>, task: PersonalTask) => {
    captureOrigin(e);
    setEditingTask(task);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTask(null);
  };

  const handleSave = (data: PersonalTaskFormData) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== editingTask.id) return t;
          const now = Date.now();
          const statusChanged = t.status !== data.status;
          const baseHistory =
            t.history ?? [{ status: t.status, at: t.createdAt }];
          return {
            ...t,
            ...data,
            updatedAt: now,
            history: statusChanged
              ? [...baseHistory, { status: data.status, at: now }]
              : baseHistory,
          };
        })
      );
      onShowToast('Task updated');
    } else {
      const now = Date.now();
      const newTask: PersonalTask = {
        id: uid('p'),
        ...data,
        createdAt: now,
        updatedAt: now,
        history: [{ status: data.status, at: now }],
      };
      setTasks((prev) => [...prev, newTask]);
      onShowToast('Task created');
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    onShowToast('Task deleted');
    closeModal();
  };

  const moveTask = (id: string, newStatus: PersonalStatus) => {
    setTasks((prev) => {
      const t = prev.find((x) => x.id === id);
      if (!t || t.status === newStatus) return prev;
      const now = Date.now();
      const baseHistory = t.history ?? [{ status: t.status, at: t.createdAt }];
      return prev.map((x) =>
        x.id === id
          ? {
              ...x,
              status: newStatus,
              updatedAt: now,
              history: [...baseHistory, { status: newStatus, at: now }],
            }
          : x
      );
    });
    onShowToast(`Moved to "${PERSONAL_STATUS_LABEL[newStatus]}"`);
  };

  const tasksByStatus = (status: PersonalStatus) =>
    tasks
      .filter((t) => t.status === status)
      .sort((a, b) =>
        status === 'completed' ? b.updatedAt - a.updatedAt : b.createdAt - a.createdAt
      );

  const counts = useMemo(() => {
    const c: Record<PersonalStatus, number> = { enrolled: 0, ongoing: 0, completed: 0 };
    tasks.forEach((t) => (c[t.status] = (c[t.status] || 0) + 1));
    return c;
  }, [tasks]);

  if (!mounted) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading…</div>;
  }

  return (
    <>
      <main className="board board-personal">
        {PERSONAL_STATUSES.map((status) => {
          const items = tasksByStatus(status);
          return (
            <div className="column" key={status} data-status={status}>
              <div className="column-header">
                <div className="column-title">
                  <span className={`dot ${status === 'ongoing' ? 'progress' : status}`}></span>
                  <h2>{PERSONAL_STATUS_LABEL[status]}</h2>
                </div>
                <span className="count">{counts[status]}</span>
              </div>
              <div
                className={`card-list${dragOverStatus === status ? ' drag-over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverStatus !== status) setDragOverStatus(status);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget === e.target) setDragOverStatus(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverStatus(null);
                  const id = e.dataTransfer.getData('text/plain');
                  if (id) moveTask(id, status);
                }}
              >
                {items.length === 0 ? (
                  <div className="empty-state">No tasks</div>
                ) : (
                  items.map((task) => (
                    <PersonalTaskCard
                      key={task.id}
                      task={task}
                      onClick={(e) => openEdit(e, task)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </main>

      {modalOpen && (
        <PersonalTaskModal
          task={editingTask}
          initialStatus={initialStatus}
          origin={origin}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
