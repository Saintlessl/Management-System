import { useMemo, useState } from 'react';
import axios from 'axios';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { Table, TableWrap, TBody, Td, Th, THead, Tr, CellStack } from '@/components/ui/Table';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions, useRoleMutations, useRoles } from '@/hooks/useRoles';
import type { Role } from '@/types';
import type { RolePayload } from '@/api/roles';

const emptyForm: RolePayload = { name: '', slug: '', description: '', permission_ids: [] };

export function RolesPage() {
  const { hasPermission } = useAuth();
  const rolesQuery = useRoles();
  const canMutate = hasPermission('roles.create') || hasPermission('roles.update');
  const permissionsQuery = usePermissions(canMutate);
  const { createRole, updateRole, deleteRole } = useRoleMutations();
  const [isOpen, setIsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form, setForm] = useState<RolePayload>(emptyForm);

  const roles = rolesQuery.data?.data ?? [];
  const isSaving = createRole.isPending || updateRole.isPending;
  const groupedPermissions = useMemo(() => {
    const permissions = permissionsQuery.data?.data ?? [];
    return permissions.reduce<Record<string, typeof permissions>>((groups, permission) => {
      const group = permission.group ?? 'Lainnya';
      groups[group] = [...(groups[group] ?? []), permission];
      return groups;
    }, {});
  }, [permissionsQuery.data?.data]);

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
    <div className="space-y-4">
      <PageHeader title="Roles" description="Kelompokkan permission dan tetapkan role kepada pengguna.">
        {hasPermission('roles.create') && (
          <Button onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Tambah role
          </Button>
        )}
      </PageHeader>

      {rolesQuery.isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : rolesQuery.isError ? (
        <ErrorState
          title="Gagal memuat role"
          message="Tidak dapat memuat daftar role dari server."
          onRetry={() => rolesQuery.refetch()}
        />
      ) : roles.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Belum ada role"
          description="Tambahkan role untuk mengelompokkan hak akses pengguna."
          actionLabel={hasPermission('roles.create') ? 'Tambah role' : undefined}
          onAction={hasPermission('roles.create') ? openCreate : undefined}
          actionIcon={Plus}
        />
      ) : (
        <TableWrap>
          <Table minWidth="min-w-[48rem]">
            <THead>
              <Tr>
                <Th className="w-[38%]">Role</Th>
                <Th>Slug</Th>
                <Th align="center">Pengguna</Th>
                <Th align="center">Permissions</Th>
                <Th align="right">Aksi</Th>
              </Tr>
            </THead>
            <TBody>
              {roles.map((role) => {
                const systemRole = role.slug === 'super-admin';
                const canEdit = hasPermission('roles.update') && !systemRole;
                const canDelete = hasPermission('roles.delete') && !systemRole;
                return (
                  <Tr key={role.id} interactive>
                    <Td>
                      <CellStack
                        title={
                          <span className="flex items-center gap-2">
                            {role.name}
                            {systemRole && <Badge tone="accent">Sistem</Badge>}
                          </span>
                        }
                        subtitle={role.description || undefined}
                      />
                    </Td>
                    <Td>
                      <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-foreground-muted">
                        {role.slug}
                      </code>
                    </Td>
                    <Td align="center" className="tabular-nums">
                      {role.users_count ?? 0}
                    </Td>
                    <Td align="center" className="tabular-nums">
                      {role.permissions?.length ?? 0}
                    </Td>
                    <Td align="right">
                      {(canEdit || canDelete) && (
                        <Dropdown label={`Aksi role ${role.name}`}>
                          {canEdit && (
                            <DropdownItem
                              onClick={() => openEdit(role)}
                              icon={<Pencil className="h-3.5 w-3.5" />}
                            >
                              Edit role
                            </DropdownItem>
                          )}
                          {canEdit && canDelete && <DropdownSeparator />}
                          {canDelete && (
                            <DropdownItem
                              onClick={() => setDeleteTarget(role)}
                              icon={<Trash2 className="h-3.5 w-3.5" />}
                              tone="danger"
                            >
                              Hapus role
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
        title={editingRole ? 'Edit role' : 'Tambah role'}
        size="xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              form="role-form"
              size="sm"
              isLoading={isSaving}
              disabled={permissionsQuery.isError}
            >
              Simpan role
            </Button>
          </>
        }
      >
        <form id="role-form" onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="role-name"
              label="Nama role"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
            <Input
              id="role-slug"
              label="Slug"
              placeholder="otomatis-dari-nama"
              value={form.slug ?? ''}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
            />
          </div>
          <Textarea
            id="role-description"
            label="Deskripsi"
            rows={3}
            value={form.description ?? ''}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />

          <fieldset className="border-t border-border pt-4">
            <legend className="text-[13px] font-medium text-foreground">Permissions</legend>
            {permissionsQuery.isError ? (
              <p className="mt-2 text-xs text-danger">Daftar permission gagal dimuat.</p>
            ) : (
              <div className="mt-3 max-h-80 space-y-4 overflow-y-auto pr-1">
                {Object.entries(groupedPermissions).map(([group, items]) => (
                  <section key={group} aria-labelledby={`permission-group-${group}`}>
                    <h3
                      id={`permission-group-${group}`}
                      className="mb-2 text-[11px] font-semibold tracking-wide text-foreground-muted uppercase"
                    >
                      {group}
                    </h3>
                    <div className="grid overflow-hidden rounded-lg border border-border sm:grid-cols-2">
                      {items.map((permission, index) => (
                        <label
                          key={permission.id}
                          className={`flex cursor-pointer items-start gap-2.5 p-3 text-[13px] transition-colors hover:bg-input ${
                            index > 0 ? 'border-t border-border sm:border-t-0' : ''
                          } ${index >= 2 ? 'sm:border-t sm:border-border' : ''} ${
                            index % 2 === 1 ? 'sm:border-l sm:border-border' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.permission_ids.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="mt-0.5 h-4 w-4 rounded border-border text-primary"
                          />
                          <span className="min-w-0">
                            <span className="block font-medium text-foreground">{permission.name}</span>
                            <code className="text-[11px] text-foreground-muted/80">{permission.slug}</code>
                          </span>
                        </label>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </fieldset>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hapus role"
        message={`Hapus role “${deleteTarget?.name}”?`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        isLoading={deleteRole.isPending}
      />
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const validationErrors = error.response?.data?.errors as Record<string, string[]> | undefined;
    return validationErrors
      ? Object.values(validationErrors)[0]?.[0] ?? 'Data role tidak valid.'
      : error.response?.data?.message ?? 'Role gagal diproses.';
  }
  return 'Role gagal diproses.';
}
