import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/utils';
import { formatRelativeTime } from '@/utils';
import type { Conversation, User } from '@/types';

interface Props {
  conversations: Conversation[];
  activeId: number | null;
  currentUserId: number;
  onSelect: (id: number) => void;
}

function getConversationName(conversation: Conversation, currentUser?: User): string {
  if (conversation.name) return conversation.name;
  if (conversation.type === 'team' && conversation.team) return `Tim: ${conversation.team.name}`;
  if (conversation.type === 'project' && conversation.project) return `Proyek: ${conversation.project.name}`;
  if (conversation.type === 'private' && conversation.participants) {
    const other = conversation.participants.find((p) => p.id !== currentUser?.id);
    return other?.name ?? 'Percakapan';
  }
  return 'Percakapan';
}

export function ConversationList({ conversations, activeId, currentUserId, onSelect }: Props) {
  return (
    <div className="divide-y divide-border">
      {conversations.map((convo) => {
        const name = getConversationName(convo, { id: currentUserId } as User);
        const isActive = convo.id === activeId;
        return (
          <button
            key={convo.id}
            type="button"
            onClick={() => onSelect(convo.id)}
            className={cn(
              'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
              isActive ? 'bg-primary-subtle' : 'hover:bg-input',
            )}
          >
            <Avatar name={name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-medium text-foreground">{name}</p>
                {convo.unread_count > 0 && (
                  <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground tabular-nums">
                    {convo.unread_count}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-foreground-muted">
                {convo.last_message?.body ?? 'Belum ada pesan.'}
                {convo.last_message?.created_at && (
                  <span className="ml-1 opacity-60">· {formatRelativeTime(convo.last_message.created_at)}</span>
                )}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
