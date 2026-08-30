import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useChatSearch } from '@/hooks/useChat';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (userId: number) => void;
  isLoading: boolean;
}

export function MemberSearchModal({ isOpen, onClose, onSelect, isLoading }: Props) {
  const [query, setQuery] = useState('');
  const { data, isFetching } = useChatSearch(query);
  const users = data?.data?.users ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Percakapan baru" description="Cari pengguna untuk memulai percakapan." size="md">
      <div className="space-y-3">
        <Input id="member-search" label="Cari pengguna" placeholder="Ketik nama atau email..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="max-h-64 overflow-y-auto">
          {query.length < 2 ? (
            <p className="py-4 text-center text-xs text-foreground-muted">Ketik minimal 2 karakter.</p>
          ) : users.length === 0 && !isFetching ? (
            <p className="py-4 text-center text-xs text-foreground-muted">Tidak ditemukan.</p>
          ) : (
            users.map((u) => (
              <button key={u.id} type="button" onClick={() => onSelect(u.id)} disabled={isLoading} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-input">
                <Avatar name={u.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                  <p className="truncate text-xs text-foreground-muted">{u.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
