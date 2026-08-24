import api, { getCsrfCookie } from './axios';
import type { ApiResponse, User } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
    await getCsrfCookie();
    const response = await api.post<ApiResponse<User>>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/auth/user');
    return response.data;
  },
};
