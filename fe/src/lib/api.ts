import { apiClient } from './api-client';
import { Task, TaskLog, DashboardSummary } from '@/types';

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const { data } = await apiClient.get<DashboardSummary>('/dashboard');
    return data;
  },
};

export const tasksApi = {
  getAll: async (): Promise<Task[]> => {
    const { data } = await apiClient.get<Task[]>('/tasks');
    return data;
  },
  getOne: async (id: string): Promise<Task> => {
    const { data } = await apiClient.get<Task>(`/tasks/${id}`);
    return data;
  },
  create: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    const { data } = await apiClient.post<Task>('/tasks', task);
    return data;
  },
  update: async (id: string, task: Partial<Task>): Promise<Task> => {
    const { data } = await apiClient.put<Task>(`/tasks/${id}`, task);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
  getLogs: async (id: string): Promise<TaskLog[]> => {
    const { data } = await apiClient.get<TaskLog[]>(`/tasks/${id}/logs`);
    return data;
  },
};
