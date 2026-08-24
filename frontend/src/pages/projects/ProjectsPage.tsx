import { useEffect, useState } from 'react';
import axios from 'axios';
import { CalendarDays, FolderKanban, Plus, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/hooks/useAuth';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useProjectMutations, useProjects, useProjectUserOptions } from '@/hooks/useProjects';
import type { ProjectStatus } from '@/types';
import type { ProjectPayload } from '@/api/projects';

const emptyForm: ProjectPayload = { name: '', description: '', status: 'planning', start_date: '', deadline: '', project_manager_id: null };

export function ProjectsPage() {
  const { hasPermission } = useAuth();
  const [params, setParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<ProjectPayload>(emptyForm);
  const search = params.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput);
  const status = (params.get('status') as ProjectStatus | null) ?? undefined;
  const page = Number(params.get('page') ?? 1);
  const { data, isLoading, isError, refetch } = useProjects({ search: debouncedSearch || undefined, status, page, per_page: 12 });
  const { data: userOptions } = useProjectUserOptions(hasPermission('project.create'));
  const { createProject } = useProjectMutations();

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    if (debouncedSearch === search) return;
    const next = new URLSearchParams(params);
    if (debouncedSearch) next.set('search', debouncedSearch); else next.delete('search');
    next.delete('page');
    setParams(next);
  }, [debouncedSearch, search, params, setParams]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createProject.mutateAsync({
        ...form,
        start_date: form.start_date || null,
        deadline: form.deadline || null,
      });
      toast.success('Project berhasil dibuat.');
      setIsOpen(false);
      setForm(emptyForm);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><h1 className="text-2xl font-bold">Projects</h1><p className="mt-1 text-sm text-slate-500">Project yang dapat Anda akses.</p></div>
        {hasPermission('project.create') && <Button onClick={() => setIsOpen(true)}><Plus className="mr-2 h-4 w-4" />Buat project</Button>}
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_220px]">
        <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Cari project..." className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm" /></div>
        <Select options={[{ value: 'planning', label: 'Planning' }, { value: 'active', label: 'Active' }, { value: 'on_hold', label: 'On Hold' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }]} placeholder="Semua status" value={status ?? ''} onChange={(event) => updateParam('status', event.target.value)} />
      </div>

      {isLoading ? <div className="py-16 text-center text-slate-500">Memuat project...</div> : isError ? <div className="py-16 text-center"><p className="text-red-600">Project gagal dimuat.</p><Button variant="outline" className="mt-3" onClick={() => refetch()}>Coba lagi</Button></div> : data?.data.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500"><FolderKanban className="mx-auto mb-3 h-10 w-10" />Belum ada project.</div> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data?.data.map((project) => <Link key={project.id} to={`/projects/${project.id}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow">
          <div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700"><FolderKanban className="h-5 w-5" /></div><StatusBadge status={project.status} /></div>
          <h2 className="mt-4 font-semibold text-slate-900">{project.name}</h2><p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">{project.description || 'Tidak ada deskripsi.'}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-blue-600" style={{ width: `${project.progress ?? 0}%` }} /></div>
          <div className="mt-2 flex justify-between text-xs text-slate-500"><span>{project.progress ?? 0}% selesai</span><span>{project.tasks_count ?? 0} task</span></div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500"><span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{project.deadline ?? 'Tanpa deadline'}</span>{project.is_overdue && <Badge variant="bg-red-100 text-red-700">Overdue</Badge>}</div>
        </Link>)}</div>
      )}

      {data?.meta && data.meta.last_page > 1 && <div className="flex justify-end gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => updateParam('page', String(page - 1))}>Sebelumnya</Button><Button variant="outline" disabled={page >= data.meta.last_page} onClick={() => updateParam('page', String(page + 1))}>Berikutnya</Button></div>}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Buat project" size="lg"><form onSubmit={submit} className="space-y-4">
        <Input id="project-name" label="Nama project" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <div><label className="mb-1 block text-sm font-medium">Deskripsi</label><textarea rows={4} value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
        <div className="grid gap-4 sm:grid-cols-2"><Input id="project-start" label="Tanggal mulai" type="date" value={form.start_date ?? ''} onChange={(event) => setForm({ ...form, start_date: event.target.value })} /><Input id="project-deadline" label="Deadline" type="date" value={form.deadline ?? ''} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></div>
        <Select label="Project Manager" options={(userOptions?.data ?? []).map((user) => ({ value: String(user.id), label: `${user.name} — ${user.email}` }))} placeholder="Pilih manager" value={form.project_manager_id ?? ''} onChange={(event) => setForm({ ...form, project_manager_id: event.target.value ? Number(event.target.value) : null })} />
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button><Button type="submit" isLoading={createProject.isPending}>Simpan</Button></div>
      </form></Modal>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined;
    return error.response?.data?.message ?? (errors ? Object.values(errors)[0]?.[0] : undefined) ?? 'Terjadi kesalahan.';
  }
  return 'Terjadi kesalahan.';
}
