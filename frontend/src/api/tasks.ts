import api from './axios';
import type { ApiResponse, ApprovalQueueItem, PaginatedResponse, Task, TaskFilters } from '@/types';

export interface WorkspaceTaskFilters extends Omit<TaskFilters, 'assignee_id' | 'deadline'> {
  project_id?: number;
  deadline?: 'overdue' | 'next_7_days' | 'none';
}

export interface ApprovalQueueFilters {
  search?: string;
  priority?: Task['priority'];
  project_id?: number;
  page?: number;
  per_page?: number;
}

export interface TaskPayload {
  title: string;
  description?: string | null;
  status?: Task['status'];
  priority?: Task['priority'];
  assignee_id?: number | null;
  parent_task_id?: number | null;
  deadline?: string | null;
  version?: number;
  label_ids?: number[];
  dependency_ids?: number[];
}

export const tasksApi = {
  list: async (projectId: number, filters: TaskFilters = {}): Promise<PaginatedResponse<Task>> => {
    const response = await api.get<PaginatedResponse<Task>>(`/projects/${projectId}/tasks`, { params: filters });
    return response.data;
  },
  myTasks: async (filters: WorkspaceTaskFilters = {}): Promise<PaginatedResponse<Task>> => {
    const response = await api.get<PaginatedResponse<Task>>('/my-tasks', { params: filters });
    return response.data;
  },
  approvals: async (filters: ApprovalQueueFilters = {}): Promise<PaginatedResponse<ApprovalQueueItem>> => {
    const response = await api.get<PaginatedResponse<ApprovalQueueItem>>('/approvals', { params: filters });
    return response.data;
  },
  get: async (id: number): Promise<ApiResponse<Task>> => {
    const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data;
  },
  create: async (projectId: number, payload: TaskPayload): Promise<ApiResponse<Task>> => {
    const response = await api.post<ApiResponse<Task>>(`/projects/${projectId}/tasks`, payload);
    return response.data;
  },
  update: async (id: number, payload: TaskPayload): Promise<ApiResponse<Task>> => {
    const response = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, payload);
    return response.data;
  },
  remove: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
  move: async (id: number, payload: { status: Task['status']; position: number; version: number }): Promise<ApiResponse<Task>> => {
    const response = await api.patch<ApiResponse<Task>>(`/tasks/${id}/move`, payload);
    return response.data;
  },
  submitReview: async (id: number, version: number, comment?: string): Promise<ApiResponse<Task>> => {
    const response = await api.post<ApiResponse<Task>>(`/tasks/${id}/submit-review`, { version, comment });
    return response.data;
  },
  approve: async (id: number, version: number, comment?: string): Promise<ApiResponse<Task>> => {
    const response = await api.post<ApiResponse<Task>>(`/tasks/${id}/approve`, { version, comment });
    return response.data;
  },
  reject: async (id: number, version: number, comment?: string): Promise<ApiResponse<Task>> => {
    const response = await api.post<ApiResponse<Task>>(`/tasks/${id}/reject`, { version, comment });
    return response.data;
  },
  revision: async (id: number, version: number, comment?: string): Promise<ApiResponse<Task>> => {
    const response = await api.post<ApiResponse<Task>>(`/tasks/${id}/request-revision`, { version, comment });
    return response.data;
  },
};
