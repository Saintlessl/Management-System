import { useState } from 'react';
import { CheckCircle2, Pencil, Send, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Panel, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Progress } from '@/components/ui/Progress';
import { UserCell } from '@/components/ui/Avatar';
import { ProjectWorkspaceHeader } from '@/components/projects/ProjectWorkspaceHeader';
import { useAuth } from '@/hooks/useAuth';
import { useProject, useProjectCompletionApprovals, useProjectMutations } from '@/hooks/useProjects';
import { useTeams } from '@/hooks/useTeams';
import { formatDate } from '@/utils';
import type { ProjectStatus, TaskPriority } from '@/types';

const statusOptions = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Urgent' },
];

export function ProjectDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { data, isLoading, isError, refetch } = useProject(id);
  const completionApprovals = useProjectCompletionApprovals(id);
  const { data: teamsData } = useTeams();
  const { updateProject, deleteProject, submitCompletion, approveCompletion: approveCompletionMutation, requestCompletionRevision } = useProjectMutations();
  const project = data?.data;

  const [edit, setEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'planning' as ProjectStatus,
    priority: 'medium' as TaskPriority,
    start_date: '',
    deadline: '',
    team_id: null as number | null,
  });

  const openEdit = () => {
    if (!project) return;
    setForm({
      name: project.name,
      description: project.description ?? '',
      status: project.status,
      priority: project.priority,
      start_date: project.start_date ?? '',
      deadline: project.deadline ?? '',
      team_id: project.team_id,
    });
    setEdit(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updateProject.mutateAsync({
        id,
        payload: {
          ...form,
          start_date: form.start_date || null,
          deadline: form.deadline || null,
        },
      });
      setEdit(false);
      toast.success('Proyek berhasil diperbarui.');
    } catch {
      toast.error('Proyek gagal diperbarui.');
    }
  };

  const remove = async () => {
    try {
      await deleteProject.mutateAsync(id);
      navigate('/projects');
      toast.success('Proyek berhasil dihapus.');
    } catch {
      toast.error('Proyek gagal dihapus.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-full max-w-lg" />
        <div className="grid gap-5 lg:grid-cols-12">
          <Skeleton className="h-52 rounded-xl lg:col-span-8" />
          <Skeleton className="h-52 rounded-xl lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <ErrorState
        title="Proyek tidak ditemukan"
        message="Proyek tidak tersedia atau Anda tidak memiliki akses ke proyek ini."
        onRetry={() => refetch()}
      />
    );
  }

  const canUpdate = hasPermission('project.update');
  const canDelete = hasPermission('project.delete');
  const canSubmitCompletion = hasPermission('project.submit_completion');
  const canApproveCompletion = hasPermission('project.approve_completion');
  const progress = project.progress ?? 0;
  const latestCompletionApproval = completionApprovals.data?.data[0];

  const submitForCompletion = async () => {
    try {
      await submitCompletion.mutateAsync({ id });
      toast.success('Proyek diajukan untuk persetujuan.');
    } catch {
      toast.error('Proyek belum dapat diajukan. Pastikan seluruh task telah selesai.');
    }
  };

  const approveCompletion = async () => {
    try {
      await approveCompletionMutation.mutateAsync({ id });
      toast.success('Proyek disetujui dan ditandai selesai.');
    } catch {
      toast.error('Persetujuan proyek gagal diproses.');
    }
  };

  const requestRevision = async () => {
    const comment = window.prompt('Masukkan catatan revisi untuk tim.');
    if (!comment?.trim()) return;
    try {
      await requestCompletionRevision.mutateAsync({ id, comment });
      toast.success('Permintaan revisi dikirim.');
    } catch {
      toast.error('Permintaan revisi gagal diproses.');
    }
  };

  return (
    <div className="space-y-5">
      <ProjectWorkspaceHeader
        project={project}
        actions={
          (canUpdate || canDelete || canSubmitCompletion || canApproveCompletion) && (
            <>
              {project.status !== 'completed' && !latestCompletionApproval && canSubmitCompletion && (
                <Button variant="outline" size="sm" onClick={submitForCompletion} isLoading={submitCompletion.isPending}>
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  Ajukan selesai
                </Button>
              )}
              {latestCompletionApproval?.status === 'pending' && canApproveCompletion && (
                <>
                  <Button size="sm" onClick={approveCompletion} isLoading={approveCompletionMutation.isPending}>
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Setujui selesai
                  </Button>
                  <Button variant="outline" size="sm" onClick={requestRevision} isLoading={requestCompletionRevision.isPending}>
                    Minta revisi
                  </Button>
                </>
              )}
              {canUpdate && (
                <Button variant="outline" size="sm" onClick={openEdit}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Dropdown label="Aksi proyek lainnya">
                  <DropdownItem
                    onClick={() => setConfirmDelete(true)}
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    tone="danger"
                  >
                    Hapus proyek
                  </DropdownItem>
                </Dropdown>
              )}
            </>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-12">
        <Panel className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Progres penyelesaian</CardTitle>
            <CardDescription>Dihitung dari tugas yang telah berstatus Done.</CardDescription>
          </CardHeader>

          <div className="mt-4 flex items-center gap-3">
            <Progress value={progress} size="md" label="Progres proyek" />
            <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
              {progress}%
            </span>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-4 sm:grid-cols-4">
            <Metric label="Total tugas" value={String(project.tasks_count ?? 0)} />
            <Metric label="Anggota" value={String(project.members_count ?? 0)} />
            <Metric label="Mulai" value={project.start_date ? formatDate(project.start_date) : '—'} />
            <Metric
              label="Deadline"
              value={project.deadline ? formatDate(project.deadline) : '—'}
              tone={project.is_overdue ? 'danger' : 'default'}
            />
          </dl>
        </Panel>

        <Panel className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Detail</CardTitle>
          </CardHeader>

          <dl className="mt-3 divide-y divide-border border-t border-border">
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-[13px] text-foreground-muted">Prioritas</dt>
              <dd><PriorityBadge priority={project.priority} /></dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-[13px] text-foreground-muted">Tim</dt>
              <dd className="text-[13px] text-foreground">{project.team?.name ?? 'Tidak terkait tim'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-[13px] text-foreground-muted">Penyelesaian</dt>
              <dd>{latestCompletionApproval ? <StatusBadge status={latestCompletionApproval.status} /> : <span className="text-[13px] text-foreground-muted/80">Belum diajukan</span>}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-[13px] text-foreground-muted">Project manager</dt>
              <dd className="min-w-0 text-[13px]">
                {project.manager ? (
                  <UserCell name={project.manager.name} size="xs" />
                ) : (
                  <span className="text-foreground-muted/80">Belum ditentukan</span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-[13px] text-foreground-muted">Dibuat oleh</dt>
              <dd className="min-w-0 text-[13px]">
                {project.creator ? (
                  <UserCell name={project.creator.name} size="xs" />
                ) : (
                  <span className="text-foreground-muted/80">—</span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-[13px] text-foreground-muted">Dibuat</dt>
              <dd className="text-[13px] text-foreground">{formatDate(project.created_at)}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Modal
        isOpen={edit}
        onClose={() => setEdit(false)}
        title="Edit proyek"
        size="lg"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setEdit(false)}>
              Batal
            </Button>
            <Button type="submit" form="edit-project" size="sm" isLoading={updateProject.isPending}>
              Simpan perubahan
            </Button>
          </>
        }
      >
        <form id="edit-project" onSubmit={save} className="space-y-4">
          <Input
            id="edit-project-name"
            label="Nama proyek"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <Textarea
            id="edit-project-desc"
            label="Deskripsi"
            rows={3}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="edit-project-status"
              label="Status"
              options={statusOptions}
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as ProjectStatus })}
            />
            <Select
              id="edit-project-priority"
              label="Prioritas"
              options={priorityOptions}
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}
            />
            <Select
              id="edit-project-team"
              label="Tim"
              options={(teamsData?.data ?? []).map((team) => ({ value: String(team.id), label: team.name }))}
              placeholder="Tidak terkait tim"
              value={form.team_id ?? ''}
              onChange={(event) => setForm({ ...form, team_id: event.target.value ? Number(event.target.value) : null })}
            />
            <div className="hidden sm:block" />
            <Input
              id="edit-project-start"
              type="date"
              label="Tanggal mulai"
              value={form.start_date}
              onChange={(event) => setForm({ ...form, start_date: event.target.value })}
            />
            <Input
              id="edit-project-deadline"
              type="date"
              label="Deadline"
              value={form.deadline}
              onChange={(event) => setForm({ ...form, deadline: event.target.value })}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Hapus proyek"
        message="Seluruh tugas, label, dan riwayat di dalam proyek ini akan dihapus permanen."
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        isLoading={deleteProject.isPending}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-wide text-foreground-muted uppercase">{label}</dt>
      <dd
        className={`mt-1 text-sm font-medium ${
          tone === 'danger' ? 'text-danger' : 'text-foreground'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
