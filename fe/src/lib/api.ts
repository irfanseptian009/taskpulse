import { apiClient } from './api-client';
import {
  Task,
  TaskLog,
  DashboardSummary,
  UserProfile,
  UserSettings,
  AppNotification,
  AuthResponse,
  AuthUser,
} from '@/types';

export const authApi = {
  register: async (payload: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
    return data;
  },
  login: async (payload: { email: string; password: string }): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return data;
  },
  me: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get<AuthUser>('/auth/me');
    return data;
  },
  changePassword: async (payload: { currentPassword: string; newPassword: string }): Promise<{ success: boolean }> => {
    const { data } = await apiClient.patch<{ success: boolean }>('/auth/password', payload);
    return data;
  },
};

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

export const userApi = {
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get<UserProfile>('/user/profile');
    return data;
  },
  updateProfile: async (
    payload: Partial<Pick<UserProfile, 'displayName' | 'email'>>,
  ): Promise<UserProfile> => {
    const { data } = await apiClient.patch<UserProfile>('/user/profile', payload);
    return data;
  },
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    // Explicitly override headers so Axios correctly sends it as multipart
    const { data } = await apiClient.post<{ avatarUrl: string }>(
      '/user/profile/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },
  getSettings: async (): Promise<UserSettings> => {
    const { data } = await apiClient.get<UserSettings>('/user/settings');
    return data;
  },
  updateSettings: async (payload: Partial<UserSettings>): Promise<UserSettings> => {
    const { data } = await apiClient.patch<UserSettings>('/user/settings', payload);
    return data;
  },
  getNotifications: async (): Promise<AppNotification[]> => {
    const { data } = await apiClient.get<AppNotification[]>('/user/notifications');
    return data;
  },
  markNotificationAsRead: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.patch<{ success: boolean }>(
      `/user/notifications/${id}/read`,
    );
    return data;
  },
};
