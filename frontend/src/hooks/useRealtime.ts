import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getEcho } from '@/realtime/echo';
import api from '@/api/axios';

export function useRealtime(conversationId: number | null) {
  const client = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setTypingUsers([]);
    if (!conversationId) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`conversation.${conversationId}`);

    const handleNewMessage = () => {
      client.invalidateQueries({ queryKey: ['conversations'] });
      client.invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] });
    };

    const handleNewReaction = () => {
      client.invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] });
    };

    const handleTyping = (data: { user_id: number; user_name: string; is_typing: boolean }) => {
      setTypingUsers((prev) => {
        if (data.is_typing) {
          return prev.includes(data.user_name) ? prev : [...prev, data.user_name];
        }
        return prev.filter((n) => n !== data.user_name);
      });

      // Auto-remove typing after 4s
      if (data.is_typing) {
        const existing = typingTimers.current.get(data.user_id);
        if (existing) clearTimeout(existing);
        typingTimers.current.set(data.user_id, setTimeout(() => {
          setTypingUsers((prev) => prev.filter((n) => n !== data.user_name));
          typingTimers.current.delete(data.user_id);
        }, 4000));
      }
    };

    channel.listen('.message.new', handleNewMessage);
    channel.listen('.reaction.new', handleNewReaction);
    channel.listen('.typing.update', handleTyping);

    return () => {
      const timers = typingTimers.current;
      channel.stopListening('.message.new');
      channel.stopListening('.reaction.new');
      channel.stopListening('.typing.update');
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, [conversationId, client]);

  const sendTyping = useCallback(async (isTyping: boolean) => {
    if (!conversationId) return;
    try {
      await api.post(`/conversations/${conversationId}/typing`, { is_typing: isTyping });
    } catch {
      // Silently fail — typing is best-effort
    }
  }, [conversationId]);

  return { typingUsers, sendTyping };
}
