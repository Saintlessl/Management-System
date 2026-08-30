import api from './axios';
import type { ApiResponse, PaginatedResponse, Conversation, Message, MessageReaction, User } from '@/types';

export interface SendMessagePayload {
  body?: string;
  parent_id?: number;
  attachments?: File[];
}

export const chatApi = {
  conversations: async (): Promise<PaginatedResponse<Conversation>> => (await api.get('/conversations')).data,
  getConversation: async (id: number): Promise<ApiResponse<Conversation>> => (await api.get(`/conversations/${id}`)).data,
  createPrivate: async (userId: number): Promise<ApiResponse<Conversation>> => (await api.post('/conversations', { user_id: userId })).data,

  messages: async (conversationId: number, page = 1): Promise<PaginatedResponse<Message>> => (await api.get(`/conversations/${conversationId}/messages`, { params: { page } })).data,

  sendMessage: async (conversationId: number, payload: SendMessagePayload): Promise<ApiResponse<Message>> => {
    const formData = new FormData();
    if (payload.body) formData.append('body', payload.body);
    if (payload.parent_id) formData.append('parent_id', String(payload.parent_id));
    if (payload.attachments) {
      payload.attachments.forEach((file) => formData.append('attachments[]', file));
    }
    const response = await api.post(`/conversations/${conversationId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateMessage: async (id: number, body: string): Promise<ApiResponse<Message>> => (await api.patch(`/messages/${id}`, { body })).data,
  deleteMessage: async (id: number): Promise<void> => { await api.delete(`/messages/${id}`); },
  downloadAttachment: async (messageId: number, attachmentId: number): Promise<Blob> => (await api.get(`/messages/${messageId}/download/${attachmentId}`, { responseType: 'blob' })).data,

  addReaction: async (messageId: number, emoji: string): Promise<ApiResponse<MessageReaction>> => (await api.post(`/messages/${messageId}/reactions`, { emoji })).data,
  removeReaction: async (messageId: number, reactionId: number): Promise<void> => { await api.delete(`/messages/${messageId}/reactions/${reactionId}`); },

  search: async (query: string): Promise<ApiResponse<{ users: User[]; conversations: Conversation[] }>> => (await api.get('/conversations/search', { params: { query } })).data,

  heartbeat: async (): Promise<void> => { await api.post('/presence/heartbeat'); },
  offline: async (): Promise<void> => { await api.post('/presence/offline'); },
  typing: async (conversationId: number, isTyping: boolean): Promise<void> => { await api.post(`/conversations/${conversationId}/typing`, { is_typing: isTyping }); },
};
