import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectsApi } from '@/api/projects';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useProjectLabels } from '@/hooks/useProjects';

export function ProjectLabelsPage() {
  const id = Number(useParams().id);
  const { hasPermission } = useAuth();
  const client = useQueryClient();
  const { data, isLoading, isError } = useProjectLabels(id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', color: '#3b82f6' });
  const invalidate = () => client.invalidateQueries({ queryKey: ['projects', id, 'labels'] });
  const create = useMutation({ mutationFn: () => projectsApi.createLabel(id, form), onSuccess: () => { invalidate(); setOpen(false); setForm({ name: '', color: '#3b82f6' }); toast.success('Label dibuat.'); }, onError: () => toast.error('Label gagal dibuat.') });
  const remove = useMutation({ mutationFn: projectsApi.removeLabel, onSuccess: invalidate, onError: () => toast.error('Label gagal dihapus.') });

  return <div className="space-y-5">
    <Link to={`/projects/${id}`} className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"><ArrowLeft className="h-4 w-4" />Kembali ke project</Link>
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Project Labels</h1><p className="mt-1 text-sm text-slate-500">Label hanya dapat digunakan oleh task pada project ini.</p></div>{hasPermission('project.update') && <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Tambah label</Button>}</div>
    {isLoading ? <div className="py-12 text-center">Memuat label...</div> : isError ? <div className="text-red-600">Label gagal dimuat.</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data?.data.map((label) => <article key={label.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-3"><span className="h-4 w-4 rounded-full" style={{ backgroundColor: label.color }} /><div><p className="font-medium">{label.name}</p><p className="text-xs text-slate-400">{label.color}</p></div></div>{hasPermission('project.update') && <Button variant="ghost" size="sm" onClick={() => remove.mutate(label.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>}</article>)}</div>}
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Tambah label"><form onSubmit={(event) => { event.preventDefault(); create.mutate(); }} className="space-y-4"><Input id="label-name" label="Nama" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /><Input id="label-color" label="Warna" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} required /><div className="flex justify-end"><Button type="submit" isLoading={create.isPending}>Simpan</Button></div></form></Modal>
  </div>;
}
