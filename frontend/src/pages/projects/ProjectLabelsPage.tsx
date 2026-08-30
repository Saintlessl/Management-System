import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tags, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectsApi } from '@/api/projects';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { Table, TableWrap, TBody, Td, Th, THead, Tr } from '@/components/ui/Table';
import { ProjectWorkspaceHeader } from '@/components/projects/ProjectWorkspaceHeader';
import { useAuth } from '@/hooks/useAuth';
import { useProject, useProjectLabels } from '@/hooks/useProjects';
import type { Label } from '@/types';

export function ProjectLabelsPage() {
  const id = Number(useParams().id);
  const { hasPermission } = useAuth();
  const client = useQueryClient();
  const projectQuery = useProject(id);
  const labelsQuery = useProjectLabels(id);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Label | null>(null);
  const [form, setForm] = useState({ name: '', color: '#2563eb' });
  const canUpdate = hasPermission('project.update');

  const invalidate = () => client.invalidateQueries({ queryKey: ['projects', id, 'labels'] });

  const create = useMutation({
    mutationFn: () => projectsApi.createLabel(id, form),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setForm({ name: '', color: '#2563eb' });
      toast.success('Label berhasil dibuat.');
    },
    onError: () => toast.error('Label gagal dibuat.'),
  });

  const remove = useMutation({
    mutationFn: projectsApi.removeLabel,
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success('Label berhasil dihapus.');
    },
    onError: () => toast.error('Label gagal dihapus.'),
  });

  if (projectQuery.isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  const project = projectQuery.data?.data;
  if (projectQuery.isError || !project) {
    return (
      <ErrorState
        title="Proyek tidak ditemukan"
        message="Tidak dapat memuat konteks proyek ini."
        onRetry={() => projectQuery.refetch()}
      />
    );
  }

  const labels = labelsQuery.data?.data ?? [];

  return (
    <div className="space-y-5">
      <ProjectWorkspaceHeader
        project={project}
        actions={
          canUpdate && (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Tambah label
            </Button>
          )
        }
      />

      {labelsQuery.isLoading ? (
        <TableSkeleton rows={5} cols={3} />
      ) : labelsQuery.isError ? (
        <ErrorState
          title="Gagal memuat label"
          message="Tidak dapat memuat label proyek."
          onRetry={() => labelsQuery.refetch()}
        />
      ) : labels.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Belum ada label"
          description="Label membantu tim mengelompokkan dan memfilter tugas."
          actionLabel={canUpdate ? 'Tambah label' : undefined}
          onAction={canUpdate ? () => setOpen(true) : undefined}
          actionIcon={Plus}
        />
      ) : (
        <TableWrap>
          <Table minWidth="min-w-[34rem]">
            <THead>
              <Tr>
                <Th className="w-[45%]">Label</Th>
                <Th>Nilai warna</Th>
                <Th align="right">Aksi</Th>
              </Tr>
            </THead>
            <TBody>
              {labels.map((label) => (
                <Tr key={label.id} interactive>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm border border-black/10"
                        style={{ backgroundColor: label.color }}
                        aria-hidden="true"
                      />
                      <span className="font-medium text-foreground">{label.name}</span>
                    </span>
                  </Td>
                  <Td>
                    <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-foreground-muted">
                      {label.color}
                    </code>
                  </Td>
                  <Td align="right">
                    {canUpdate && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-foreground-muted/80 hover:text-danger"
                        onClick={() => setDeleteTarget(label)}
                        aria-label={`Hapus label ${label.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      )}

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Tambah label"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="create-label" size="sm" isLoading={create.isPending}>
              Simpan label
            </Button>
          </>
        }
      >
        <form
          id="create-label"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
          className="space-y-4"
        >
          <Input
            id="label-name"
            label="Nama label"
            placeholder="misal: Bug, Frontend, Blocked"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <div>
            <label htmlFor="label-color" className="mb-1.5 block text-[13px] font-medium text-foreground">
              Warna
            </label>
            <div className="flex items-center gap-3">
              <input
                id="label-color"
                type="color"
                value={form.color}
                onChange={(event) => setForm({ ...form, color: event.target.value })}
                className="h-9.5 w-14 cursor-pointer rounded-lg border border-border bg-surface p-1"
              />
              <code className="text-xs text-foreground-muted">{form.color}</code>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hapus label"
        message={`Hapus label “${deleteTarget?.name}”? Label akan dilepas dari seluruh tugas yang menggunakannya.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) remove.mutate(deleteTarget.id);
        }}
        isLoading={remove.isPending}
      />
    </div>
  );
}
