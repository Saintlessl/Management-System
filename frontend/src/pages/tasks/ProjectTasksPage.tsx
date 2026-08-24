import { useState } from 'react';
import axios from 'axios';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/hooks/useAuth';
import { useProjectLabels, useProjectMembers } from '@/hooks/useProjects';
import { useTaskMutations, useTasks } from '@/hooks/useTasks';
import type { TaskFilters, TaskPriority, TaskStatus } from '@/types';
import type { TaskPayload } from '@/api/tasks';

const emptyForm: TaskPayload = { title: '', description: '', priority: 'medium', assignee_id: null, deadline: '' };

export function ProjectTasksPage() {
  const projectId = Number(useParams().id);
  const { hasPermission } = useAuth();
  const [params, setParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<TaskPayload>(emptyForm);
  const filters: TaskFilters = {
    search: params.get('search') || undefined,
    status: (params.get('status') as TaskStatus | null) ?? undefined,
    priority: (params.get('priority') as TaskPriority | null) ?? undefined,
    page: Number(params.get('page') ?? 1),
    per_page: 20,
  };
  const { data, isLoading, isError, refetch } = useTasks(projectId, filters);
  const { data: members } = useProjectMembers(projectId);
  const { data: labels } = useProjectLabels(projectId);
  const { createTask } = useTaskMutations(projectId);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createTask.mutateAsync({ ...form, deadline: form.deadline || null });
      toast.success('Task berhasil dibuat.');
      setIsOpen(false);
      setForm(emptyForm);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-5">
      <div><Link to={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"><ArrowLeft className="h-4 w-4" />Kembali ke project</Link></div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold">Tasks</h1><p className="mt-1 text-sm text-slate-500">Kelola task, assignee, deadline, dan status.</p></div>{hasPermission('task.create') && <Button onClick={() => setIsOpen(true)}><Plus className="mr-2 h-4 w-4" />Buat task</Button>}</div>
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_180px]">
        <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={filters.search ?? ''} onChange={(event) => updateParam('search', event.target.value)} placeholder="Cari task..." className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm" /></div>
        <Select options={statusOptions} placeholder="Semua status" value={filters.status ?? ''} onChange={(event) => updateParam('status', event.target.value)} />
        <Select options={priorityOptions} placeholder="Semua prioritas" value={filters.priority ?? ''} onChange={(event) => updateParam('priority', event.target.value)} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-190 text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Task</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Assignee</th><th className="px-4 py-3">Deadline</th></tr></thead><tbody className="divide-y divide-slate-100">
        {isLoading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">Memuat task...</td></tr> : isError ? <tr><td colSpan={5} className="px-4 py-12 text-center"><p className="text-red-600">Task gagal dimuat.</p><Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Coba lagi</Button></td></tr> : data?.data.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">Belum ada task.</td></tr> : data?.data.map((task) => <tr key={task.id}><td className="px-4 py-3"><Link to={`/tasks/${task.id}`} className="font-medium text-blue-700 hover:underline">{task.title}</Link><p className="mt-1 line-clamp-1 text-xs text-slate-400">{task.description}</p></td><td className="px-4 py-3"><StatusBadge status={task.status} /></td><td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td><td className="px-4 py-3 text-slate-600">{task.assignee?.name ?? 'Unassigned'}</td><td className="px-4 py-3 text-slate-600">{task.deadline ?? '—'}</td></tr>)}</tbody></table></div>
      {data?.meta && data.meta.last_page > 1 && <div className="flex justify-end gap-2"><Button variant="outline" disabled={(filters.page ?? 1) <= 1} onClick={() => updateParam('page', String((filters.page ?? 1) - 1))}>Sebelumnya</Button><Button variant="outline" disabled={(filters.page ?? 1) >= data.meta.last_page} onClick={() => updateParam('page', String((filters.page ?? 1) + 1))}>Berikutnya</Button></div>}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Buat task" size="lg"><form onSubmit={submit} className="space-y-4"><Input id="task-title" label="Judul" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /><div><label className="mb-1 block text-sm font-medium">Deskripsi</label><textarea rows={4} value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div><div className="grid gap-4 sm:grid-cols-2"><Select label="Prioritas" options={priorityOptions} value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })} /><Select label="Assignee" options={(members?.data ?? []).map((member) => ({ value: String(member.user_id), label: member.user?.name ?? `User #${member.user_id}` }))} placeholder="Unassigned" value={form.assignee_id ?? ''} onChange={(event) => setForm({ ...form, assignee_id: event.target.value ? Number(event.target.value) : null })} /></div><div className="grid gap-4 sm:grid-cols-2"><Select label="Parent task" options={(data?.data ?? []).map((task) => ({ value: String(task.id), label: task.title }))} placeholder="Tidak ada parent" value={form.parent_task_id ?? ''} onChange={(event) => setForm({ ...form, parent_task_id: event.target.value ? Number(event.target.value) : null })} /><Select label="Dependency" options={(data?.data ?? []).map((task) => ({ value: String(task.id), label: task.title }))} placeholder="Tidak ada dependency" value={form.dependency_ids?.[0] ?? ''} onChange={(event) => setForm({ ...form, dependency_ids: event.target.value ? [Number(event.target.value)] : [] })} /></div><fieldset><legend className="text-sm font-medium text-slate-700">Labels</legend><div className="mt-2 flex flex-wrap gap-2">{labels?.data.map((label) => <label key={label.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" checked={form.label_ids?.includes(label.id) ?? false} onChange={(event) => setForm({ ...form, label_ids: event.target.checked ? [...(form.label_ids ?? []), label.id] : (form.label_ids ?? []).filter((id) => id !== label.id) })} /><span className="h-3 w-3 rounded-full" style={{ backgroundColor: label.color }} />{label.name}</label>)}</div></fieldset><Input id="task-deadline" label="Deadline" type="date" value={form.deadline ?? ''} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /><div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button><Button type="submit" isLoading={createTask.isPending}>Simpan</Button></div></form></Modal>
    </div>
  );
}

const statusOptions = [{ value: 'backlog', label: 'Backlog' }, { value: 'todo', label: 'To Do' }, { value: 'in_progress', label: 'In Progress' }, { value: 'review', label: 'Review' }, { value: 'done', label: 'Done' }];
const priorityOptions = [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }];
function getErrorMessage(error: unknown): string { if (axios.isAxiosError(error)) return error.response?.data?.message ?? 'Task gagal disimpan.'; return 'Task gagal disimpan.'; }
