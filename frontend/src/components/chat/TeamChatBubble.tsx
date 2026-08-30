import { useState, useEffect, useRef } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ArrowLeft, MessageCircle, Plus, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, useMessages, useChatMutations, useChatSearch } from '@/hooks/useChat';
import { useRealtime } from '@/hooks/useRealtime';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { MemberSearchModal } from '@/components/chat/MemberSearchModal';
import { formatRelativeTime } from '@/utils';
import type { Conversation, Message } from '@/types';

function getConversationTitle(conversation: Conversation, currentUserId?: number): string {
  if (conversation.name) return conversation.name;
  if (conversation.type === 'private') {
    return conversation.participants?.find((participant) => participant.id !== currentUserId)?.name
      ?? 'Chat pribadi';
  }
  if (conversation.team) return conversation.team.name;
  if (conversation.project) return conversation.project.name;
  return `Percakapan #${conversation.id}`;
}

export function TeamChatBubble() {
  const { user, hasPermission } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversationsQuery = useConversations(isOpen);
  const searchResults = useChatSearch(searchQuery);
  const { createPrivate, sendMessage } = useChatMutations(activeConversationId ?? undefined);
  const { typingUsers, sendTyping } = useRealtime(activeConversationId);

  const conversations = conversationsQuery.data?.data ?? [];
  const unreadCount = conversations.reduce((total, conversation) => total + conversation.unread_count, 0);
  const users = searchResults.data?.data?.users ?? [];
  const convResults = searchResults.data?.data?.conversations ?? [];

  const messagesQuery = useMessages(activeConversationId);
  const allMessages = messagesQuery.data?.pages.flatMap((p: { data: Message[] }) => p.data).reverse() ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversationId, allMessages.length]);

  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [activeConversationId]);

  const selectConversation = (cid: number) => {
    setActiveConversationId(cid);
    setSearchQuery('');
  };

  const startNewChat = async (userId: number) => {
    try {
      const result = await createPrivate.mutateAsync(userId);
      selectConversation(result.data.id);
      setIsNewChatOpen(false);
    } catch {
      toast.error('Gagal membuat percakapan. Coba lagi.');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConversationId) return;
    try {
      await sendMessage.mutateAsync({ conversationId: activeConversationId, payload: { body: input.trim() } });
      setInput('');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      await sendTyping(false);
    } catch {
      // Silently fail
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (activeConversationId) {
      sendTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 2000);
    }
  };

  const canCreateChat = hasPermission('chat.create');

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6">
      {isOpen && (
        <div className="flex h-[min(480px,calc(100vh-6rem))] w-[calc(100vw-2rem)] max-w-80 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
          {/* Header */}
          <div className="flex items-center gap-1 border-b border-border px-3 py-2">
            {activeConversationId && (
              <button type="button" onClick={() => setActiveConversationId(null)} aria-label="Kembali ke daftar chat" className="rounded p-1 text-foreground-muted hover:bg-input hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h3 className="text-sm font-semibold text-foreground">Chat</h3>
            <div className="ml-auto flex items-center gap-1">
              {canCreateChat && (
                <button type="button" onClick={() => setIsNewChatOpen(true)} aria-label="Mulai chat baru" className="rounded p-1 text-foreground-muted hover:bg-input hover:text-foreground">
                  <Plus className="h-4 w-4" />
                </button>
              )}
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Tutup panel chat" className="rounded p-1 text-foreground-muted hover:bg-input hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="border-b border-border px-3 py-2">
            <Input
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs"
            />
            {searchQuery.length >= 2 && (
              <div className="mt-1.5 max-h-32 space-y-0.5 overflow-y-auto">
                {users.map((u) => (
                  <button key={u.id} type="button" onClick={() => startNewChat(u.id)} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-input">
                    <Avatar name={u.name} size="xs" />
                    <span className="truncate">{u.name}</span>
                  </button>
                ))}
                {convResults.map((c) => (
                  <button key={c.id} type="button" onClick={() => selectConversation(c.id)} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-input">
                    <MessageCircle className="h-3 w-3 shrink-0 text-foreground-muted" />
                    <span className="truncate">{c.name || 'Percakapan'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!activeConversationId ? (
              <div className="space-y-0.5 p-2">
                {conversationsQuery.isLoading ? (
                  <div className="space-y-2 p-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center px-3 py-8 text-center">
                    <MessageCircle className="h-8 w-8 text-foreground-muted/40" aria-hidden="true" />
                    <p className="mt-2 text-xs font-medium text-foreground">Belum ada percakapan</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-foreground-muted">Mulai chat dengan anggota workspace.</p>
                    {canCreateChat && (
                      <Button size="sm" className="mt-3" onClick={() => setIsNewChatOpen(true)}>
                        <Plus className="h-3.5 w-3.5" />
                        Mulai chat baru
                      </Button>
                    )}
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isActive = conv.id === activeConversationId;
                    const title = getConversationTitle(conv, user?.id);
                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => selectConversation(conv.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors hover:bg-input ${isActive ? 'bg-primary-subtle/30' : ''}`}
                      >
                        <Avatar name={title} size="xs" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{title}</p>
                          <p className="truncate text-foreground-muted">{conv.last_message?.body || 'Belum ada pesan'}</p>
                        </div>
                        {conv.unread_count > 0 && <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{conv.unread_count}</span>}
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="flex-1 overflow-y-auto px-3 py-2">
                  {messagesQuery.isLoading ? (
                    <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-3/4 rounded-lg" />)}</div>
                  ) : allMessages.length === 0 ? (
                    <p className="py-8 text-center text-xs text-foreground-muted">Belum ada pesan.</p>
                  ) : (
                    <div className="space-y-1">
                      {allMessages.map((msg) => {
                        const isOwn = msg.user_id === user?.id;
                        return (
                          <div key={msg.id} className={`flex gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <Avatar name={msg.user?.name ?? '?'} size="xs" className="mt-0.5 shrink-0" />
                            <div className={`max-w-[80%] min-w-0 ${isOwn ? 'items-end' : ''}`}>
                              {!isOwn && <p className="mb-0.5 text-[10px] font-medium text-foreground-muted">{msg.user?.name}</p>}
                              <div className={`rounded-lg px-2 py-1 text-[11px] leading-relaxed ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-input text-foreground'}`}>
                                {msg.body}
                              </div>
                              <p className="mt-0.5 text-[9px] text-foreground-muted/60">{formatRelativeTime(msg.created_at)}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="shrink-0 border-t border-border px-2 py-2">
                  {typingUsers.length > 0 && (
                    <p className="mb-1 text-[10px] text-foreground-muted">{typingUsers.join(', ')} sedang mengetik...</p>
                  )}
                  <div className="flex items-center gap-1">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Ketik pesan..."
                      className="h-7 text-xs"
                    />
                    <Button
                      size="icon-sm"
                      onClick={handleSend}
                      disabled={!input.trim()}
                      isLoading={sendMessage.isPending}
                      aria-label="Kirim pesan"
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        data-testid="query-devtools-above-chat"
        className="flex h-10 w-[50px] items-center justify-center sm:w-14"
      >
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="relative"
          position="bottom"
        />
      </div>

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full border-[3px] border-surface bg-primary text-primary-foreground shadow-lg transition-[transform,box-shadow] duration-200 ease-out hover:scale-105 hover:shadow-xl active:scale-95 sm:h-14 sm:w-14"
        aria-label={isOpen ? 'Tutup chat' : 'Buka team chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : user?.avatar ? (
          <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
        ) : (
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        )}

        {!isOpen && (
          <span
            className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-surface bg-emerald-500"
            aria-label="Online"
          />
        )}

        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white shadow-sm tabular-nums">
            {unreadCount > 99 ? '99+' : unreadCount}
            <span className="sr-only"> pesan belum dibaca</span>
          </span>
        )}
      </button>

      {canCreateChat && (
        <MemberSearchModal
          isOpen={isNewChatOpen}
          onClose={() => setIsNewChatOpen(false)}
          onSelect={startNewChat}
          isLoading={createPrivate.isPending}
        />
      )}
    </div>
  );
}
