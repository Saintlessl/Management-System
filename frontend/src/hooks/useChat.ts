import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, type SendMessagePayload } from '@/api/chat';
import type { Message, PaginatedResponse } from '@/types';

export function useConversations(enabled = true) {
  return useQuery({ queryKey: ['conversations'], queryFn: chatApi.conversations, enabled });
}

export function useConversation(id: number) {
  return useQuery({ queryKey: ['conversations', id], queryFn: () => chatApi.getConversation(id), enabled: Boolean(id) });
}

export function useMessages(conversationId: number | null) {
  return useInfiniteQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: ({ pageParam = 1 }: { pageParam: number }) => chatApi.messages(conversationId as number, pageParam),
    getNextPageParam: (lastPage: PaginatedResponse<Message>) => (lastPage.meta.current_page < lastPage.meta.last_page ? lastPage.meta.current_page + 1 : undefined),
    initialPageParam: 1,
    enabled: Boolean(conversationId),
  });
}

export function useChatMutations(conversationId?: number) {
  const client = useQueryClient();
  const invalidateConversations = () => client.invalidateQueries({ queryKey: ['conversations'] });
  const invalidateMessages = () => { if (conversationId) client.invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] }); };

  return {
    createPrivate: useMutation({ mutationFn: chatApi.createPrivate, onSuccess: invalidateConversations }),
    sendMessage: useMutation({ mutationFn: ({ conversationId: cid, payload }: { conversationId: number; payload: SendMessagePayload }) => chatApi.sendMessage(cid, payload), onSuccess: () => { invalidateConversations(); invalidateMessages(); } }),
    updateMessage: useMutation({ mutationFn: ({ id, body }: { id: number; body: string }) => chatApi.updateMessage(id, body), onSuccess: invalidateMessages }),
    deleteMessage: useMutation({ mutationFn: chatApi.deleteMessage, onSuccess: () => { invalidateConversations(); invalidateMessages(); } }),
    addReaction: useMutation({ mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) => chatApi.addReaction(messageId, emoji), onSuccess: invalidateMessages }),
    removeReaction: useMutation({ mutationFn: ({ messageId, reactionId }: { messageId: number; reactionId: number }) => chatApi.removeReaction(messageId, reactionId), onSuccess: invalidateMessages }),
  };
}

export function useChatSearch(query: string) {
  return useQuery({ queryKey: ['chat-search', query], queryFn: () => chatApi.search(query), enabled: query.length >= 2 });
}

// Convenience wrappers used by ChatPage
export function useConversationSearch(query: string) {
  return useQuery({ queryKey: ['chat-search', query], queryFn: () => chatApi.search(query), enabled: query.length >= 2 });
}

export function useCreateConversation() {
  const client = useQueryClient();
  return useMutation({ mutationFn: chatApi.createPrivate, onSuccess: () => client.invalidateQueries({ queryKey: ['conversations'] }) });
}

export function useSendMessage(conversationId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ body, parentId, files }: { body: string | null; parentId?: number; files?: File[] }) =>
      chatApi.sendMessage(conversationId, { body: body ?? undefined, parent_id: parentId, attachments: files }),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['conversations'] }); client.invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] }); },
  });
}

export function useEditMessage() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, body }: { id: number; body: string }) => chatApi.updateMessage(id, body), onSuccess: () => client.invalidateQueries({ queryKey: ['conversations'] }) });
}

export function useDeleteMessage(conversationId: number) {
  const client = useQueryClient();
  return useMutation({ mutationFn: chatApi.deleteMessage, onSuccess: () => { client.invalidateQueries({ queryKey: ['conversations'] }); if (conversationId) client.invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] }); } });
}

export function useToggleReaction(_messageId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ emoji, existingReactionId }: { emoji: string; existingReactionId?: number }) => {
      if (existingReactionId) await chatApi.removeReaction(_messageId, existingReactionId);
      else await chatApi.addReaction(_messageId, emoji);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function usePresenceHeartbeat(enabled = false) {
  return useQuery({ queryKey: ['presence-heartbeat'], queryFn: async () => { await chatApi.heartbeat(); }, enabled, refetchInterval: 60_000, refetchOnWindowFocus: true });
}
