import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { operationsApi } from '@/api/operations';
import { Button } from '@/components/ui/Button';

export function NotificationsPage() {
  const client = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: operationsApi.notifications });
  const markAll = useMutation({ mutationFn: operationsApi.markAllRead, onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  const markRead = useMutation({ mutationFn: operationsApi.markRead, onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  return <div className="space-y-5"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Notifications</h1><p className="mt-1 text-sm text-slate-500">Update assignment, workflow, comment, dan deadline.</p></div><Button variant="outline" onClick={() => markAll.mutate()} isLoading={markAll.isPending}><CheckCheck className="mr-2 h-4 w-4" />Mark all read</Button></div><div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">{isLoading ? <div className="p-10 text-center text-slate-500">Memuat notifikasi...</div> : data?.data.length === 0 ? <div className="p-10 text-center text-slate-500"><Bell className="mx-auto mb-3 h-8 w-8" />Belum ada notifikasi.</div> : data?.data.map((item) => <button key={item.id} onClick={() => !item.read_at && markRead.mutate(item.id)} className={`block w-full p-4 text-left ${item.read_at ? 'bg-white' : 'bg-blue-50'}`}><p className="text-sm font-medium">{String(item.data.event ?? item.type)}</p><p className="mt-1 text-sm text-slate-600">{String(item.data.task_title ?? item.data.excerpt ?? '')}</p><p className="mt-2 text-xs text-slate-400">{item.created_at}</p></button>)}</div></div>;
}
