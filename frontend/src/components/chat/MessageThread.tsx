import { useEffect, useRef } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cn, formatRelativeTime } from '@/utils';
import type { Message } from '@/types';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

interface Props {
  messages: Message[];
  currentUserId: number;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onReply: (msg: { id: number; name: string }) => void;
  onEdit: (id: number, body: string) => void;
  onDelete: (id: number) => void;
  onReaction: (messageId: number, emoji: string, existingReactionId?: number) => void;
}

export function MessageThread({ messages, currentUserId, isLoading, hasMore, onLoadMore, onReply, onEdit, onDelete, onReaction }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-input" />
              <div className="space-y-1.5">
                <div className="h-3 w-20 animate-pulse rounded bg-input" />
                <div className="h-4 w-64 animate-pulse rounded bg-input" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
      {hasMore && (
        <div className="mb-4 text-center">
          <Button variant="ghost" size="sm" onClick={onLoadMore}>Muat pesan lebih lama</Button>
        </div>
      )}
      {messages.length === 0 ? (
        <p className="py-8 text-center text-xs text-foreground-muted">Belum ada pesan.</p>
      ) : (
        messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            currentUserId={currentUserId}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onReaction={onReaction}
          />
        ))
      )}
    </div>
  );
}

function MessageBubble({ message: msg, currentUserId, onReply, onEdit, onDelete, onReaction }: { message: Message; currentUserId: number; onReply: (m: { id: number; name: string }) => void; onEdit: (id: number, body: string) => void; onDelete: (id: number) => void; onReaction: (messageId: number, emoji: string, existingReactionId?: number) => void }) {
  const isOwn = msg.user_id === currentUserId;
  const grouped = (msg.reactions ?? []).reduce<Record<string, { emoji: string; count: number; hasOwn: boolean; reactionId: number }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, hasOwn: false, reactionId: r.id };
    acc[r.emoji].count++;
    if (r.user_id === currentUserId) { acc[r.emoji].hasOwn = true; acc[r.emoji].reactionId = r.id; }
    return acc;
  }, {});

  return (
    <div className={cn('group mb-3 flex gap-2.5', isOwn && 'flex-row-reverse')}>
      {!isOwn && <Avatar name={msg.user?.name ?? '?'} size="xs" />}
      <div className={cn('max-w-[75%] min-w-0', isOwn && 'items-end')}>
        {!isOwn && <p className="mb-0.5 text-[11px] font-medium text-foreground-muted">{msg.user?.name}</p>}
        <div className={cn('relative rounded-xl px-3 py-2 text-sm', isOwn ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-foreground')}>
          {msg.body}
          {msg.edited_at && <span className="ml-1 text-[10px] opacity-60">(diedit)</span>}
          <div className="absolute -bottom-2 right-1 hidden gap-0.5 group-hover:flex">
            {QUICK_EMOJIS.slice(0, 4).map((e) => (
              <button key={e} type="button" onClick={() => onReaction(msg.id, e)} className="rounded-full bg-surface p-0.5 text-xs shadow-sm hover:scale-125 transition-transform">{e}</button>
            ))}
          </div>
        </div>
        {Object.keys(grouped).length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.values(grouped).map((g) => (
              <button key={g.emoji} type="button" onClick={() => onReaction(msg.id, g.emoji, g.hasOwn ? g.reactionId : undefined)} className={cn('inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px]', g.hasOwn ? 'border-primary bg-primary-subtle text-primary' : 'border-border bg-surface-muted text-foreground-muted')}>
                {g.emoji} <span className="tabular-nums">{g.count}</span>
              </button>
            ))}
          </div>
        )}
        <p className="mt-0.5 text-[10px] text-foreground-muted/60">{msg.created_at ? formatRelativeTime(msg.created_at) : ''}</p>
        {isOwn && (
          <div className="hidden gap-1 group-hover:flex">
            <button type="button" onClick={() => onEdit(msg.id, msg.body ?? '')} className="text-[10px] text-foreground-muted hover:text-foreground">Edit</button>
            <span className="text-foreground-muted/40">·</span>
            <button type="button" onClick={() => onDelete(msg.id)} className="text-[10px] text-danger hover:text-danger/80">Hapus</button>
          </div>
        )}
        {!isOwn && (
          <div className="hidden gap-1 group-hover:flex">
            <button type="button" onClick={() => onReply({ id: msg.id, name: msg.user?.name ?? '' })} className="text-[10px] text-foreground-muted hover:text-foreground">Balas</button>
          </div>
        )}
      </div>
    </div>
  );
}
