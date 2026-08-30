import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { operationsApi } from '@/api/operations';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { formatRelativeTime } from '@/utils';

export function NotificationsPage() {
  const client = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: operationsApi.notifications,
  });

  const markAll = useMutation({
    mutationFn: operationsApi.markAllRead,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Semua notifikasi ditandai telah dibaca.');
    },
    onError: () => toast.error('Notifikasi gagal diperbarui.'),
  });

  const markRead = useMutation({
    mutationFn: operationsApi.markRead,
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => toast.error('Notifikasi gagal ditandai telah dibaca.'),
  });

  const notifications = notificationsQuery.data?.data ?? [];
  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifikasi"
        description={unreadCount > 0 ? `${unreadCount} pembaruan belum dibaca.` : 'Semua pembaruan telah dibaca.'}
      >
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll.mutate()}
            isLoading={markAll.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Tandai semua dibaca
          </Button>
        )}
      </PageHeader>

      {notificationsQuery.isLoading ? (
        <ListSkeleton rows={6} />
      ) : notificationsQuery.isError ? (
        <ErrorState
          title="Gagal memuat notifikasi"
          message="Tidak dapat memuat pembaruan saat ini."
          onRetry={() => notificationsQuery.refetch()}
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Belum ada notifikasi"
          description="Pembaruan tugas, komentar, dan tenggat akan muncul di sini."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {notifications.map((notification) => {
              const unread = !notification.read_at;
              const title = String(notification.data.event ?? notification.type);
              const description = String(
                notification.data.task_title ??
                  notification.data.excerpt ??
                  'Tidak ada rincian tambahan.'
              );

              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => unread && markRead.mutate(notification.id)}
                    disabled={!unread}
                    className={`relative flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors duration-150 ease-out hover:bg-input disabled:cursor-default disabled:hover:bg-surface ${
                      unread ? 'bg-primary-subtle/30' : 'bg-surface'
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        unread ? 'bg-primary' : 'bg-border'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                        <span
                          className={`text-[13px] ${
                            unread ? 'font-semibold text-foreground' : 'font-medium text-foreground'
                          }`}
                        >
                          {humanize(title)}
                        </span>
                        <time
                          dateTime={notification.created_at}
                          className="shrink-0 text-[11px] text-foreground-muted/80"
                        >
                          {formatRelativeTime(notification.created_at)}
                        </time>
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-foreground-muted">
                        {description}
                      </span>
                    </span>
                    {unread && <span className="sr-only">Belum dibaca</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function humanize(value: string) {
  return value
    .split('\\')
    .at(-1)!
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
