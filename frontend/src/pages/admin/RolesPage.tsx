import { useMemo, useState } from 'react';
import axios from 'axios';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions, useRoleMutations, useRoles } from '@/hooks/useRoles';
import type { Role } from '@/types';
import type { RolePayload } from '@/api/roles';

const emptyForm: RolePayload = { name: '', slug: '', description: '', permission_ids: [] };

export function RolesPage() {
  const { hasPermission } = useAuth();
  const { data: roleResponse, isLoading, isError, refetch } = useRoles();
  const canMutateRoles = hasPermission('roles.create') || hasPermission('roles.update');
  const { data: permissionResponse, isError: permissionsError } = usePermissions(canMutateRoles);
  const { createRole, updateRole, deleteRole } = useRoleMutations();
  const [isOpen, setIsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form, setForm] = useState<RolePayload>(emptyForm);

  const roles = roleResponse?.data ?? [];
  const isSaving = createRole.isPending || updateRole.isPending;
  const groupedPermissions = useMemo(() => {
    const permissions = permissionResponse?.data ?? [];
    return permissions.reduce<Record<string, typeof permissions>>((groups, permission) => {
      const group = permission.group ?? 'Lainnya';
      groups[group] = [...(groups[group] ?? []), permission];
      return groups;
    }, {});
  }, [permissionResponse?.data]);

  const openCreate = () => {
    setEditingRole(null);
    setForm(emptyForm);
    setIsOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      slug: role.slug,
      description: role.description ?? '',
      permission_ids: role.permissions?.map((permission) => permission.id) ?? [],
    });
    setIsOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingRole) {
        await updateRole.mutateAsync({ id: editingRole.id, payload: form });
        toast.success('Role berhasil diperbarui.');
      } else {
        await createRole.mutateAsync(form);
        toast.success('Role berhasil dibuat.');
      }
      setIsOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRole.mutateAsync(deleteTarget.id);
      toast.success('Role berhasil dihapus.');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const togglePermission = (permissionId: number) => {
    setForm((current) => ({
      ...current,
      permission_ids: current.permission_ids.includes(permissionId)
        ? current.permission_ids.filter((id) => id !== permissionId)
        : [...current.permission_ids, permissionId],
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><h1 className="text-2xl font-bold">Role & Permission</h1><p className="mt-1 text-sm text-slate-500">Atur kelompok akses yang dapat ditetapkan kepada pengguna.</p></div>
        {hasPermission('roles.create') && <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Tambah role</Button>}
      </div>

      {isLoading ? <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">Memuat role...</div> : isError ? <div className="rounded-xl border border-red-200 bg-white p-10 text-center"><p className="text-red-600">Role gagal dimuat.</p><Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Coba lagi</Button></div> : roles.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">Belum ada role.</div> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => {
            const isSystemRole = role.slug === 'super-admin';
            return (
              <article key={role.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"><ShieldCheck className="h-5 w-5" /></div>
                  <div className="flex gap-1">
                    {hasPermission('roles.update') && !isSystemRole && <Button variant="ghost" size="sm" onClick={() => openEdit(role)} aria-label={`Edit ${role.name}`}><Pencil className="h-4 w-4" /></Button>}
                    {hasPermission('roles.delete') && !isSystemRole && <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(role)} aria-label={`Hapus ${role.name}`}><Trash2 className="h-4 w-4 text-red-600" /></Button>}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2"><h2 className="font-semibold">{role.name}</h2>{isSystemRole && <Badge variant="bg-blue-100 text-blue-700">Sistem</Badge>}</div>
                <p className="mt-1 text-xs text-slate-400">{role.slug}</p>
                <p className="mt-3 min-h-10 text-sm text-slate-500">{role.description || 'Tidak ada deskripsi.'}</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500"><span>{role.permissions?.length ?? 0} permission</span><span>{role.users_count ?? 0} pengguna</span></div>
              </article>
            );
          })}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingRole ? 'Edit role' : 'Tambah role'} size="xl">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="role-name" label="Nama role" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <Input id="role-slug" label="Slug (opsional)" value={form.slug ?? ''} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="otomatis-dari-nama" />
          </div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Deskripsi</label><textarea value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <fieldset><legend className="text-sm font-medium text-slate-700">Permission</legend>{permissionsError ? <p className="mt-2 text-sm text-red-600">Daftar permission gagal dimuat. Tutup form dan coba lagi.</p> : <div className="mt-3 space-y-4">{Object.entries(groupedPermissions).map(([group, items]) => <div key={group} className="rounded-lg border border-slate-200 p-4"><p className="text-sm font-semibold">{group}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{items?.map((permission) => <label key={permission.id} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.permission_ids.includes(permission.id)} onChange={() => togglePermission(permission.id)} className="mt-0.5 h-4 w-4 rounded border-slate-300" /><span><span className="block font-medium">{permission.name}</span><span className="text-xs text-slate-400">{permission.slug}</span></span></label>)}</div></div>)}</div>}</fieldset>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button><Button type="submit" isLoading={isSaving} disabled={permissionsError}>Simpan</Button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={deleteTarget !== null} title="Hapus role" message={`Hapus role ${deleteTarget?.name ?? ''}? Role yang masih digunakan tidak dapat dihapus.`} onClose={() => setDeleteTarget(null)} onConfirm={remove} isLoading={deleteRole.isPending} />
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const validationErrors = error.response?.data?.errors as Record<string, string[]> | undefined;
    return validationErrors ? Object.values(validationErrors)[0]?.[0] : error.response?.data?.message ?? 'Terjadi kesalahan.';
  }
  return 'Terjadi kesalahan.';
}
