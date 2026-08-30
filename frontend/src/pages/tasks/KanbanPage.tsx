import { useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { PriorityBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProjectWorkspaceHeader } from '@/components/projects/ProjectWorkspaceHeader';
import { tasksApi } from '@/api/tasks';
import { useProject } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { getStatusDotClass as statusDotClass } from '@/utils/statusColors';
import { cn, formatDate } from '@/utils';
import type { Task, TaskStatus } from '@/types';

const columns: { status: TaskStatus; title: string }[] = [
  { status: 'backlog', title: 'Backlog' },
  { status: 'todo', title: 'To Do' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'review', title: 'Review' },
  { status: 'done', title: 'Done' },
];

export function KanbanPage() {
  const projectId = Number(useParams().id);
  const projectQuery = useProject(projectId);
  const tasksQuery = useTasks(projectId, {
    per_page: 100,
    sort: 'created_at',
    direction: 'asc',
  });
  const [optimistic, setOptimistic] = useState<Task[] | null>(null);
  const tasks = useMemo(
    () => optimistic ?? tasksQuery.data?.data ?? [],
    [optimistic, tasksQuery.data?.data]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const grouped = useMemo(
    () =>
      Object.fromEntries(
        columns.map((column) => [
          column.status,
          tasks
            .filter((task) => task.status === column.status)
            .sort((a, b) => a.position - b.position),
        ])
      ) as Record<TaskStatus, Task[]>,
    [tasks]
  );

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const task = tasks.find((item) => item.id === Number(active.id));
    const targetTask = tasks.find((item) => item.id === Number(over.id));
    const targetStatus = (targetTask?.status ?? over.id) as TaskStatus;

    if (!task || !columns.some((column) => column.status === targetStatus)) return;
    if (task.status === targetStatus && targetTask?.id === task.id) return;

    const snapshot = tasks;
    const position = targetTask
      ? grouped[targetStatus].findIndex((item) => item.id === targetTask.id) + 1
      : grouped[targetStatus].length + 1;

    setOptimistic(
      tasks.map((item) =>
        item.id === task.id ? { ...item, status: targetStatus, position } : item
      )
    );

    try {
      await tasksApi.move(task.id, { status: targetStatus, position, version: task.version });
      await tasksQuery.refetch();
      setOptimistic(null);
    } catch {
      setOptimistic(snapshot);
      toast.error('Tugas gagal dipindahkan. Papan dikembalikan ke kondisi sebelumnya.');
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

  return (
    <div className="space-y-4">
      <ProjectWorkspaceHeader project={project} />

      <p className="text-xs text-foreground-muted">
        Seret kartu ke kolom lain untuk memperbarui status. Gunakan tombol Tab dan panah untuk navigasi keyboard.
      </p>

      {tasksQuery.isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-96 w-74 shrink-0 rounded-xl" />
          ))}
        </div>
      ) : tasksQuery.isError ? (
        <ErrorState
          title="Gagal memuat Kanban"
          message="Tidak dapat memuat tugas untuk papan ini."
          onRetry={() => tasksQuery.refetch()}
        />
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="w-full overflow-x-auto pb-3">
            <div className="grid w-max grid-flow-col auto-cols-74 gap-4">
              {columns.map((column) => {
                const columnTasks = grouped[column.status] ?? [];
                return (
                  <section
                    key={column.status}
                    aria-labelledby={`column-${column.status}`}
                    className="flex min-h-80 flex-col rounded-xl border border-border bg-surface-muted/60"
                  >
                    <header className="flex h-11 items-center gap-2 border-b border-border px-3">
                      <span
                        className={cn('h-1.5 w-1.5 rounded-full', statusDotClass(column.status))}
                        aria-hidden="true"
                      />
                      <h2
                        id={`column-${column.status}`}
                        className="flex-1 text-[13px] font-semibold text-foreground"
                      >
                        {column.title}
                      </h2>
                      <span className="text-xs font-medium text-foreground-muted tabular-nums">
                        {columnTasks.length}
                      </span>
                    </header>

                    <SortableContext
                      items={columnTasks.map((task) => task.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex-1 space-y-2 p-2.5">
                        {columnTasks.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                        {columnTasks.length === 0 && <DropZone id={column.status} />}
                      </div>
                    </SortableContext>
                  </section>
                );
              })}
            </div>
          </div>
        </DndContext>
      )}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'rounded-lg border border-border bg-surface p-3 transition-[border-color,box-shadow,opacity,transform] duration-150 ease-out',
        isDragging
          ? 'z-10 scale-[1.015] opacity-80 shadow-lg'
          : 'motion-safe:hover:-translate-y-0.5 hover:border-primary-border hover:shadow-sm'
      )}
    >
      <div className="flex items-start gap-2">
        <Link
          to={`/tasks/${task.id}`}
          className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-foreground hover:text-primary hover:underline"
        >
          {task.title}
        </Link>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-md text-border hover:bg-surface-muted hover:text-foreground-muted active:cursor-grabbing"
          aria-label={`Pindahkan ${task.title}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-foreground-muted">{task.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <PriorityBadge priority={task.priority} />
        <div className="flex items-center gap-2">
          {task.deadline && (
            <span
              className={cn(
                'flex items-center gap-1 text-[11px]',
                task.is_overdue ? 'font-medium text-danger' : 'text-foreground-muted'
              )}
            >
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              {formatDate(task.deadline)}
            </span>
          )}
          <Avatar name={task.assignee?.name ?? 'Unassigned'} size="xs" />
        </div>
      </div>
    </article>
  );
}

function DropZone({ id }: { id: TaskStatus }) {
  const { setNodeRef } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border bg-surface/50 px-3 text-center text-xs text-foreground-muted/80"
    >
      Tarik tugas ke sini
    </div>
  );
}
