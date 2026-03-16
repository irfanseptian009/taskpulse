export type TaskStatus = 'active' | 'paused';
export type LogStatus = 'success' | 'failed';

export interface Task {
  id: string;
  name: string;
  schedule: string;
  webhookUrl: string;
  payloadJson: Record<string, any>;
  maxRetry: number;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaskLog {
  id: string;
  taskId: string;
  executionTime: string;
  status: LogStatus;
  retryCount: number;
  message: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  total_tasks: number;
  active_tasks: number;
  failed_tasks: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
