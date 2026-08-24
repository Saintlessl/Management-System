import api from './axios';
import type { ApiResponse, AppNotification, AuditLog, DashboardStats } from '@/types';

export const operationsApi = {
  dashboard: async (): Promise<ApiResponse<DashboardStats>> => (await api.get('/dashboard')).data,
  notifications: async (): Promise<{ data: AppNotification[]; meta: { current_page: number; last_page: number; total: number } }> => (await api.get('/notifications')).data,
  unreadCount: async (): Promise<ApiResponse<{ count: number }>> => (await api.get('/notifications/unread-count')).data,
  markRead: async (id: string): Promise<void> => { await api.patch(`/notifications/${id}/read`); },
  markAllRead: async (): Promise<void> => { await api.post('/notifications/mark-all-read'); },
  auditLogs: async (): Promise<{ data: AuditLog[]; meta: { current_page: number; last_page: number; total: number } }> => (await api.get('/audit-logs')).data,
};
