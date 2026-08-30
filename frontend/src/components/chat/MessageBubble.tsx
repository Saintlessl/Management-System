import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/utils';
import type { Message } from '@/types';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥', '👀'];

interface Props {
  message: Message;
  currentUserId: number;
  onReply?: (message: { id: number; name: string }) => void;
  onEdit?: (id: number, body: string) => void;
  onDelete?: (id: number) => void;
  onReaction?: (messageId: number, emoji: string, existingReactionId?: number) => void;
}

export function MessageBubble({ message, currentUserId, onReply, onEdit, onDelete, onReaction }: Props) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(message.body ?? '');
  const isOwn = message.user_id === currentUserId;
  const reactions = message.reactions ?? [];

  const groupedReactions = reactions.reduce<Record<string, { emoji: string; count: number; myReactionId?: number; ids: number[] }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, ids: [] };
    acc[r.emoji].count++;
    acc[r.emoji].ids.push(r.id);
    if (r.user_id === currentUserId) acc[r.emoji].myReactionId = r.id;
    return acc;
  }, {});

  const handleSaveEdit = () => {
    if (editBody.trim() && onEdit) onEdit(message.id, editBody.trim());
    setEditing(false);
  };

  return (
    <div
      className={cn('group relative flex gap-2.5 px-4 py-1.5', isOwn ? 'flex-row-reverse' : '')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactionPicker(false); }}
    >
      <Avatar name={message.user?.name ?? '?'} size="xs" className="mt-0.5 shrink-0" />
      <div className={cn('min-w-0 max-w-[75%]', isOwn ? 'items-end' : '')}>
        {!isOwn && <span className="text-[11px] font-medium text-foreground-muted">{message.user?.name}</span>}
        {message.parent && (
          <div className="mb-1 rounded border-l-2 border-primary/40 bg-primary-subtle/20 px-2 py-1 text-[11px] text-foreground-muted">
            {message.parent.user?.name}: {message.parent.body ? message.parent.body.slice(0, 80) : '📎'}
          </div>
        )}
        <div className={cn('rounded-xl px-3 py-2 text-[13px] leading-relaxed', isOwn ? 'bg-primary text-primary-foreground' : 'bg-input text-foreground')}>
          {editing ? (
            <div className="flex gap-2">
              <input value={editBody} onChange={(e) => setEditBody(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditing(false); }} />
              <button type="button" onClick={handleSaveEdit} className="text-xs text-primary-foreground/80 hover:text-primary-foreground">Simpan</button>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
              {message.edited_at && <span className="mt-0.5 block text-[10px] opacity-60">(diedit)</span>}
            </>
          )}
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-1 space-y-1">
            {message.attachments.map((a) => (
              <a key={a.id} href={`/api/messages/${message.id}/download/${a.id}`} className="flex items-center gap-1.5 rounded bg-surface-muted px-2 py-1 text-[11px] text-primary hover:underline">
                📎 {a.original_name} ({a.human_size})
              </a>
            ))}
          </div>
        )}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.values(groupedReactions).map((g) => (
              <button key={g.emoji} type="button" onClick={() => onReaction?.(message.id, g.emoji, g.myReactionId)} className={cn('inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px]', g.myReactionId ? 'border-primary/40 bg-primary-subtle/30' : 'border-border bg-surface-muted hover:bg-input')}>
                {g.emoji} {g.count}
              </button>
            ))}
          </div>
        )}
      </div>
      {showActions && !editing && (
        <div className={cn('absolute top-0 z-10 flex items-center gap-0.5 rounded-lg border border-border bg-surface px-1 py-0.5 shadow-sm', isOwn ? 'left-0 -translate-y-1/2' : 'right-0 -translate-y-1/2')}>
          <button type="button" onClick={() => setShowReactionPicker(!showReactionPicker)} className="rounded p-1 text-xs hover:bg-input" title="Reaksi">😊</button>
          {onReply && <button type="button" onClick={() => onReply({ id: message.id, name: message.user?.name ?? '' })} className="rounded p-1 text-xs hover:bg-input" title="Balas">↩</button>}
          {isOwn && onEdit && <button type="button" onClick={() => setEditing(true)} className="rounded p-1 text-xs hover:bg-input" title="Edit">✏️</button>}
          {isOwn && onDelete && <button type="button" onClick={() => onDelete(message.id)} className="rounded p-1 text-xs hover:bg-input text-danger" title="Hapus">🗑</button>}
        </div>
      )}
      {showReactionPicker && (
        <div className={cn('absolute z-20 flex gap-0.5 rounded-lg border border-border bg-surface px-2 py-1 shadow-lg', isOwn ? 'left-0' : 'right-0')} style={{ top: '100%' }}>
          {QUICK_REACTIONS.map((emoji) => (
            <button key={emoji} type="button" onClick={() => { onReaction?.(message.id, emoji); setShowReactionPicker(false); }} className="rounded p-1 text-sm hover:bg-input">{emoji}</button>
          ))}
        </div>
      )}
    </div>
  );
}
