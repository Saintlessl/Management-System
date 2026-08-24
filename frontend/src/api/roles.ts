import api from './axios';
import type { ApiResponse, Permission, Role } from '@/types';

export interface RolePayload {
  name: string;
  slug?: string;
  description?: string | null;
  permission_ids: number[];
}

export const rolesApi = {
  list: async (): Promise<ApiResponse<Role[]>> => {
    const response = await api.get<ApiResponse<Role[]>>('/admin/roles');
    return response.data;
  },
  create: async (payload: RolePayload): Promise<ApiResponse<Role>> => {
    const response = await api.post<ApiResponse<Role>>('/admin/roles', payload);
    return response.data;
  },
  update: async (id: number, payload: Partial<RolePayload>): Promise<ApiResponse<Role>> => {
    const response = await api.patch<ApiResponse<Role>>(`/admin/roles/${id}`, payload);
    return response.data;
  },
  remove: async (id: number): Promise<void> => {
    await api.delete(`/admin/roles/${id}`);
  },
  options: async (): Promise<ApiResponse<Pick<Role, 'id' | 'name' | 'slug'>[]>> => {
    const response = await api.get<ApiResponse<Pick<Role, 'id' | 'name' | 'slug'>[]>>('/admin/role-options');
    return response.data;
  },
  permissions: async (): Promise<ApiResponse<Permission[]>> => {
    const response = await api.get<ApiResponse<Permission[]>>('/admin/permissions');
    return response.data;
  },
  createPermission: async (payload: Pick<Permission, 'name' | 'slug' | 'group' | 'description'>): Promise<ApiResponse<Permission>> => (await api.post('/admin/permissions', payload)).data,
  updatePermission: async (id: number, payload: Partial<Permission>): Promise<ApiResponse<Permission>> => (await api.patch(`/admin/permissions/${id}`, payload)).data,
  deletePermission: async (id: number): Promise<void> => { await api.delete(`/admin/permissions/${id}`); },
};
