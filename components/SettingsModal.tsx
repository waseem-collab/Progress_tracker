'use client';

import { useEffect, useState } from 'react';
import type { Company, Site } from '@/lib/types';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  open: boolean;
  companies: Company[];
  sites: Site[];
  taskCountBySite: Map<string, number>;
  onClose: () => void;
  onDeleteCompany: (id: string) => void;
  onDeleteSite: (id: string) => void;
  onAddCompany: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onAddSiteToCompany: (companyId: string, e: React.MouseEvent<HTMLButtonElement>) => void;
}

type Pending =
  | { kind: 'company'; id: string; name: string; sitesCount: number; tasksCount: number }
  | { kind: 'site'; id: string; name: string; tasksCount: number }
  | null;

export default function SettingsModal({
  open,
  companies,
  sites,
  taskCountBySite,
  onClose,
  onDeleteCompany,
  onDeleteSite,
  onAddCompany,
  onAddSiteToCompany,
}: Props) {
  const [pending, setPending] = useState<Pending>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, pending]);

  if (!open) return null;

  const sortedCompanies = [...companies].sort((a, b) => a.name.localeCompare(b.name));

  const requestDeleteCompany = (c: Company) => {
    const companySites = sites.filter((s) => s.companyId === c.id);
    const tasksCount = companySites.reduce((n, s) => n + (taskCountBySite.get(s.id) || 0), 0);
    setPending({
      kind: 'company',
      id: c.id,
      name: c.name,
      sitesCount: companySites.length,
      tasksCount,
    });
  };

  const requestDeleteSite = (s: Site) => {
    setPending({
      kind: 'site',
      id: s.id,
      name: s.name,
      tasksCount: taskCountBySite.get(s.id) || 0,
    });
  };

  const performDelete = () => {
    if (!pending) return;
    if (pending.kind === 'company') onDeleteCompany(pending.id);
    else onDeleteSite(pending.id);
    setPending(null);
  };

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
          <div className="modal-header">
            <h2 id="settingsTitle">Manage companies &amp; sites</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
          <div className="modal-body settings-body">
            <button type="button" className="settings-add-company" onClick={onAddCompany}>
              + Add Company
            </button>

            {sortedCompanies.length === 0 ? (
              <p className="settings-empty">No companies yet. Click <strong>+ Add Company</strong> above to start.</p>
            ) : (
              <div className="settings-list">
                {sortedCompanies.map((c) => {
                  const companySites = sites
                    .filter((s) => s.companyId === c.id)
                    .sort((a, b) => a.name.localeCompare(b.name));
                  return (
                    <div key={c.id} className="settings-company-block">
                      <div className="settings-row settings-row-company">
                        <span className="settings-name">{c.name}</span>
                        <button
                          type="button"
                          className="settings-add-site"
                          onClick={(e) => onAddSiteToCompany(c.id, e)}
                        >
                          + Add Site
                        </button>
                        <button
                          type="button"
                          className="settings-delete"
                          onClick={() => requestDeleteCompany(c)}
                          title={`Delete ${c.name}`}
                          aria-label={`Delete ${c.name}`}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                      {companySites.length === 0 ? (
                        <div className="settings-substate">No sites yet</div>
                      ) : (
                        <ul className="settings-sites">
                          {companySites.map((s) => {
                            const taskCount = taskCountBySite.get(s.id) || 0;
                            return (
                              <li key={s.id} className="settings-row settings-row-site">
                                <span className="settings-name">{s.name}</span>
                                <span className="settings-meta">
                                  {taskCount} task{taskCount === 1 ? '' : 's'}
                                </span>
                                <button
                                  type="button"
                                  className="settings-delete"
                                  onClick={() => requestDeleteSite(s)}
                                  title={`Delete ${s.name}`}
                                  aria-label={`Delete ${s.name}`}
                                >
                                  <TrashIcon />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pending}
        title={
          pending?.kind === 'company'
            ? `Delete "${pending.name}"?`
            : pending?.kind === 'site'
            ? `Delete site "${pending.name}"?`
            : ''
        }
        message={
          pending?.kind === 'company'
            ? `This will also delete ${pending.sitesCount} site${
                pending.sitesCount === 1 ? '' : 's'
              } and ${pending.tasksCount} task${pending.tasksCount === 1 ? '' : 's'}. This cannot be undone.`
            : pending?.kind === 'site'
            ? `${pending.tasksCount} task${
                pending.tasksCount === 1 ? '' : 's'
              } under this site will be deleted. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={performDelete}
        onCancel={() => setPending(null)}
      />
    </>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
