import api from './axios';
import type { ApiResponse, Attachment, Comment } from '@/types';

export const collaborationApi = {
  comments: async (taskId: number): Promise<ApiResponse<Comment[]>> => (await api.get(`/tasks/${taskId}/comments`)).data,
  addComment: async (taskId: number, body: string, parent_id?: number): Promise<ApiResponse<Comment>> => (await api.post(`/tasks/${taskId}/comments`, { body, parent_id })).data,
  updateComment: async (id: number, body: string): Promise<ApiResponse<Comment>> => (await api.patch(`/comments/${id}`, { body })).data,
  deleteComment: async (id: number): Promise<void> => { await api.delete(`/comments/${id}`); },
  attachments: async (taskId: number): Promise<ApiResponse<Attachment[]>> => (await api.get(`/tasks/${taskId}/attachments`)).data,
  upload: async (taskId: number, file: File): Promise<ApiResponse<Attachment>> => {
    const body = new FormData(); body.append('file', file);
    return (await api.post(`/tasks/${taskId}/attachments`, body, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },
  downloadUrl: (id: number) => `/api/attachments/${id}/download`,
  deleteAttachment: async (id: number): Promise<void> => { await api.delete(`/attachments/${id}`); },
};
