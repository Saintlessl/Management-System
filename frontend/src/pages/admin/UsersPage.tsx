import { useMemo, useState } from 'react';
import axios from 'axios';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useRoleOptions } from '@/hooks/useRoles';
import { useUserMutations, useUsers } from '@/hooks/useUsers';
import type { User } from '@/types';
import type { UserPayload } from '@/api/users';

const emptyForm: UserPayload = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  is_active: true,
  role_ids: [],
};

export function UsersPage() {
  const { user: currentUser, hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [form, setForm] = useState<UserPayload>(emptyForm);
  const canEditUsers = hasPermission('users.create') || hasPermission('users.update');
  const { data, isLoading, isError, refetch } = useUsers({ search: search || undefined, page, per_page: 10 });
  const { data: roleResponse, isError: roleOptionsError } = useRoleOptions(canEditUsers);
  const { createUser, updateUser, deleteUser } = useUserMutations();

  const roles = roleResponse?.data ?? [];
  const users = data?.data ?? [];
  const isSaving = createUser.isPending || updateUser.isPending;

  const title = useMemo(() => editingUser ? 'Edit pengguna' : 'Tambah pengguna', [editingUser]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setIsOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      password_confirmation: '',
      is_active: user.is_active,
      role_ids: user.roles?.map((role) => role.id) ?? [],
    });
    setIsOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingUser) {
        const payload: Partial<UserPayload> = { ...form };
        if (!payload.password) {
          delete payload.password;
          delete payload.password_confirmation;
        }
        await updateUser.mutateAsync({ id: editingUser.id, payload });
        toast.success('Pengguna berhasil diperbarui.');
      } else {
        await createUser.mutateAsync(form);
        toast.success('Pengguna berhasil dibuat.');
      }
      setIsOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      toast.success('Pengguna berhasil dihapus.');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const toggleRole = (roleId: number) => {
    setForm((current) => ({
      ...current,
      role_ids: current.role_ids.includes(roleId)
        ? current.role_ids.filter((id) => id !== roleId)
        : [...current.role_ids, roleId],
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Pengguna</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola akun, status, dan role pengguna.</p>
        </div>
        {hasPermission('users.create') && <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Tambah pengguna</Button>}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Cari nama atau email..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Pengguna</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Memuat pengguna...</td></tr>
              ) : isError ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center"><p className="text-red-600">Pengguna gagal dimuat.</p><Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Coba lagi</Button></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Belum ada pengguna.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3"><p className="font-medium text-slate-900">{user.name}</p><p className="text-slate-500">{user.email}</p></td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{user.roles?.map((role) => <Badge key={role.id}>{role.name}</Badge>)}</div></td>
                  <td className="px-4 py-3"><Badge variant={user.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}>{user.is_active ? 'Aktif' : 'Nonaktif'}</Badge></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1">
                    {hasPermission('users.update') && <Button variant="ghost" size="sm" onClick={() => openEdit(user)} aria-label={`Edit ${user.name}`}><Pencil className="h-4 w-4" /></Button>}
                    {hasPermission('users.delete') && currentUser?.id !== user.id && <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(user)} aria-label={`Hapus ${user.name}`}><Trash2 className="h-4 w-4 text-red-600" /></Button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data?.meta && data.meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
            <span className="text-slate-500">Halaman {data.meta.current_page} dari {data.meta.last_page}</span>
            <div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</Button><Button variant="outline" size="sm" disabled={page >= data.meta.last_page} onClick={() => setPage(page + 1)}>Berikutnya</Button></div>
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title} size="lg">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="user-name" label="Nama" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <Input id="user-email" label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            <Input id="user-password" label={editingUser ? 'Password baru (opsional)' : 'Password'} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!editingUser} />
            <Input id="user-password-confirmation" label="Konfirmasi password" type="password" value={form.password_confirmation} onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })} required={!editingUser || Boolean(form.password)} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.is_active} disabled={editingUser?.id === currentUser?.id} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} className="h-4 w-4 rounded border-slate-300" />Akun aktif</label>
          <fieldset><legend className="text-sm font-medium text-slate-700">Role</legend>{roleOptionsError ? <p className="mt-2 text-sm text-red-600">Pilihan role gagal dimuat. Tutup form dan coba lagi.</p> : <div className="mt-2 grid gap-2 sm:grid-cols-2">{roles.map((role) => <label key={role.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="checkbox" checked={form.role_ids.includes(role.id)} onChange={() => toggleRole(role.id)} className="h-4 w-4 rounded border-slate-300" />{role.name}</label>)}</div>}</fieldset>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button><Button type="submit" isLoading={isSaving} disabled={roleOptionsError}>Simpan</Button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={deleteTarget !== null} title="Hapus pengguna" message={`Hapus ${deleteTarget?.name ?? 'pengguna'}? Pengguna dengan riwayat bisnis harus dinonaktifkan dan tidak dapat dihapus.`} onClose={() => setDeleteTarget(null)} onConfirm={remove} isLoading={deleteUser.isPending} />
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
