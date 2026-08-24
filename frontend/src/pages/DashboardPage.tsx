import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock3, FolderKanban, ListTodo, Users } from 'lucide-react';
import { operationsApi } from '@/api/operations';

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['dashboard'], queryFn: operationsApi.dashboard });
  if (isLoading) return <div className="py-16 text-center text-slate-500">Memuat dashboard...</div>;
  if (isError || !data) return <div className="py-16 text-center text-red-600">Dashboard gagal dimuat.</div>;
  const stats = data.data;
  const cards = [
    { label: 'Total Projects', value: stats.total_projects ?? 0, icon: FolderKanban, color: 'text-blue-600 bg-blue-100' },
    { label: 'Active Projects', value: stats.active_projects ?? 0, icon: Clock3, color: 'text-indigo-600 bg-indigo-100' },
    { label: 'Total Tasks', value: stats.total_tasks ?? 0, icon: ListTodo, color: 'text-amber-600 bg-amber-100' },
    { label: 'Completed Tasks', value: stats.done_tasks ?? 0, icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
  ];
  if (stats.total_users !== undefined && stats.total_users !== null) cards.unshift({ label: 'Total Users', value: stats.total_users, icon: Users, color: 'text-purple-600 bg-purple-100' });
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Dashboard</h1><p className="mt-1 text-sm text-slate-500">Ringkasan project dan task sesuai akses Anda.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map((card) => { const Icon = card.icon; return <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}><Icon className="h-5 w-5" /></div><p className="mt-4 text-2xl font-bold">{card.value}</p><p className="mt-1 text-sm text-slate-500">{card.label}</p></article>; })}</div><div className="grid gap-4 sm:grid-cols-3"><Summary label="Overdue Projects" value={stats.overdue_projects ?? 0} /><Summary label="Overdue Tasks" value={stats.overdue_tasks ?? 0} /><Summary label="Due Soon" value={stats.due_soon_tasks ?? 0} /></div></div>;
}
function Summary({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>; }
