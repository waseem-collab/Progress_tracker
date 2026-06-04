import type { Task, Company, Site, PersonalTask } from './types';

const NS = 'cs-task-manager';
const tasksKey = (uid: string) => `${NS}.${uid}.tasks.v2`;
const companiesKey = (uid: string) => `${NS}.${uid}.companies.v1`;
const sitesKey = (uid: string) => `${NS}.${uid}.sites.v1`;
const personalKey = (uid: string) => `${NS}.${uid}.personal.v1`;

function loadArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function saveArray<T>(key: string, value: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const loadTasks = (uid: string) => loadArray<Task>(tasksKey(uid));
export const saveTasks = (uid: string, tasks: Task[]) => saveArray(tasksKey(uid), tasks);

export const loadCompanies = (uid: string) => loadArray<Company>(companiesKey(uid));
export const saveCompanies = (uid: string, companies: Company[]) =>
  saveArray(companiesKey(uid), companies);

export const loadSites = (uid: string) => loadArray<Site>(sitesKey(uid));
export const saveSites = (uid: string, sites: Site[]) => saveArray(sitesKey(uid), sites);

export const loadPersonalTasks = (uid: string) => loadArray<PersonalTask>(personalKey(uid));
export const savePersonalTasks = (uid: string, tasks: PersonalTask[]) =>
  saveArray(personalKey(uid), tasks);

export function uid(prefix = 'id'): string {
  return prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
