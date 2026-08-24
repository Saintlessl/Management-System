import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { rolesApi } from '@/api/roles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/useRoles';

export function PermissionsPage() {
  const { hasPermission } = useAuth(); const client = useQueryClient(); const { data, isLoading } = usePermissions(); const [open, setOpen] = useState(false); const [form, setForm] = useState({ name: '', slug: '', group: '', description: '' });
  const create = useMutation({ mutationFn: () => rolesApi.createPermission(form), onSuccess: () => { client.invalidateQueries({ queryKey: ['permissions'] }); setOpen(false); toast.success('Permission dibuat.'); }, onError: () => toast.error('Permission gagal dibuat.') });
  const remove = useMutation({ mutationFn: rolesApi.deletePermission, onSuccess: () => client.invalidateQueries({ queryKey: ['permissions'] }), onError: () => toast.error('Permission masih digunakan atau dilindungi.') });
  const grouped = (data?.data ?? []).reduce<Record<string, NonNullable<typeof data>['data']>>((result, item) => { const key = item.group ?? 'Other'; result[key] = [...(result[key] ?? []), item]; return result; }, {});
  return <div className="space-y-5"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Permissions</h1><p className="mt-1 text-sm text-slate-500">Kelola permission granular yang dapat diberikan ke role.</p></div>{hasPermission('permissions.create') && <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Tambah</Button>}</div>{isLoading ? <div>Memuat...</div> : <div className="space-y-4">{Object.entries(grouped).map(([group, items]) => <section key={group} className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">{group}</h2><div className="mt-3 grid gap-2 md:grid-cols-2">{items?.map((permission) => <div key={permission.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3"><div><p className="text-sm font-medium">{permission.name}</p><p className="text-xs text-slate-400">{permission.slug}</p></div>{hasPermission('permissions.delete') && <Button variant="ghost" size="sm" onClick={() => remove.mutate(permission.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>}</div>)}</div></section>)}</div>}<Modal isOpen={open} onClose={() => setOpen(false)} title="Tambah permission"><form onSubmit={(event) => { event.preventDefault(); create.mutate(); }} className="space-y-4"><Input id="permission-name" label="Nama" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /><Input id="permission-slug" label="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="task.custom_action" /><Input id="permission-group" label="Group" value={form.group} onChange={(event) => setForm({ ...form, group: event.target.value })} /><div className="flex justify-end"><Button type="submit" isLoading={create.isPending}>Simpan</Button></div></form></Modal></div>;
}
