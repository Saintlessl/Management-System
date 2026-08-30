import api from './axios';
import type { ApiResponse, PaginatedResponse, Team, TeamMember, User } from '@/types';

export interface TeamPayload {
  name: string;
  description?: string | null;
}

export interface TeamMemberPayload {
  user_id: number;
  team_role: TeamMember['team_role'];
}

export const teamsApi = {
  list: async (): Promise<PaginatedResponse<Team>> => (await api.get('/teams')).data,
  get: async (id: number): Promise<ApiResponse<Team>> => (await api.get(`/teams/${id}`)).data,
  create: async (payload: TeamPayload): Promise<ApiResponse<Team>> => (await api.post('/teams', payload)).data,
  update: async (id: number, payload: Partial<TeamPayload>): Promise<ApiResponse<Team>> => (await api.patch(`/teams/${id}`, payload)).data,
  remove: async (id: number): Promise<void> => { await api.delete(`/teams/${id}`); },
  members: async (id: number): Promise<ApiResponse<TeamMember[]>> => (await api.get(`/teams/${id}/members`)).data,
  addMember: async (id: number, payload: TeamMemberPayload): Promise<ApiResponse<TeamMember>> => (await api.post(`/teams/${id}/members`, payload)).data,
  updateMember: async (teamId: number, memberId: number, payload: TeamMemberPayload): Promise<ApiResponse<TeamMember>> => (await api.put(`/teams/${teamId}/members/${memberId}`, payload)).data,
  removeMember: async (teamId: number, memberId: number): Promise<void> => { await api.delete(`/teams/${teamId}/members/${memberId}`); },
  userOptions: async (): Promise<ApiResponse<Pick<User, 'id' | 'name' | 'email'>[]>> => (await api.get('/project-user-options')).data,
};
