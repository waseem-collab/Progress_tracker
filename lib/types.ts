export type TaskStatus = 'enrolled' | 'escalated' | 'in-progress' | 'completed' | 'rejected';
export type Priority = 'low' | 'medium' | 'high';

export interface Company {
  id: string;
  name: string;
  createdAt: number;
}

export interface Site {
  id: string;
  name: string;
  companyId: string;
  createdAt: number;
}

export interface TaskHistoryEntry {
  status: TaskStatus;
  at: number;
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  siteId: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: number;
  updatedAt: number;
  history?: TaskHistoryEntry[];
}

export const STATUSES: TaskStatus[] = ['enrolled', 'escalated', 'in-progress', 'completed', 'rejected'];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  enrolled: 'Enrolled',
  escalated: 'Escalated to Team',
  'in-progress': 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected',
};

export type PersonalStatus = 'enrolled' | 'ongoing' | 'completed';

export const PERSONAL_STATUSES: PersonalStatus[] = ['enrolled', 'ongoing', 'completed'];

export const PERSONAL_STATUS_LABEL: Record<PersonalStatus, string> = {
  enrolled: 'Enrolled',
  ongoing: 'Ongoing',
  completed: 'Completed',
};

export interface PersonalHistoryEntry {
  status: PersonalStatus;
  at: number;
  note?: string;
}

export interface PersonalTask {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  status: PersonalStatus;
  priority?: Priority;
  createdAt: number;
  updatedAt: number;
  history?: PersonalHistoryEntry[];
}
