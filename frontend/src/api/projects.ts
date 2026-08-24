import api from './axios';
import type { ApiResponse, PaginatedResponse, Project, ProjectFilters, ProjectMember, ProjectRole, User } from '@/types';

export interface ProjectPayload {
  name: string;
  description?: string | null;
  status: Project['status'];
  start_date?: string | null;
  deadline?: string | null;
  project_manager_id?: number | null;
}

export interface ProjectMemberPayload {
  user_id: number;
  project_role: ProjectRole;
}

export const projectsApi = {
  list: async (filters: ProjectFilters = {}): Promise<PaginatedResponse<Project>> => {
    const response = await api.get<PaginatedResponse<Project>>('/projects', { params: filters });
    return response.data;
  },
  get: async (id: number): Promise<ApiResponse<Project>> => {
    const response = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    return response.data;
  },
  create: async (payload: ProjectPayload): Promise<ApiResponse<Project>> => {
    const response = await api.post<ApiResponse<Project>>('/projects', payload);
    return response.data;
  },
  update: async (id: number, payload: Partial<ProjectPayload>): Promise<ApiResponse<Project>> => {
    const response = await api.patch<ApiResponse<Project>>(`/projects/${id}`, payload);
    return response.data;
  },
  remove: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
  userOptions: async (): Promise<ApiResponse<Pick<User, 'id' | 'name' | 'email'>[]>> => {
    const response = await api.get<ApiResponse<Pick<User, 'id' | 'name' | 'email'>[]>>('/project-user-options');
    return response.data;
  },
  members: async (id: number): Promise<ApiResponse<ProjectMember[]>> => {
    const response = await api.get<ApiResponse<ProjectMember[]>>(`/projects/${id}/members`);
    return response.data;
  },
  addMember: async (id: number, payload: ProjectMemberPayload): Promise<ApiResponse<ProjectMember>> => {
    const response = await api.post<ApiResponse<ProjectMember>>(`/projects/${id}/members`, payload);
    return response.data;
  },
  updateMember: async (projectId: number, memberId: number, payload: ProjectMemberPayload): Promise<ApiResponse<ProjectMember>> => {
    const response = await api.put<ApiResponse<ProjectMember>>(`/projects/${projectId}/members/${memberId}`, payload);
    return response.data;
  },
  removeMember: async (projectId: number, memberId: number): Promise<void> => {
    await api.delete(`/projects/${projectId}/members/${memberId}`);
  },
  labels: async (projectId: number): Promise<ApiResponse<import('@/types').Label[]>> => (await api.get(`/projects/${projectId}/labels`)).data,
  createLabel: async (projectId: number, payload: { name: string; color: string }): Promise<ApiResponse<import('@/types').Label>> => (await api.post(`/projects/${projectId}/labels`, payload)).data,
  updateLabel: async (id: number, payload: { name?: string; color?: string }): Promise<ApiResponse<import('@/types').Label>> => (await api.patch(`/labels/${id}`, payload)).data,
  removeLabel: async (id: number): Promise<void> => { await api.delete(`/labels/${id}`); },
};
