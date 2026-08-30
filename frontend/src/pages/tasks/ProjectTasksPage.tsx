import { useState } from 'react';
import axios from 'axios';
import { CheckSquare, Plus } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { UserCell } from '@/components/ui/Avatar';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import { Table, TableWrap, TBody, Td, Th, THead, Tr, CellStack } from '@/components/ui/Table';
import { ProjectWorkspaceHeader } from '@/components/projects/ProjectWorkspaceHeader';
import { useAuth } from '@/hooks/useAuth';
import { useProject, useProjectLabels, useProjectMembers } from '@/hooks/useProjects';
import { useTaskMutations, useTasks } from '@/hooks/useTasks';
import { formatDate } from '@/utils';
import type { TaskFilters, TaskPriority, TaskStatus } from '@/types';
import type { TaskPayload } from '@/api/tasks';

const emptyForm: TaskPayload = {
  title: '',
  description: '',
  priority: 'medium',
  assignee_id: null,
  deadline: '',
};

const statusOptions = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export function ProjectTasksPage() {
  const projectId = Number(useParams().id);
  const { hasPermission } = useAuth();
  const [params, setParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<TaskPayload>(emptyForm);

  const projectQuery = useProject(projectId);
  const filters: TaskFilters = {
    search: params.get('search') || undefined,
    status: (params.get('status') as TaskStatus | null) ?? undefined,
    priority: (params.get('priority') as TaskPriority | null) ?? undefined,
    page: Number(params.get('page') ?? 1),
    per_page: 20,
  };

  const tasksQuery = useTasks(projectId, filters);
  const { data: members } = useProjectMembers(projectId);
  const { data: labels } = useProjectLabels(projectId);
  const { createTask } = useTaskMutations(projectId);
  const canCreate = hasPermission('task.create');

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams(params);
    next.delete('search');
    next.delete('status');
    next.delete('priority');
    next.delete('page');
    setParams(next);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createTask.mutateAsync({ ...form, deadline: form.deadline || null });
      toast.success('Tugas berhasil dibuat.');
      setIsOpen(false);
      setForm(emptyForm);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

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

  const tasks = tasksQuery.data?.data ?? [];
  const hasFilters = Boolean(filters.search || filters.status || filters.priority);

  return (
    <div className="space-y-4">
      <ProjectWorkspaceHeader
        project={project}
        actions={
          canCreate && (
            <Button size="sm" onClick={() => setIsOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Tugas baru
            </Button>
          )
        }
      />

      <FilterBar
        search={{
          value: filters.search ?? '',
          onChange: (value) => updateParam('search', value),
          placeholder: 'Cari tugas...',
          label: 'Cari tugas',
        }}
        onClear={hasFilters ? clearFilters : undefined}
      >
        <FilterSelect
          value={filters.status ?? ''}
          onChange={(value) => updateParam('status', value)}
          options={statusOptions}
          placeholder="Semua status"
          label="Filter status"
        />
        <FilterSelect
          value={filters.priority ?? ''}
          onChange={(value) => updateParam('priority', value)}
          options={priorityOptions}
          placeholder="Semua prioritas"
          label="Filter prioritas"
        />
      </FilterBar>

      {tasksQuery.isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : tasksQuery.isError ? (
        <ErrorState
          title="Gagal memuat tugas"
          message="Tidak dapat memuat daftar tugas proyek."
          onRetry={() => tasksQuery.refetch()}
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={hasFilters ? 'Tidak ada tugas yang cocok' : 'Belum ada tugas'}
          description={
            hasFilters
              ? 'Ubah kata kunci atau filter untuk melihat tugas lain.'
              : 'Buat tugas untuk mulai membagi pekerjaan proyek.'
          }
          actionLabel={hasFilters ? 'Reset filter' : canCreate ? 'Buat tugas' : undefined}
          onAction={hasFilters ? clearFilters : canCreate ? () => setIsOpen(true) : undefined}
          actionIcon={hasFilters ? undefined : Plus}
        />
      ) : (
        <TableWrap
          footer={
            tasksQuery.data?.meta && (
              <Pagination
                currentPage={filters.page ?? 1}
                totalPages={tasksQuery.data.meta.last_page}
                total={tasksQuery.data.meta.total}
                from={tasksQuery.data.meta.from}
                to={tasksQuery.data.meta.to}
                onPageChange={(page) => updateParam('page', String(page))}
              />
            )
          }
        >
          <Table minWidth="min-w-[58rem]">
            <THead>
              <Tr>
                <Th className="w-[38%]">Tugas</Th>
                <Th>Status</Th>
                <Th>Prioritas</Th>
                <Th>Assignee</Th>
                <Th>Deadline</Th>
              </Tr>
            </THead>
            <TBody>
              {tasks.map((task) => (
                <Tr key={task.id} interactive>
                  <Td>
                    <CellStack
                      title={
                        <Link
                          to={`/tasks/${task.id}`}
                          className="rounded font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {task.title}
                        </Link>
                      }
                      subtitle={task.description || undefined}
                    />
                  </Td>
                  <Td>
                    <StatusBadge status={task.status} />
                  </Td>
                  <Td>
                    <PriorityBadge priority={task.priority} />
                  </Td>
                  <Td>
                    <UserCell name={task.assignee?.name} size="xs" />
                  </Td>
                  <Td className="whitespace-nowrap text-[13px]">
                    <span className={task.is_overdue ? 'font-medium text-danger' : 'text-foreground-muted'}>
                      {task.deadline ? formatDate(task.deadline) : '—'}
                    </span>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Tugas baru"
        description="Tambahkan rincian kerja, assignee, dan hubungan tugas bila diperlukan."
        size="xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="create-task" size="sm" isLoading={createTask.isPending}>
              Simpan tugas
            </Button>
          </>
        }
      >
        <form id="create-task" onSubmit={submit} className="space-y-4">
          <Input
            id="task-title"
            label="Judul tugas"
            placeholder="Tulis hasil kerja yang diharapkan"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
          <Textarea
            id="task-description"
            label="Deskripsi"
            rows={4}
            hint="Jelaskan konteks, ruang lingkup, atau kriteria penerimaan."
            value={form.description ?? ''}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="task-priority"
              label="Prioritas"
              options={priorityOptions}
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}
            />
            <Select
              id="task-assignee"
              label="Assignee"
              options={(members?.data ?? []).map((member) => ({
                value: String(member.user_id),
                label: member.user?.name ?? `User #${member.user_id}`,
              }))}
              placeholder="Belum ditentukan"
              value={form.assignee_id ?? ''}
              onChange={(event) =>
                setForm({
                  ...form,
                  assignee_id: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
            <Select
              id="task-parent"
              label="Parent task"
              options={tasks.map((task) => ({ value: String(task.id), label: task.title }))}
              placeholder="Tidak ada"
              value={form.parent_task_id ?? ''}
              onChange={(event) =>
                setForm({
                  ...form,
                  parent_task_id: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
            <Select
              id="task-dependency"
              label="Dependency"
              options={tasks.map((task) => ({ value: String(task.id), label: task.title }))}
              placeholder="Tidak ada"
              value={form.dependency_ids?.[0] ?? ''}
              onChange={(event) =>
                setForm({
                  ...form,
                  dependency_ids: event.target.value ? [Number(event.target.value)] : [],
                })
              }
            />
          </div>

          {labels?.data && labels.data.length > 0 && (
            <fieldset>
              <legend className="text-[13px] font-medium text-foreground">Label</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {labels.data.map((label) => (
                  <label
                    key={label.id}
                    className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 text-xs text-foreground transition-colors hover:bg-input"
                  >
                    <input
                      type="checkbox"
                      checked={form.label_ids?.includes(label.id) ?? false}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          label_ids: event.target.checked
                            ? [...(form.label_ids ?? []), label.id]
                            : (form.label_ids ?? []).filter((id) => id !== label.id),
                        })
                      }
                      className="h-3.5 w-3.5 rounded border-border text-primary"
                    />
                    <span
                      className="h-2 w-2 rounded-sm"
                      style={{ backgroundColor: label.color }}
                      aria-hidden="true"
                    />
                    {label.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <Input
            id="task-deadline"
            label="Deadline"
            type="date"
            value={form.deadline ?? ''}
            onChange={(event) => setForm({ ...form, deadline: event.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? 'Tugas gagal disimpan.';
  }
  return 'Tugas gagal disimpan.';
}
