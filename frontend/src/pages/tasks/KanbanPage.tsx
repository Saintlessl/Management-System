import { useMemo, useState } from 'react';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { StatusBadge } from '@/components/ui/Badge';
import { tasksApi } from '@/api/tasks';
import { useTasks } from '@/hooks/useTasks';
import type { Task, TaskStatus } from '@/types';

const columns: { status: TaskStatus; title: string }[] = [
  { status: 'backlog', title: 'Backlog' }, { status: 'todo', title: 'To Do' }, { status: 'in_progress', title: 'In Progress' }, { status: 'review', title: 'Review' }, { status: 'done', title: 'Done' },
];

export function KanbanPage() {
  const projectId = Number(useParams().id);
  const { data, isLoading, refetch } = useTasks(projectId, { per_page: 100, sort: 'created_at', direction: 'asc' });
  const [optimistic, setOptimistic] = useState<Task[] | null>(null);
  const tasks = useMemo(() => optimistic ?? data?.data ?? [], [optimistic, data?.data]);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const grouped = useMemo(() => Object.fromEntries(columns.map((column) => [column.status, tasks.filter((task) => task.status === column.status).sort((a, b) => a.position - b.position)])) as Record<TaskStatus, Task[]>, [tasks]);

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const task = tasks.find((item) => item.id === Number(active.id));
    const targetTask = tasks.find((item) => item.id === Number(over.id));
    const targetStatus = (targetTask?.status ?? over.id) as TaskStatus;
    if (!task || !columns.some((column) => column.status === targetStatus)) return;
    const snapshot = tasks;
    const position = targetTask ? grouped[targetStatus].findIndex((item) => item.id === targetTask.id) + 1 : grouped[targetStatus].length + 1;
    setOptimistic(tasks.map((item) => item.id === task.id ? { ...item, status: targetStatus, position } : item));
    try {
      await tasksApi.move(task.id, { status: targetStatus, position, version: task.version });
      await refetch();
      setOptimistic(null);
    } catch {
      setOptimistic(snapshot);
      toast.error('Task gagal dipindahkan. Board dikembalikan ke kondisi sebelumnya.');
    }
  };

  if (isLoading) return <div className="py-16 text-center text-slate-500">Memuat Kanban...</div>;
  return <DndContext sensors={sensors} onDragEnd={handleDragEnd}><div className="overflow-x-auto"><div className="grid min-w-300 grid-cols-5 gap-4">{columns.map((column) => <section key={column.status} className="rounded-xl bg-slate-100 p-3"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{column.title}</h2><span className="rounded-full bg-white px-2 py-0.5 text-xs">{grouped[column.status].length}</span></div><SortableContext items={grouped[column.status].map((task) => task.id)} strategy={verticalListSortingStrategy}><div id={column.status} className="min-h-40 space-y-2">{grouped[column.status].map((task) => <TaskCard key={task.id} task={task} />)}{grouped[column.status].length === 0 && <DropZone id={column.status} />}</div></SortableContext></section>)}</div></div></DndContext>;
}

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners} className={`cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm ${isDragging ? 'opacity-50' : ''}`}><Link to={`/tasks/${task.id}`} onClick={(event) => event.stopPropagation()} className="text-sm font-medium hover:text-blue-600">{task.title}</Link><div className="mt-3 flex items-center justify-between"><StatusBadge status={task.status} /><span className="text-xs text-slate-400">{task.assignee?.name ?? 'Unassigned'}</span></div></article>;
}
function DropZone({ id }: { id: string }) { const { setNodeRef } = useSortable({ id }); return <div ref={setNodeRef} className="flex min-h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">Drop task</div>; }
