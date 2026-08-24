import api from './axios';
import type { ApiResponse, PaginatedResponse, User } from '@/types';

export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  is_active: boolean;
  role_ids: number[];
}

export interface UserFilters {
  search?: string;
  is_active?: boolean;
  role_id?: number;
  page?: number;
  per_page?: number;
}

export const usersApi = {
  list: async (filters: UserFilters = {}): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>('/admin/users', { params: filters });
    return response.data;
  },
  create: async (payload: UserPayload): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/admin/users', payload);
    return response.data;
  },
  update: async (id: number, payload: Partial<UserPayload>): Promise<ApiResponse<User>> => {
    const response = await api.patch<ApiResponse<User>>(`/admin/users/${id}`, payload);
    return response.data;
  },
  remove: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },
};
