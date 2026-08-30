import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { rolesApi } from '@/api/roles';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/useRoles';
import type { Permission } from '@/types';

export function PermissionsPage() {
  const { hasPermission } = useAuth();
  const client = useQueryClient();
  const permissionsQuery = usePermissions();
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', group: '', description: '' });

  const create = useMutation({
    mutationFn: () => rolesApi.createPermission(form),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['permissions'] });
      setOpen(false);
      setForm({ name: '', slug: '', group: '', description: '' });
      toast.success('Permission berhasil dibuat.');
    },
    onError: () => toast.error('Permission gagal dibuat.'),
  });

  const remove = useMutation({
    mutationFn: rolesApi.deletePermission,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['permissions'] });
      setDeleteTarget(null);
      toast.success('Permission berhasil dihapus.');
    },
    onError: () => toast.error('Permission masih digunakan atau dilindungi sistem.'),
  });

  const grouped = (permissionsQuery.data?.data ?? []).reduce<
    Record<string, NonNullable<typeof permissionsQuery.data>['data']>
  >((result, item) => {
    const key = item.group ?? 'Lainnya';
    result[key] = [...(result[key] ?? []), item];
    return result;
  }, {});

  return (
    <div className="space-y-4">
      <PageHeader
        title="Permissions"
        description="Hak akses granular yang dapat disusun menjadi role."
      >
        {hasPermission('permissions.create') && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Tambah permission
          </Button>
        )}
      </PageHeader>

      {permissionsQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : permissionsQuery.isError ? (
        <ErrorState
          title="Gagal memuat permissions"
          message="Tidak dapat memuat daftar hak akses."
          onRetry={() => permissionsQuery.refetch()}
        />
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={Key}
          title="Belum ada permission"
          description="Tambahkan permission sebelum menyusunnya ke dalam role."
          actionLabel={hasPermission('permissions.create') ? 'Tambah permission' : undefined}
          onAction={hasPermission('permissions.create') ? () => setOpen(true) : undefined}
          actionIcon={Plus}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {Object.entries(grouped).map(([group, items], groupIndex) => (
            <section
              key={group}
              className={groupIndex > 0 ? 'border-t border-border' : undefined}
              aria-labelledby={`permission-${group}`}
            >
              <header className="flex items-center justify-between bg-input px-4 py-2.5">
                <h2
                  id={`permission-${group}`}
                  className="text-[11px] font-semibold tracking-wide text-foreground-muted uppercase"
                >
                  {group}
                </h2>
                <span className="text-xs text-foreground-muted/80 tabular-nums">{items.length}</span>
              </header>
              <ul className="divide-y divide-border">
                {items.map((permission) => (
                  <li key={permission.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground">{permission.name}</p>
                      <p className="mt-0.5 text-xs text-foreground-muted">
                        <code>{permission.slug}</code>
                        {permission.description ? ` — ${permission.description}` : ''}
                      </p>
                    </div>
                    {hasPermission('permissions.delete') && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-foreground-muted/80 hover:text-danger"
                        onClick={() => setDeleteTarget(permission)}
                        aria-label={`Hapus ${permission.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Tambah permission"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="permission-form" size="sm" isLoading={create.isPending}>
              Simpan permission
            </Button>
          </>
        }
      >
        <form
          id="permission-form"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
          className="space-y-4"
        >
          <Input
            id="permission-name"
            label="Nama permission"
            placeholder="misal: Buat Proyek"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <Input
            id="permission-slug"
            label="Slug unik"
            placeholder="project.create"
            value={form.slug}
            onChange={(event) => setForm({ ...form, slug: event.target.value })}
            required
          />
          <Input
            id="permission-group"
            label="Grup"
            placeholder="misal: Projects"
            value={form.group}
            onChange={(event) => setForm({ ...form, group: event.target.value })}
          />
          <Textarea
            id="permission-description"
            label="Deskripsi"
            rows={3}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hapus permission"
        message={`Hapus permission “${deleteTarget?.name}”? Pastikan permission ini tidak dibutuhkan oleh role lain.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) remove.mutate(deleteTarget.id);
        }}
        isLoading={remove.isPending}
      />
    </div>
  );
}
