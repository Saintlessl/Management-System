import { useEffect, useState } from 'react';
import axios from 'axios';
import { FolderKanban, LayoutGrid, Plus, Rows3 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CardGridSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import { Progress } from '@/components/ui/Progress';
import { UserCell } from '@/components/ui/Avatar';
import {
  Table,
  TableWrap,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  CellStack,
} from '@/components/ui/Table';
import { useAuth } from '@/hooks/useAuth';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useProjectMutations, useProjects, useProjectUserOptions } from '@/hooks/useProjects';
import { useTeams } from '@/hooks/useTeams';
import { cn, formatDate } from '@/utils';
import type { ProjectStatus, TaskPriority } from '@/types';
import type { ProjectPayload } from '@/api/projects';

const emptyForm: ProjectPayload = {
  name: '',
  description: '',
  status: 'planning',
  start_date: '',
  deadline: '',
  project_manager_id: null,
  team_id: null,
  priority: 'medium',
};

const statusOptions = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Urgent' },
];

export function ProjectsPage() {
  const { hasPermission } = useAuth();
  const [params, setParams] = useSearchParams();
  const canCreate = hasPermission('project.create');

  // The topbar "Proyek baru" action deep-links here with ?new=1. Keeping
  // query-driven and local state separate also works when already on this route.
  const [isCreateOpen, setCreateOpen] = useState(false);
  const isOpen = isCreateOpen || (canCreate && params.get('new') === '1');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [form, setForm] = useState<ProjectPayload>(emptyForm);

  const search = params.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput);
  const status = (params.get('status') as ProjectStatus | null) ?? undefined;
  const page = Number(params.get('page') ?? 1);

  const { data, isLoading, isError, refetch } = useProjects({
    search: debouncedSearch || undefined,
    status,
    page,
    per_page: 15,
  });
  const { data: userOptions } = useProjectUserOptions(canCreate);
  const { data: teamsData } = useTeams(canCreate);
  const { createProject } = useProjectMutations();

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    if (debouncedSearch === search) return;
    const next = new URLSearchParams(params);
    if (debouncedSearch) next.set('search', debouncedSearch);
    else next.delete('search');
    next.delete('page');
    setParams(next);
  }, [debouncedSearch, search, params, setParams]);

  const closeModal = () => {
    setCreateOpen(false);
    if (params.get('new')) {
      const next = new URLSearchParams(params);
      next.delete('new');
      setParams(next, { replace: true });
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    const next = new URLSearchParams(params);
    next.delete('search');
    next.delete('status');
    next.delete('page');
    setParams(next);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createProject.mutateAsync({
        ...form,
        start_date: form.start_date || null,
        deadline: form.deadline || null,
      });
      toast.success('Proyek berhasil dibuat.');
      closeModal();
      setForm(emptyForm);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const projects = data?.data ?? [];
  const hasFilters = Boolean(searchInput || status);

  return (
    <div className="space-y-4">
      <PageHeader title="Projects" description="Kelola proyek aktif dan arsip tim Anda.">
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Proyek baru
          </Button>
        )}
      </PageHeader>

      <FilterBar
        search={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: 'Cari proyek...',
          label: 'Cari proyek',
        }}
        onClear={hasFilters ? clearFilters : undefined}
      >
        <FilterSelect
          value={status ?? ''}
          onChange={(value) => updateParam('status', value)}
          options={statusOptions}
          placeholder="Semua status"
          label="Filter status"
        />
        <div
          className="flex items-center gap-0.5 rounded-lg border border-border p-0.5"
          role="group"
          aria-label="Mode tampilan"
        >
          <ViewToggle
            active={viewMode === 'table'}
            onClick={() => setViewMode('table')}
            label="Tampilan tabel"
            icon={Rows3}
          />
          <ViewToggle
            active={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
            label="Tampilan kartu"
            icon={LayoutGrid}
          />
        </div>
      </FilterBar>

      {isLoading ? (
        viewMode === 'table' ? (
          <TableSkeleton rows={8} cols={6} />
        ) : (
          <CardGridSkeleton count={8} />
        )
      ) : isError ? (
        <ErrorState
          title="Gagal memuat proyek"
          message="Tidak dapat memuat daftar proyek dari server."
          onRetry={() => refetch()}
        />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={hasFilters ? 'Tidak ada proyek yang cocok' : 'Belum ada proyek'}
          description={
            hasFilters
              ? 'Ubah kata kunci atau filter status untuk melihat proyek lain.'
              : 'Buat proyek untuk mulai mengorganisir pekerjaan tim.'
          }
          actionLabel={hasFilters ? 'Reset filter' : canCreate ? 'Buat proyek' : undefined}
          onAction={hasFilters ? clearFilters : canCreate ? () => setCreateOpen(true) : undefined}
          actionIcon={hasFilters ? undefined : Plus}
        />
      ) : viewMode === 'table' ? (
        <TableWrap
          footer={
            data?.meta && (
              <Pagination
                currentPage={page}
                totalPages={data.meta.last_page}
                total={data.meta.total}
                from={data.meta.from}
                to={data.meta.to}
                onPageChange={(next) => updateParam('page', String(next))}
              />
            )
          }
        >
          <Table minWidth="min-w-[60rem]">
            <THead>
              <Tr>
                <Th className="w-[32%]">Proyek</Th>
                <Th>Manager</Th>
                <Th>Status</Th>
                <Th className="w-40">Progres</Th>
                <Th align="center">Tugas</Th>
                <Th>Deadline</Th>
              </Tr>
            </THead>
            <TBody>
              {projects.map((project) => (
                <Tr key={project.id} interactive>
                  <Td>
                    <CellStack
                      title={
                        <Link
                          to={`/projects/${project.id}`}
                          className="rounded font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {project.name}
                        </Link>
                      }
                      subtitle={project.description || undefined}
                    />
                  </Td>
                  <Td>
                    {project.manager ? (
                      <UserCell name={project.manager.name} size="xs" />
                    ) : (
                      <span className="text-foreground-muted/80">Belum ditentukan</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={project.status} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={project.progress ?? 0}
                        label={`Progres ${project.name}`}
                        className="w-20"
                      />
                      <span className="text-xs font-medium text-foreground-muted tabular-nums">
                        {project.progress ?? 0}%
                      </span>
                    </div>
                  </Td>
                  <Td align="center" className="tabular-nums">
                    {project.tasks_count ?? 0}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className={project.deadline ? 'text-foreground' : 'text-foreground-muted/80'}>
                        {project.deadline ? formatDate(project.deadline) : '—'}
                      </span>
                      {project.is_overdue && <Badge tone="danger">Terlambat</Badge>}
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex flex-col rounded-xl border border-border bg-surface p-4 transition-colors duration-150 ease-out hover:border-primary-border hover:bg-input/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {project.name}
                  </h2>
                  <StatusBadge status={project.status} />
                </div>

                <p className="mt-1.5 line-clamp-2 min-h-8 text-xs text-foreground-muted">
                  {project.description || 'Tanpa deskripsi.'}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <Progress value={project.progress ?? 0} label={`Progres ${project.name}`} />
                  <span className="shrink-0 text-xs font-medium text-foreground-muted tabular-nums">
                    {project.progress ?? 0}%
                  </span>
                </div>

                <dl className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-foreground-muted">
                  <div className="flex items-center gap-1">
                    <dt>Tugas</dt>
                    <dd className="font-medium text-foreground tabular-nums">
                      {project.tasks_count ?? 0}
                    </dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <dt className="sr-only">Deadline</dt>
                    <dd className={project.is_overdue ? 'font-medium text-danger' : ''}>
                      {project.deadline ? formatDate(project.deadline) : 'Tanpa deadline'}
                    </dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>

          {data?.meta && (
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <Pagination
                currentPage={page}
                totalPages={data.meta.last_page}
                total={data.meta.total}
                from={data.meta.from}
                to={data.meta.to}
                onPageChange={(next) => updateParam('page', String(next))}
                className="border-t-0"
              />
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title="Proyek baru"
        description="Isi informasi dasar proyek. Anggota dan tugas dapat ditambahkan setelahnya."
        size="lg"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={closeModal}>
              Batal
            </Button>
            <Button type="submit" form="create-project" size="sm" isLoading={createProject.isPending}>
              Simpan proyek
            </Button>
          </>
        }
      >
        <form id="create-project" onSubmit={submit} className="space-y-4">
          <Input
            id="project-name"
            label="Nama proyek"
            placeholder="misal: Migrasi Portal Internal"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <Textarea
            id="project-desc"
            label="Deskripsi"
            rows={3}
            hint="Ringkasan singkat ruang lingkup proyek."
            value={form.description ?? ''}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="project-start"
              label="Tanggal mulai"
              type="date"
              value={form.start_date ?? ''}
              onChange={(event) => setForm({ ...form, start_date: event.target.value })}
            />
            <Input
              id="project-deadline"
              label="Deadline"
              type="date"
              value={form.deadline ?? ''}
              onChange={(event) => setForm({ ...form, deadline: event.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="project-status"
              label="Status"
              options={statusOptions.filter((option) => option.value !== 'completed')}
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as ProjectStatus })}
            />
            <Select
              id="project-priority"
              label="Prioritas"
              options={priorityOptions}
              value={form.priority ?? 'medium'}
              onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}
            />
            <Select
              id="project-manager"
              label="Project manager"
              options={(userOptions?.data ?? []).map((user) => ({
                value: String(user.id),
                label: user.name,
              }))}
              placeholder="Belum ditentukan"
              value={form.project_manager_id ?? ''}
              onChange={(event) =>
                setForm({
                  ...form,
                  project_manager_id: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
            <Select
              id="project-team"
              label="Tim"
              options={(teamsData?.data ?? []).map((team) => ({ value: String(team.id), label: team.name }))}
              placeholder="Tidak terkait tim"
              value={form.team_id ?? ''}
              onChange={(event) => setForm({ ...form, team_id: event.target.value ? Number(event.target.value) : null })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150 ease-out',
        active ? 'bg-surface-muted text-foreground' : 'text-foreground-muted/80 hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined;
    return (
      error.response?.data?.message ??
      (errors ? Object.values(errors)[0]?.[0] : undefined) ??
      'Terjadi kesalahan saat membuat proyek.'
    );
  }
  return 'Terjadi kesalahan saat membuat proyek.';
}
