'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import type { Task, TaskStatus, Priority, Company, Site, PersonalTask } from '@/lib/types';
import { STATUSES, STATUS_LABEL } from '@/lib/types';
import {
  loadTasks,
  saveTasks,
  loadCompanies,
  saveCompanies,
  loadSites,
  saveSites,
  loadPersonalTasks,
  savePersonalTasks,
  uid,
} from '@/lib/storage';
import TaskCard from './TaskCard';
import TaskModal, { type TaskFormData } from './TaskModal';
import AddCompanyModal from './AddCompanyModal';
import AddSiteModal from './AddSiteModal';
import EmptyState from './EmptyState';
import PersonalTasks from './PersonalTasks';
import SettingsModal from './SettingsModal';
import Dropdown from './Dropdown';
import ExportModal from './ExportModal';

type Mode = 'client' | 'personal';

export default function TaskManager() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [mounted, setMounted] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialStatus, setInitialStatus] = useState<TaskStatus>('escalated');

  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [addSiteOpen, setAddSiteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [personalTasksForExport, setPersonalTasksForExport] = useState<PersonalTask[]>([]);

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'' | Priority>('');
  const [search, setSearch] = useState('');

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [expanded, setExpanded] = useState<Record<TaskStatus, boolean>>({
    enrolled: true,
    escalated: true,
    'in-progress': true,
    completed: false,
    rejected: false,
  });
  const COLLAPSIBLE: TaskStatus[] = ['completed', 'rejected'];
  const RECENT_COUNT = 1;

  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const captureOrigin = (e: { currentTarget: EventTarget & HTMLElement }) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  const [mode, setMode] = useState<Mode>('client');
  const personalNewTaskHandlerRef = useRef<
    ((e: React.MouseEvent<HTMLElement>) => void) | null
  >(null);

  // Load from localStorage once Clerk has loaded and we have a userId
  useEffect(() => {
    if (!isLoaded || !userId) return;
    setTasks(loadTasks(userId));
    setCompanies(loadCompanies(userId));
    setSites(loadSites(userId));
    const saved = (typeof window !== 'undefined' && localStorage.getItem('cs-tm-theme')) as
      | 'light'
      | 'dark'
      | null;
    if (saved === 'light' || saved === 'dark') setTheme(saved);
    const savedMode = (typeof window !== 'undefined' &&
      localStorage.getItem('cs-tm-mode')) as Mode | null;
    if (savedMode === 'client' || savedMode === 'personal') setMode(savedMode);
    setMounted(true);
  }, [isLoaded, userId]);

  useEffect(() => {
    if (mounted) localStorage.setItem('cs-tm-mode', mode);
  }, [mode, mounted]);

  // Apply and persist theme
  useEffect(() => {
    if (!mounted) return;
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('cs-tm-theme', theme);
  }, [theme, mounted]);

  // Persist data
  useEffect(() => {
    if (mounted && userId) saveTasks(userId, tasks);
  }, [tasks, mounted, userId]);
  useEffect(() => {
    if (mounted && userId) saveCompanies(userId, companies);
  }, [companies, mounted, userId]);
  useEffect(() => {
    if (mounted && userId) saveSites(userId, sites);
  }, [sites, mounted, userId]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const toggleExpanded = (status: TaskStatus) =>
    setExpanded((prev) => ({ ...prev, [status]: !prev[status] }));

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  };

  // Lookup helpers
  const sitesById = useMemo(() => new Map(sites.map((s) => [s.id, s])), [sites]);
  const companiesById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);

  const labelForTask = (task: Task) => {
    const site = sitesById.get(task.siteId);
    if (!site) return 'Unknown';
    const company = companiesById.get(site.companyId);
    return `${company?.name ?? 'Unknown'} · ${site.name}`;
  };

  const selectedCompany = selectedCompanyId ? companiesById.get(selectedCompanyId) ?? null : null;
  const selectedSite = selectedSiteId ? sitesById.get(selectedSiteId) ?? null : null;

  // Sites for currently-selected company
  const sitesInSelectedCompany = useMemo(
    () => sites.filter((s) => s.companyId === selectedCompanyId),
    [sites, selectedCompanyId]
  );

  // Task counts per site (used by Settings panel)
  const taskCountBySite = useMemo(() => {
    const m = new Map<string, number>();
    tasks.forEach((t) => m.set(t.siteId, (m.get(t.siteId) || 0) + 1));
    return m;
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      const site = sitesById.get(t.siteId);
      if (!site) return false;
      if (selectedCompanyId && site.companyId !== selectedCompanyId) return false;
      if (selectedSiteId && t.siteId !== selectedSiteId) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (q) {
        const hay = `${t.title} ${t.description} ${labelForTask(t)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, selectedCompanyId, selectedSiteId, priorityFilter, search, sitesById, companiesById]);

  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = {
      enrolled: 0,
      escalated: 0,
      'in-progress': 0,
      completed: 0,
      rejected: 0,
    };
    visibleTasks.forEach((t) => (c[t.status] = (c[t.status] || 0) + 1));
    return c;
  }, [visibleTasks]);

  // Task operations
  const openNewTask = (e: React.MouseEvent<HTMLElement>, status: TaskStatus = 'enrolled') => {
    captureOrigin(e);
    setEditingTask(null);
    setInitialStatus(status);
    setModalOpen(true);
  };

  const openEditTask = (e: React.MouseEvent<HTMLElement>, task: Task) => {
    captureOrigin(e);
    setEditingTask(task);
    setModalOpen(true);
  };

  const openAddCompany = (e: React.MouseEvent<HTMLElement>) => {
    captureOrigin(e);
    setAddCompanyOpen(true);
  };

  const openAddSite = (e: React.MouseEvent<HTMLElement>) => {
    captureOrigin(e);
    setAddSiteOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTask(null);
  };

  const handleSaveTask = (data: TaskFormData) => {
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
      showToast('Task updated');
    } else {
      // siteId now comes from the modal form
      if (!data.siteId) return;
      const now = Date.now();
      const newTask: Task = {
        id: uid('t'),
        ...data,
        createdAt: now,
        updatedAt: now,
        history: [{ status: data.status, at: now }],
      };
      setTasks((prev) => [...prev, newTask]);
      showToast('Task created');
    }
    closeModal();
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Task deleted');
    closeModal();
  };

  const moveTask = (id: string, newStatus: TaskStatus) => {
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
    showToast(`Moved to "${STATUS_LABEL[newStatus]}"`);
  };

  // Company / Site operations
  const handleAddCompany = (name: string) => {
    const newCompany: Company = { id: uid('c'), name, createdAt: Date.now() };
    setCompanies((prev) => [...prev, newCompany]);
    setSelectedCompanyId(newCompany.id);
    setSelectedSiteId('');
    setAddCompanyOpen(false);
    showToast(`Company "${name}" added`);
  };

  const handleAddSite = (name: string) => {
    if (!selectedCompany) return;
    const newSite: Site = {
      id: uid('s'),
      name,
      companyId: selectedCompany.id,
      createdAt: Date.now(),
    };
    setSites((prev) => [...prev, newSite]);
    setSelectedSiteId(newSite.id);
    setAddSiteOpen(false);
    showToast(`Site "${name}" added`);
  };

  const handleSelectCompany = (id: string) => {
    setSelectedCompanyId(id);
    setSelectedSiteId(''); // reset site when changing company
  };

  // Cascade-delete from the Settings panel
  const handleDeleteCompany = (companyId: string) => {
    const siteIds = sites.filter((s) => s.companyId === companyId).map((s) => s.id);
    setTasks((prev) => prev.filter((t) => !siteIds.includes(t.siteId)));
    setSites((prev) => prev.filter((s) => s.companyId !== companyId));
    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
    if (selectedCompanyId === companyId) {
      setSelectedCompanyId('');
      setSelectedSiteId('');
    }
    showToast('Company deleted');
  };

  const handleDeleteSite = (siteId: string) => {
    setTasks((prev) => prev.filter((t) => t.siteId !== siteId));
    setSites((prev) => prev.filter((s) => s.id !== siteId));
    if (selectedSiteId === siteId) setSelectedSiteId('');
    showToast('Site deleted');
  };

  // Open "Add Site" modal in the context of a specific company (from Settings)
  const openAddSiteForCompany = (
    companyId: string,
    e: React.MouseEvent<HTMLElement>,
  ) => {
    captureOrigin(e);
    setSelectedCompanyId(companyId);
    setAddSiteOpen(true);
  };

  // Export / Import
  const openExport = () => {
    if (userId) setPersonalTasksForExport(loadPersonalTasks(userId));
    setExportOpen(true);
  };

  const performExport = (selected: {
    companies: Company[];
    sites: Site[];
    tasks: Task[];
    personalTasks: PersonalTask[];
  }) => {
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progress-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
    const n =
      selected.tasks.length + selected.personalTasks.length;
    showToast(`Exported ${n} task${n === 1 ? '' : 's'}`);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImportClick = () => fileInputRef.current?.click();
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (
        !data ||
        !Array.isArray(data.companies) ||
        !Array.isArray(data.sites) ||
        !Array.isArray(data.tasks)
      ) {
        throw new Error('File must contain companies, sites, and tasks arrays');
      }
      const personal = Array.isArray(data.personalTasks) ? data.personalTasks : [];
      const summary = `Import ${data.companies.length} companies, ${data.sites.length} sites, ${data.tasks.length} client tasks${
        personal.length ? `, and ${personal.length} personal tasks` : ''
      }? This will replace your current data.`;
      if (!confirm(summary)) return;
      setCompanies(data.companies);
      setSites(data.sites);
      setTasks(data.tasks);
      if (personal.length && userId) savePersonalTasks(userId, personal);
      showToast('Imported');
    } catch (err) {
      alert('Could not import file: ' + (err as Error).message);
    } finally {
      e.target.value = '';
    }
  };

  // Sorting / column tasks
  const priorityRank = (p: Priority) => ({ high: 3, medium: 2, low: 1 }[p]);
  const tasksByStatus = (status: TaskStatus) =>
    visibleTasks
      .filter((t) => t.status === status)
      .sort((a, b) => {
        if (status === 'completed' || status === 'rejected') {
          return b.updatedAt - a.updatedAt;
        }
        return (
          b.createdAt - a.createdAt
        );
      });

  const clearFilters = () => {
    setSelectedSiteId('');
    setPriorityFilter('');
    setSearch('');
  };

  if (!mounted) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading…</div>;
  }

  const showAddCompanyEmpty = companies.length === 0;
  const showAddSiteEmpty =
    !showAddCompanyEmpty && selectedCompany && sitesInSelectedCompany.length === 0;
  const newTaskContextLabel = editingTask
    ? labelForTask(editingTask)
    : selectedCompany && selectedSite
    ? `${selectedCompany.name} · ${selectedSite.name}`
    : '';
  const canCreateTask = sitesInSelectedCompany.length > 0;

  return (
    <>
      <div className="topbar-stack">
      <header className="topbar">
        <div className="brand">
          <img src="/logo.svg" alt="" className="brand-icon" />
          <span className="brand-name">Progress Tracker</span>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={openExport} title="Pick what to export">
            Export
          </button>
          <button className="btn btn-ghost" onClick={handleImportClick} title="Restore from a JSON backup">
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={handleImportFile}
          />
          <button
            className={`theme-toggle${theme === 'light' ? ' on' : ''}`}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            <span className="tt-icon tt-icon-left" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </span>
            <span className="tt-thumb" />
            <span className="tt-icon tt-icon-right" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            </span>
          </button>
          {mode === 'client' && canCreateTask && (
            <button className="btn btn-primary" onClick={(e) => openNewTask(e)}>
              + New Task
            </button>
          )}
          {mode === 'personal' && (
            <button
              className="btn btn-primary"
              onClick={(e) => personalNewTaskHandlerRef.current?.(e)}
            >
              + New Task
            </button>
          )}
          <button
            type="button"
            className="icon-btn settings-btn"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            title="Settings"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <div className="topbar-user">
            <UserButton />
          </div>
        </div>
      </header>

      <nav className="mode-tabs" role="tablist" aria-label="View mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'client'}
          className={`mode-tab${mode === 'client' ? ' active' : ''}`}
          onClick={() => setMode('client')}
        >
          <svg className="mode-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v8h4M18 9h2a2 2 0 0 1 2 2v11h-4M10 6h4M10 10h4M10 14h2" />
          </svg>
          Client Tracker
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'personal'}
          className={`mode-tab${mode === 'personal' ? ' active' : ''}`}
          onClick={() => setMode('personal')}
        >
          <svg className="mode-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="m9 14 2 2 4-4" />
          </svg>
          My Tasks
        </button>
      </nav>
      </div>

      {mode === 'personal' ? (
        <PersonalTasks
          onShowToast={showToast}
          registerNewTaskHandler={(handler) => {
            personalNewTaskHandlerRef.current = handler;
          }}
        />
      ) : showAddCompanyEmpty ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="36" height="36">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
              <path d="M6 12H4a2 2 0 0 0-2 2v8h4M18 9h2a2 2 0 0 1 2 2v11h-4M10 6h4M10 10h4M10 14h2" />
            </svg>
          }
          title="Add your first company to get started"
          body="Group sites under each company, then track tasks per site through Escalated → In Progress → Completed/Rejected."
          buttonLabel="+ Add Company"
          onAction={openAddCompany}
        />
      ) : !selectedCompany ? (
        <section className="companies-gallery">
          <div className="gallery-header">
            <div>
              <h2 className="gallery-title">Pick a company</h2>
              <p className="gallery-subtitle">Open a company to see its sites and tasks.</p>
            </div>
            <button className="btn btn-primary" onClick={openAddCompany}>+ Add Company</button>
          </div>
          <div className="gallery-grid">
            {companies
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((c) => {
                const compSites = sites.filter((s) => s.companyId === c.id);
                const compSiteIds = new Set(compSites.map((s) => s.id));
                const compTasks = tasks.filter((t) => compSiteIds.has(t.siteId));
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="company-card-tile"
                    onClick={() => handleSelectCompany(c.id)}
                  >
                    <div className="company-card-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                        <path d="M6 12H4a2 2 0 0 0-2 2v8h4M18 9h2a2 2 0 0 1 2 2v11h-4M10 6h4M10 10h4M10 14h2" />
                      </svg>
                    </div>
                    <div className="company-card-name">{c.name}</div>
                    <div className="company-card-meta">
                      {compSites.length} site{compSites.length === 1 ? '' : 's'} · {compTasks.length} task{compTasks.length === 1 ? '' : 's'}
                    </div>
                  </button>
                );
              })}
          </div>
        </section>
      ) : (
        <>
          <header className="company-header">
            <button className="company-back" onClick={() => { setSelectedCompanyId(''); setSelectedSiteId(''); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="15 18 9 12 15 6" /></svg>
              All companies
            </button>
            <div className="company-header-title">
              <svg className="company-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                <path d="M6 12H4a2 2 0 0 0-2 2v8h4M18 9h2a2 2 0 0 1 2 2v11h-4M10 6h4M10 10h4M10 14h2" />
              </svg>
              <h2>{selectedCompany.name}</h2>
            </div>
          </header>

          {showAddSiteEmpty ? (
            <EmptyState
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="36" height="36">
                  <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              }
              title={`Add a site to ${selectedCompany?.name}`}
              body={`Each site under ${selectedCompany?.name} gets its own task board. Add one to start tracking work.`}
              buttonLabel="+ Add Site"
              onAction={openAddSite}
            />
          ) : (
            <>
              <section className="filters">
                <div className="filter-group w-site">
                  <label htmlFor="siteFilter">Site</label>
                  <Dropdown
                    id="siteFilter"
                    options={[
                      { id: '', name: 'All sites' },
                      ...sitesInSelectedCompany
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((s) => ({ id: s.id, name: s.name })),
                    ]}
                    value={selectedSiteId}
                    onChange={setSelectedSiteId}
                  />
                </div>
                <div className="filter-group w-priority">
                  <label htmlFor="priorityFilter">Priority</label>
                  <Dropdown
                    id="priorityFilter"
                    options={[
                      { id: '', name: 'All' },
                      { id: 'high', name: 'High' },
                      { id: 'medium', name: 'Medium' },
                      { id: 'low', name: 'Low' },
                    ]}
                    value={priorityFilter}
                    onChange={(v) => setPriorityFilter(v as Priority | '')}
                  />
                </div>
                <div className="filter-group grow">
                  <label htmlFor="searchInput">Search</label>
                  <input
                    id="searchInput"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search title, description, or site…"
                  />
                </div>
                <button className="btn btn-ghost" onClick={clearFilters}>
                  Clear
                </button>
              </section>

              <main className="board">
                {STATUSES.map((status) => {
                  const items = tasksByStatus(status);
                  const collapsible = COLLAPSIBLE.includes(status);
                  const isExpanded = expanded[status];
                  const visibleItems =
                    collapsible && !isExpanded ? items.slice(0, RECENT_COUNT) : items;
                  return (
                    <div className="column" key={status} data-status={status}>
                      <div className="column-header">
                        <div className="column-title">
                          <span className={`dot ${dotClass(status)}`}></span>
                          <h2>{STATUS_LABEL[status]}</h2>
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
                          visibleItems.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              label={labelForTask(task)}
                              onClick={(e) => openEditTask(e, task)}
                            />
                          ))
                        )}
                        {collapsible && items.length > RECENT_COUNT && (
                          <div className="expand-row">
                            <button
                              type="button"
                              className={`expand-btn${isExpanded ? ' expanded' : ''}`}
                              onClick={() => toggleExpanded(status)}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? (
                                <>Show only recent <span className="arrow">▾</span></>
                              ) : (
                                <>View all {items.length} <span className="arrow">▾</span></>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </main>
            </>
          )}
        </>
      )}

      {modalOpen && (editingTask || canCreateTask) && (
        <TaskModal
          task={editingTask}
          initialStatus={initialStatus}
          initialSiteId={selectedSiteId || sitesInSelectedCompany[0]?.id || ''}
          sites={sitesInSelectedCompany
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((s) => ({ id: s.id, name: s.name }))}
          contextLabel={selectedCompany?.name ?? ''}
          origin={origin}
          onClose={closeModal}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onRequestAddSite={() => setAddSiteOpen(true)}
        />
      )}

      {addCompanyOpen && (
        <AddCompanyModal
          existing={companies.map((c) => c.name)}
          origin={origin}
          onClose={() => setAddCompanyOpen(false)}
          onAdd={handleAddCompany}
        />
      )}

      {addSiteOpen && selectedCompany && (
        <AddSiteModal
          company={selectedCompany}
          existingSiteNames={sitesInSelectedCompany.map((s) => s.name)}
          origin={origin}
          onClose={() => setAddSiteOpen(false)}
          onAdd={handleAddSite}
        />
      )}

      <SettingsModal
        open={settingsOpen}
        companies={companies}
        sites={sites}
        taskCountBySite={taskCountBySite}
        onClose={() => setSettingsOpen(false)}
        onDeleteCompany={handleDeleteCompany}
        onDeleteSite={handleDeleteSite}
        onAddCompany={(e) => {
          setSettingsOpen(false);
          openAddCompany(e);
        }}
        onAddSiteToCompany={(companyId, e) => {
          setSettingsOpen(false);
          openAddSiteForCompany(companyId, e);
        }}
      />

      <ExportModal
        open={exportOpen}
        companies={companies}
        sites={sites}
        tasks={tasks}
        personalTasks={personalTasksForExport}
        onClose={() => setExportOpen(false)}
        onExport={performExport}
      />

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </>
  );
}

function dotClass(status: TaskStatus): string {
  if (status === 'in-progress') return 'progress';
  return status;
}
