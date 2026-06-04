'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Company, Site, Task, PersonalTask } from '@/lib/types';

interface Props {
  open: boolean;
  companies: Company[];
  sites: Site[];
  tasks: Task[];
  personalTasks: PersonalTask[];
  onClose: () => void;
  onExport: (data: {
    companies: Company[];
    sites: Site[];
    tasks: Task[];
    personalTasks: PersonalTask[];
  }) => void;
}

export default function ExportModal({
  open,
  companies,
  sites,
  tasks,
  personalTasks,
  onClose,
  onExport,
}: Props) {
  const [includePersonal, setIncludePersonal] = useState(true);
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Reset on open — default to everything selected
  useEffect(() => {
    if (open) {
      setIncludePersonal(true);
      setSelectedSites(new Set(sites.map((s) => s.id)));
      setExpanded(new Set());
    }
  }, [open, sites]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const sitesByCompany = useMemo(() => {
    const m = new Map<string, Site[]>();
    sites.forEach((s) => {
      const arr = m.get(s.companyId) ?? [];
      arr.push(s);
      m.set(s.companyId, arr);
    });
    return m;
  }, [sites]);

  const tasksBySite = useMemo(() => {
    const m = new Map<string, number>();
    tasks.forEach((t) => m.set(t.siteId, (m.get(t.siteId) ?? 0) + 1));
    return m;
  }, [tasks]);

  const toggleSite = (siteId: string) => {
    setSelectedSites((prev) => {
      const next = new Set(prev);
      if (next.has(siteId)) next.delete(siteId);
      else next.add(siteId);
      return next;
    });
  };

  const toggleCompany = (companyId: string) => {
    const compSites = sitesByCompany.get(companyId) ?? [];
    if (compSites.length === 0) return;
    const allSelected = compSites.every((s) => selectedSites.has(s.id));
    setSelectedSites((prev) => {
      const next = new Set(prev);
      compSites.forEach((s) => {
        if (allSelected) next.delete(s.id);
        else next.add(s.id);
      });
      return next;
    });
  };

  const selectAll = () => {
    setSelectedSites(new Set(sites.map((s) => s.id)));
    setIncludePersonal(true);
  };

  const selectNone = () => {
    setSelectedSites(new Set());
    setIncludePersonal(false);
  };

  const toggleExpanded = (companyId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
  };

  const selectedTaskCount = useMemo(
    () => tasks.filter((t) => selectedSites.has(t.siteId)).length,
    [tasks, selectedSites],
  );
  const personalCount = includePersonal ? personalTasks.length : 0;
  const totalCount = selectedTaskCount + personalCount;
  const canExport = includePersonal || selectedSites.size > 0;

  const handleExport = () => {
    const exportedSites = sites.filter((s) => selectedSites.has(s.id));
    const includedCompanyIds = new Set(exportedSites.map((s) => s.companyId));
    const exportedCompanies = companies.filter((c) => includedCompanyIds.has(c.id));
    const exportedTasks = tasks.filter((t) => selectedSites.has(t.siteId));
    onExport({
      companies: exportedCompanies,
      sites: exportedSites,
      tasks: exportedTasks,
      personalTasks: includePersonal ? personalTasks : [],
    });
  };

  if (!open) return null;

  const sortedCompanies = [...companies].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal export-modal" role="dialog" aria-labelledby="exportTitle" aria-modal="true">
        <div className="modal-header">
          <h2 id="exportTitle">Export data</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body export-body">
          <div className="export-actions">
            <button type="button" className="export-bulk-btn" onClick={selectAll}>
              Select all
            </button>
            <button type="button" className="export-bulk-btn" onClick={selectNone}>
              None
            </button>
          </div>

          <div className="export-section">
            <h3 className="export-section-title">My Tasks</h3>
            <label className="export-row">
              <input
                type="checkbox"
                checked={includePersonal}
                onChange={(e) => setIncludePersonal(e.target.checked)}
              />
              <span className="export-name">Personal tasks</span>
              <span className="export-meta">
                {personalTasks.length} task{personalTasks.length === 1 ? '' : 's'}
              </span>
            </label>
          </div>

          <div className="export-section">
            <h3 className="export-section-title">Client Tracker</h3>
            {sortedCompanies.length === 0 ? (
              <p className="export-empty">No companies yet.</p>
            ) : (
              <div className="export-list">
                {sortedCompanies.map((c) => {
                  const compSites = (sitesByCompany.get(c.id) ?? [])
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name));
                  const selectedCount = compSites.filter((s) => selectedSites.has(s.id)).length;
                  const allSelected = compSites.length > 0 && selectedCount === compSites.length;
                  const someSelected = selectedCount > 0 && selectedCount < compSites.length;
                  const totalTasks = compSites.reduce(
                    (n, s) => n + (tasksBySite.get(s.id) ?? 0),
                    0,
                  );
                  const isExpanded = expanded.has(c.id);
                  return (
                    <div key={c.id} className="export-company-block">
                      <div className="export-row export-row-company">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected;
                          }}
                          onChange={() => toggleCompany(c.id)}
                          disabled={compSites.length === 0}
                        />
                        <button
                          type="button"
                          className="export-expand-btn"
                          onClick={() => toggleExpanded(c.id)}
                          disabled={compSites.length === 0}
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          <svg
                            viewBox="0 0 12 7"
                            width="10"
                            height="6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                              transition: 'transform 0.15s',
                            }}
                          >
                            <polyline points="1 1 6 6 11 1" />
                          </svg>
                        </button>
                        <span className="export-name">{c.name}</span>
                        <span className="export-meta">
                          {compSites.length} site{compSites.length === 1 ? '' : 's'} · {totalTasks}{' '}
                          task{totalTasks === 1 ? '' : 's'}
                        </span>
                      </div>
                      {isExpanded && compSites.length > 0 && (
                        <div className="export-sites">
                          {compSites.map((s) => (
                            <label key={s.id} className="export-row export-row-site">
                              <input
                                type="checkbox"
                                checked={selectedSites.has(s.id)}
                                onChange={() => toggleSite(s.id)}
                              />
                              <span className="export-name">{s.name}</span>
                              <span className="export-meta">
                                {tasksBySite.get(s.id) ?? 0} task
                                {(tasksBySite.get(s.id) ?? 0) === 1 ? '' : 's'}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer export-footer">
          <span className="export-summary">
            <strong>{totalCount}</strong> task{totalCount === 1 ? '' : 's'} selected
          </span>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
            disabled={!canExport}
            style={!canExport ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            Export {totalCount} task{totalCount === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  );
}
