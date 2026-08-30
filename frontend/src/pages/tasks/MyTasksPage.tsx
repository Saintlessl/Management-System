import { useEffect, useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Table, TableWrap, TBody, Td, Th, THead, Tr, CellStack } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMyTasks } from '@/hooks/useTasks';
import { cn, formatDate } from '@/utils';
import type { TaskPriority, TaskStatus } from '@/types';

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

const deadlineOptions = [
  { value: 'overdue', label: 'Terlambat' },
  { value: 'next_7_days', label: '7 hari ke depan' },
  { value: 'none', label: 'Tanpa deadline' },
];

export function MyTasksPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput);
  const page = Number(params.get('page') ?? 1);
  const status = (params.get('status') as TaskStatus | null) ?? undefined;
  const priority = (params.get('priority') as TaskPriority | null) ?? undefined;
  const deadline = (params.get('deadline') as 'overdue' | 'next_7_days' | 'none' | null) ?? undefined;

  const tasksQuery = useMyTasks({
    search: debouncedSearch || undefined,
    status,
    priority,
    deadline,
    page,
    per_page: 20,
  });

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

  const clearFilters = () => {
    setSearchInput('');
    setParams(new URLSearchParams());
  };

  const hasFilters = Boolean(search || status || priority || deadline);
  const tasks = tasksQuery.data?.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tugas Saya"
        description="Seluruh tugas yang ditugaskan kepada Anda dari berbagai proyek."
      />

      <FilterBar
        search={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: 'Cari tugas atau proyek...',
          label: 'Cari tugas saya',
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
        <FilterSelect
          value={priority ?? ''}
          onChange={(value) => updateParam('priority', value)}
          options={priorityOptions}
          placeholder="Semua prioritas"
          label="Filter prioritas"
        />
        <FilterSelect
          value={deadline ?? ''}
          onChange={(value) => updateParam('deadline', value)}
          options={deadlineOptions}
          placeholder="Semua deadline"
          label="Filter deadline"
        />
      </FilterBar>

      {tasksQuery.isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : tasksQuery.isError ? (
        <ErrorState
          title="Gagal memuat tugas saya"
          message="Tidak dapat memuat tugas yang ditugaskan kepada Anda."
          onRetry={() => tasksQuery.refetch()}
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={hasFilters ? 'Tidak ada tugas yang cocok' : 'Belum ada tugas untuk Anda'}
          description={
            hasFilters
              ? 'Ubah kata kunci atau filter untuk melihat tugas lain.'
              : 'Saat ada tugas yang ditugaskan kepada Anda, tugas tersebut akan muncul di sini.'
          }
          actionLabel={hasFilters ? 'Reset filter' : undefined}
          onAction={hasFilters ? clearFilters : undefined}
        />
      ) : (
        <TableWrap
          footer={
            tasksQuery.data?.meta && (
              <Pagination
                currentPage={page}
                totalPages={tasksQuery.data.meta.last_page}
                total={tasksQuery.data.meta.total}
                from={tasksQuery.data.meta.from}
                to={tasksQuery.data.meta.to}
                onPageChange={(next) => updateParam('page', String(next))}
              />
            )
          }
        >
          <Table minWidth="min-w-[58rem]">
            <THead>
              <Tr>
                <Th className="w-[36%]">Tugas</Th>
                <Th>Proyek</Th>
                <Th>Status</Th>
                <Th>Prioritas</Th>
                <Th align="right">Deadline</Th>
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
                    {task.project ? (
                      <Link
                        to={`/projects/${task.project.id}`}
                        className="text-[13px] text-foreground-muted hover:text-primary hover:underline"
                      >
                        {task.project.name}
                      </Link>
                    ) : (
                      <span className="text-foreground-muted/80">—</span>
                    )}
                  </Td>
                  <Td><StatusBadge status={task.status} /></Td>
                  <Td><PriorityBadge priority={task.priority} /></Td>
                  <Td align="right">
                    <span
                      className={cn(
                        'whitespace-nowrap text-[13px]',
                        task.is_overdue ? 'font-medium text-danger' : 'text-foreground-muted'
                      )}
                    >
                      {task.deadline ? formatDate(task.deadline) : '—'}
                    </span>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      )}
    </div>
  );
}
