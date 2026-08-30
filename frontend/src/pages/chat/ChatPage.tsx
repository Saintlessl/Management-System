import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Search, Send, Paperclip, Smile, Reply, Pencil, Trash2, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, useConversation, useMessages, useChatMutations, useChatSearch } from '@/hooks/useChat';
import { useRealtime } from '@/hooks/useRealtime';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { chatApi } from '@/api/chat';
import { formatRelativeTime } from '@/utils';
import type { Conversation, Message } from '@/types';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

export function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(id ? Number(id) : null);
  const effectiveId = id ? Number(id) : activeConversationId;

  const conversationsQuery = useConversations();
  const searchResults = useChatSearch(searchQuery);

  const selectConversation = (cid: number) => {
    setActiveConversationId(cid);
    navigate(`/chat/${cid}`, { replace: true });
    setShowSearch(false);
    setSearchQuery('');
  };

  const startNewChat = async (userId: number) => {
    try {
      const result = await chatApi.createPrivate(userId);
      selectConversation(result.data.id);
    } catch {
      toast.error('Gagal membuat percakapan.');
    }
  };

  const conversations = conversationsQuery.data?.data ?? [];
  const users = searchResults.data?.data?.users ?? [];
  const convResults = searchResults.data?.data?.conversations ?? [];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Sidebar */}
      <div className="flex w-80 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Chat</h2>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setShowSearch(!showSearch)} aria-label="Cari">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showSearch && (
          <div className="border-b border-border px-4 py-3">
            <Input id="chat-search" placeholder="Cari pengguna atau percakapan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery.length >= 2 && (
              <div className="mt-2 max-h-60 space-y-1 overflow-y-auto">
                {users.map((u) => (
                  <button key={u.id} type="button" onClick={() => startNewChat(u.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-input">
                    <Avatar name={u.name} size="xs" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-foreground">{u.name}</div>
                      <div className="truncate text-xs text-foreground-muted">{u.email}</div>
                    </div>
                  </button>
                ))}
                {convResults.map((c) => (
                  <button key={c.id} type="button" onClick={() => selectConversation(c.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-input">
                    <MessageCircle className="h-4 w-4 shrink-0 text-foreground-muted" />
                    <span className="truncate font-medium text-foreground">{c.name || getConversationTitle(c, user?.id)}</span>
                  </button>
                ))}
                {users.length === 0 && convResults.length === 0 && <p className="px-2 py-4 text-center text-xs text-foreground-muted">Tidak ada hasil.</p>}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {conversationsQuery.isLoading ? (
            <div className="space-y-2 p-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <MessageCircle className="h-8 w-8 text-foreground-muted/50" />
              <p className="mt-2 text-sm text-foreground-muted">Belum ada percakapan.</p>
              <p className="mt-1 text-xs text-foreground-muted/70">Gunakan pencarian untuk memulai chat baru.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === effectiveId;
              return (
                <button key={conv.id} type="button" onClick={() => selectConversation(conv.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-input ${isActive ? 'bg-primary-subtle/30' : ''}`}>
                  <div className="relative shrink-0">
                    <Avatar name={conv.name || getConversationTitle(conv, user?.id)} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{conv.name || getConversationTitle(conv, user?.id)}</span>
                      {conv.last_message && <span className="shrink-0 text-[10px] text-foreground-muted/70">{formatRelativeTime(conv.last_message.created_at)}</span>}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-foreground-muted">{conv.last_message?.body || 'Belum ada pesan'}</span>
                      {conv.unread_count > 0 && <Badge tone="accent">{conv.unread_count}</Badge>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {effectiveId ? (
          <ChatThread conversationId={effectiveId} currentUserId={user?.id ?? 0} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <MessageCircle className="h-12 w-12 text-foreground-muted/30" />
            <h3 className="mt-3 text-sm font-medium text-foreground">Pilih percakapan</h3>
            <p className="mt-1 text-xs text-foreground-muted">Pilih percakapan dari daftar atau mulai chat baru.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatThread({ conversationId, currentUserId }: { conversationId: number; currentUserId: number }) {
  const messagesQuery = useMessages(conversationId);
  const conversationQuery = useConversation(conversationId);
  const { sendMessage, deleteMessage, addReaction, removeReaction } = useChatMutations(conversationId);
  const { typingUsers, sendTyping } = useRealtime(conversationId);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allMessages = messagesQuery.data?.pages.flatMap((p: { data: Message[] }) => p.data).reverse() ?? [];
  const conversation = conversationQuery.data?.data;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationId]);

  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [conversationId]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (el) setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  };

  const handleSend = async () => {
    if (!input.trim() && files.length === 0) return;
    try {
      await sendMessage.mutateAsync({ conversationId, payload: { body: input || undefined, parent_id: replyTo?.id, attachments: files.length > 0 ? files : undefined } });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      await sendTyping(false);
      setInput('');
      setReplyTo(null);
      setFiles([]);
    } catch {
      toast.error('Gagal mengirim pesan.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    sendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <Avatar name={conversation?.name || ''} size="sm" />
        <div>
          <h3 className="text-sm font-medium text-foreground">{conversation?.name || 'Percakapan'}</h3>
          <p className="text-xs text-foreground-muted">{conversation?.type === 'private' ? 'Chat pribadi' : conversation?.type === 'team' ? 'Tim' : 'Proyek'}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4">
        {messagesQuery.hasNextPage && (
          <div className="mb-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => messagesQuery.fetchNextPage()}
              isLoading={messagesQuery.isFetchingNextPage}
            >
              Muat pesan lebih lama
            </Button>
          </div>
        )}
        {messagesQuery.isLoading ? (
          <div className="space-y-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-3/4 rounded-lg" />)}</div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-20 text-center">
            <div>
              <MessageCircle className="mx-auto h-8 w-8 text-foreground-muted/30" />
              <p className="mt-2 text-sm text-foreground-muted">Belum ada pesan.</p>
              <p className="mt-1 text-xs text-foreground-muted/70">Kirim pesan pertama untuk memulai percakapan.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {allMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} onReply={setReplyTo} onEdit={() => {}} onDelete={(id) => deleteMessage.mutateAsync(id)} onReaction={(mid, emoji) => addReaction.mutateAsync({ messageId: mid, emoji })} onRemoveReaction={(mid, rid) => removeReaction.mutateAsync({ messageId: mid, reactionId: rid })} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {showScrollBtn && (
        <div className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2">
          <Button size="icon" onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })} className="shadow-lg">
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      <TypingIndicator users={typingUsers} />

      {/* Input area */}
      <div className="shrink-0 border-t border-border px-4 py-3">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-primary-subtle/30 px-3 py-2 text-xs">
            <span className="text-primary">Membalas {replyTo.user?.name}: {replyTo.body?.slice(0, 60)}</span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-foreground-muted hover:text-foreground">✕</button>
          </div>
        )}
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {files.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1 text-xs text-foreground-muted">
                <Paperclip className="h-3 w-3" />{f.name}
                <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-foreground-muted hover:text-danger">✕</button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <label className="shrink-0 cursor-pointer rounded-lg p-2 text-foreground-muted transition-colors hover:bg-input hover:text-foreground">
            <Paperclip className="h-4 w-4" />
            <input type="file" multiple className="hidden" onChange={(e) => setFiles((prev) => [...prev, ...(e.target.files ? Array.from(e.target.files) : [])])} />
          </label>
          <textarea value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Ketik pesan..." rows={1} className="flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() && files.length === 0} isLoading={sendMessage.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, currentUserId, onReply, onEdit, onDelete, onReaction, onRemoveReaction }: {
  message: Message; currentUserId: number;
  onReply: (m: Message) => void; onEdit: (m: Message) => void; onDelete: (id: number) => void;
  onReaction: (messageId: number, emoji: string) => void; onRemoveReaction: (messageId: number, reactionId: number) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const isOwn = message.user_id === currentUserId;
  const reactionsByEmoji = (message.reactions ?? []).reduce<Record<string, typeof message.reactions>>((acc, r) => {
    (acc[r.emoji] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className={`group flex gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-input/50 ${isOwn ? '' : ''}`} onMouseEnter={() => setShowActions(true)} onMouseLeave={() => { setShowActions(false); setShowEmoji(false); }}>
      <Avatar name={message.user?.name || '?'} size="xs" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-foreground">{message.user?.name}</span>
          <time className="text-[10px] text-foreground-muted/70">{formatRelativeTime(message.created_at)}</time>
          {message.edited_at && <span className="text-[10px] text-foreground-muted/50">(diedit)</span>}
        </div>
        {message.parent && (
          <div className="mb-1 truncate rounded border-l-2 border-primary/40 bg-primary-subtle/20 px-2 py-0.5 text-[11px] text-foreground-muted">
            {message.parent.user?.name}: {message.parent.body?.slice(0, 80)}
          </div>
        )}
        <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{message.body}</p>
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {message.attachments.map((att) => (
              <a key={att.id} href={`/api/messages/${message.id}/download/${att.id}`} className="inline-flex items-center gap-1.5 rounded-md bg-surface-muted px-2 py-1 text-xs text-primary hover:underline">
                <Paperclip className="h-3 w-3" />{att.original_name} <span className="text-foreground-muted/60">{att.human_size}</span>
              </a>
            ))}
          </div>
        )}
        {Object.keys(reactionsByEmoji).length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {Object.entries(reactionsByEmoji).map(([emoji, reactions]) => {
              const myReaction = reactions?.find((r) => r.user_id === currentUserId);
              return (
                <button key={emoji} type="button" onClick={() => myReaction ? onRemoveReaction(message.id, myReaction.id) : onReaction(message.id, emoji)} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${myReaction ? 'border-primary bg-primary-subtle text-primary' : 'border-border bg-surface-muted text-foreground-muted hover:border-primary-border'}`}>
                  {emoji} <span className="tabular-nums">{reactions?.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {showActions && (
        <div className="flex shrink-0 items-center gap-0.5">
          <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="rounded p-1 text-foreground-muted hover:bg-surface-muted hover:text-foreground"><Smile className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => onReply(message)} className="rounded p-1 text-foreground-muted hover:bg-surface-muted hover:text-foreground"><Reply className="h-3.5 w-3.5" /></button>
          {isOwn && <button type="button" onClick={() => onEdit(message)} className="rounded p-1 text-foreground-muted hover:bg-surface-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>}
          {isOwn && <button type="button" onClick={() => onDelete(message.id)} className="rounded p-1 text-foreground-muted hover:bg-danger/10 hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>}
        </div>
      )}
      {showEmoji && (
        <div className="absolute right-0 z-20 mt-1 flex gap-1 rounded-lg border border-border bg-surface p-1.5 shadow-lg">
          {QUICK_REACTIONS.map((emoji) => (
            <button key={emoji} type="button" onClick={() => { onReaction(message.id, emoji); setShowEmoji(false); }} className="rounded p-1 text-sm hover:bg-input">{emoji}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function getConversationTitle(conv: Conversation, currentUserId?: number): string {
  if (conv.name) return conv.name;
  if (conv.type === 'private' && conv.participants) {
    const other = conv.participants.find((p) => p.id !== currentUserId);
    return other?.name || 'Chat pribadi';
  }
  if (conv.team) return conv.team.name;
  if (conv.project) return conv.project.name;
  return `Percakapan #${conv.id}`;
}
