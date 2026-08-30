import { useState } from 'react';
import axios from 'axios';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { UserCell } from '@/components/ui/Avatar';
import { FilterBar } from '@/components/ui/FilterBar';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { Table, TableWrap, TBody, Td, Th, THead, Tr } from '@/components/ui/Table';
import { useAuth } from '@/hooks/useAuth';
import { useRoleOptions } from '@/hooks/useRoles';
import { useUserMutations, useUsers } from '@/hooks/useUsers';
import { formatDate } from '@/utils';
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
  const usersQuery = useUsers({ search: search || undefined, page, per_page: 15 });
  const rolesQuery = useRoleOptions(canEditUsers);
  const { createUser, updateUser, deleteUser } = useUserMutations();

  const roles = rolesQuery.data?.data ?? [];
  const users = usersQuery.data?.data ?? [];
  const isSaving = createUser.isPending || updateUser.isPending;

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
    <div className="space-y-4">
      <PageHeader title="Pengguna" description="Kelola akun, role, dan status akses pengguna.">
        {hasPermission('users.create') && (
          <Button onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Tambah pengguna
          </Button>
        )}
      </PageHeader>

      <FilterBar
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: 'Cari nama atau email...',
          label: 'Cari pengguna',
        }}
        onClear={search ? () => setSearch('') : undefined}
      />

      {usersQuery.isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : usersQuery.isError ? (
        <ErrorState
          title="Gagal memuat pengguna"
          message="Tidak dapat memuat daftar pengguna dari server."
          onRetry={() => usersQuery.refetch()}
        />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'Tidak ada pengguna yang cocok' : 'Belum ada pengguna'}
          description={search ? 'Ubah kata kunci pencarian.' : 'Tambahkan akun untuk anggota tim.'}
          actionLabel={search ? 'Reset pencarian' : hasPermission('users.create') ? 'Tambah pengguna' : undefined}
          onAction={search ? () => setSearch('') : hasPermission('users.create') ? openCreate : undefined}
          actionIcon={search ? undefined : Plus}
        />
      ) : (
        <TableWrap
          footer={
            usersQuery.data?.meta && (
              <Pagination
                currentPage={page}
                totalPages={usersQuery.data.meta.last_page}
                total={usersQuery.data.meta.total}
                from={usersQuery.data.meta.from}
                to={usersQuery.data.meta.to}
                onPageChange={setPage}
              />
            )
          }
        >
          <Table minWidth="min-w-[52rem]">
            <THead>
              <Tr>
                <Th className="w-[36%]">Pengguna</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Bergabung</Th>
                <Th align="right">Aksi</Th>
              </Tr>
            </THead>
            <TBody>
              {users.map((user) => {
                const canDelete = hasPermission('users.delete') && currentUser?.id !== user.id;
                const canEdit = hasPermission('users.update');
                return (
                  <Tr key={user.id} interactive>
                    <Td>
                      <UserCell name={user.name} secondary={user.email} size="sm" />
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles?.length ? (
                          user.roles.map((role) => <Badge key={role.id}>{role.name}</Badge>)
                        ) : (
                          <span className="text-foreground-muted/80">—</span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={user.is_active ? 'success' : 'neutral'} dot>
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-[13px] text-foreground-muted">
                      {formatDate(user.created_at)}
                    </Td>
                    <Td align="right">
                      {(canEdit || canDelete) && (
                        <Dropdown label={`Aksi untuk ${user.name}`}>
                          {canEdit && (
                            <DropdownItem
                              onClick={() => openEdit(user)}
                              icon={<Pencil className="h-3.5 w-3.5" />}
                            >
                              Edit pengguna
                            </DropdownItem>
                          )}
                          {canEdit && canDelete && <DropdownSeparator />}
                          {canDelete && (
                            <DropdownItem
                              onClick={() => setDeleteTarget(user)}
                              icon={<Trash2 className="h-3.5 w-3.5" />}
                              tone="danger"
                            >
                              Hapus pengguna
                            </DropdownItem>
                          )}
                        </Dropdown>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </TableWrap>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingUser ? 'Edit pengguna' : 'Tambah pengguna'}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              form="user-form"
              size="sm"
              isLoading={isSaving}
              disabled={rolesQuery.isError}
            >
              Simpan pengguna
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="user-name"
              label="Nama lengkap"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
            <Input
              id="user-email"
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
            <Input
              id="user-password"
              label={editingUser ? 'Password baru' : 'Password'}
              hint={editingUser ? 'Biarkan kosong untuk mempertahankan password.' : undefined}
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required={!editingUser}
            />
            <Input
              id="user-password-confirmation"
              label="Konfirmasi password"
              type="password"
              value={form.password_confirmation}
              onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })}
              required={!editingUser || Boolean(form.password)}
            />
          </div>

          <label className="flex items-center gap-2.5 text-[13px] font-medium text-foreground">
            <input
              type="checkbox"
              checked={form.is_active}
              disabled={editingUser?.id === currentUser?.id}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              className="h-4 w-4 rounded border-border text-primary"
            />
            Akun aktif
          </label>

          <fieldset className="border-t border-border pt-4">
            <legend className="text-[13px] font-medium text-foreground">Role</legend>
            {rolesQuery.isError ? (
              <p className="mt-2 text-xs text-danger">Pilihan role gagal dimuat.</p>
            ) : (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-2.5 text-[13px] transition-colors hover:bg-input"
                  >
                    <input
                      type="checkbox"
                      checked={form.role_ids.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-foreground">{role.name}</span>
                      <code className="text-[11px] text-foreground-muted/80">{role.slug}</code>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hapus pengguna"
        message={`Hapus akun “${deleteTarget?.name}”? Pengguna dengan riwayat kerja sebaiknya dinonaktifkan.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        isLoading={deleteUser.isPending}
      />
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const validationErrors = error.response?.data?.errors as Record<string, string[]> | undefined;
    return validationErrors
      ? Object.values(validationErrors)[0]?.[0] ?? 'Data pengguna tidak valid.'
      : error.response?.data?.message ?? 'Pengguna gagal diproses.';
  }
  return 'Pengguna gagal diproses.';
}
