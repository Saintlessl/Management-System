import { useState } from 'react';
import { CheckCircle2, ClipboardCheck, RotateCcw, XCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PriorityBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Table, TableWrap, TBody, Td, Th, THead, Tr, CellStack } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { UserCell } from '@/components/ui/Avatar';
import { useApprovals } from '@/hooks/useTasks';
import { tasksApi } from '@/api/tasks';
import { cn, formatDate, formatRelativeTime } from '@/utils';
import type { ApprovalQueueItem, TaskPriority } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

type Action = 'approve' | 'revision' | 'reject';

export function ApprovalsPage() {
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<ApprovalQueueItem | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const search = params.get('search') ?? '';
  const priority = (params.get('priority') as TaskPriority | null) ?? undefined;
  const page = Number(params.get('page') ?? 1);
  const approvalsQuery = useApprovals({ search: search || undefined, priority, page, per_page: 20 });

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const runAction = async () => {
    if (!selected || !action || isSubmitting) return;
    const { id, version } = selected.task;
    setSubmitting(true);
    try {
      if (action === 'approve') await tasksApi.approve(id, version, comment || undefined);
      if (action === 'revision') await tasksApi.revision(id, version, comment || undefined);
      if (action === 'reject') await tasksApi.reject(id, version, comment || undefined);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['approvals'] }),
        client.invalidateQueries({ queryKey: ['dashboard'] }),
        client.invalidateQueries({ queryKey: ['my-tasks'] }),
        client.invalidateQueries({ queryKey: ['tasks', id] }),
        client.invalidateQueries({ queryKey: ['projects', selected.task.project_id, 'tasks'] }),
      ]);
      setSelected(null); setAction(null); setComment('');
      toast.success(action === 'approve' ? 'Tugas disetujui.' : action === 'revision' ? 'Revisi diminta.' : 'Tugas ditolak.');
    } catch (error) {
      const message = typeof error === 'object' && error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.error(message ?? 'Aksi persetujuan gagal. Muat ulang antrean lalu coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const approvals = approvalsQuery.data?.data ?? [];
  const actionTitle = action === 'approve' ? 'Setujui tugas' : action === 'revision' ? 'Minta revisi' : 'Tolak tugas';

  return (
    <div className="space-y-4">
      <PageHeader title="Persetujuan" description="Tugas yang sedang menunggu keputusan Anda." />
      <FilterBar
        search={{ value: search, onChange: (value) => updateParam('search', value), placeholder: 'Cari tugas atau proyek...', label: 'Cari persetujuan' }}
        onClear={search || priority ? () => setParams(new URLSearchParams()) : undefined}
      >
        <FilterSelect value={priority ?? ''} onChange={(value) => updateParam('priority', value)} options={priorityOptions} placeholder="Semua prioritas" label="Filter prioritas" />
      </FilterBar>

      {approvalsQuery.isLoading ? <TableSkeleton rows={6} cols={6} /> : approvalsQuery.isError ? (
        <ErrorState title="Gagal memuat persetujuan" message="Tidak dapat memuat antrean persetujuan." onRetry={() => approvalsQuery.refetch()} />
      ) : approvals.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Tidak ada tugas menunggu persetujuan" description="Antrean akan muncul ketika anggota mengajukan tugas untuk ditinjau." />
      ) : (
        <TableWrap footer={approvalsQuery.data?.meta && <Pagination currentPage={page} totalPages={approvalsQuery.data.meta.last_page} total={approvalsQuery.data.meta.total} from={approvalsQuery.data.meta.from} to={approvalsQuery.data.meta.to} onPageChange={(next) => updateParam('page', String(next))} />}>
          <Table minWidth="min-w-[64rem]">
            <THead><Tr><Th className="w-[30%]">Tugas</Th><Th>Proyek</Th><Th>Pengaju</Th><Th>Prioritas</Th><Th>Deadline</Th><Th align="right">Aksi</Th></Tr></THead>
            <TBody>{approvals.map((item) => (
              <Tr key={item.id} interactive>
                <Td><CellStack title={<Link to={`/tasks/${item.task.id}`} className="rounded font-medium text-foreground hover:text-primary hover:underline">{item.task.title}</Link>} subtitle={`Diajukan ${formatRelativeTime(item.created_at)}`} /></Td>
                <Td>{item.task.project ? <Link to={`/projects/${item.task.project.id}`} className="text-[13px] text-foreground-muted hover:text-primary hover:underline">{item.task.project.name}</Link> : '—'}</Td>
                <Td><UserCell name={item.requester?.name} size="xs" /></Td>
                <Td><PriorityBadge priority={item.task.priority} /></Td>
                <Td><span className={cn('whitespace-nowrap text-[13px]', item.task.is_overdue ? 'font-medium text-danger' : 'text-foreground-muted')}>{item.task.deadline ? formatDate(item.task.deadline) : '—'}</span></Td>
                <Td align="right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" className="text-success hover:bg-success/10 hover:text-success" aria-label={`Setujui ${item.task.title}`} onClick={() => { setSelected(item); setAction('approve'); }}><CheckCircle2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon-sm" className="text-warning hover:bg-warning/10 hover:text-warning" aria-label={`Minta revisi ${item.task.title}`} onClick={() => { setSelected(item); setAction('revision'); }}><RotateCcw className="h-4 w-4" /></Button><Button variant="ghost" size="icon-sm" className="text-danger hover:bg-danger/10 hover:text-danger" aria-label={`Tolak ${item.task.title}`} onClick={() => { setSelected(item); setAction('reject'); }}><XCircle className="h-4 w-4" /></Button></div></Td>
              </Tr>
            ))}</TBody>
          </Table>
        </TableWrap>
      )}

      <Modal isOpen={selected !== null && action !== null} onClose={() => { setSelected(null); setAction(null); }} title={actionTitle} description={selected?.task.title} footer={<><Button variant="outline" size="sm" onClick={() => { setSelected(null); setAction(null); }}>Batal</Button><Button type="submit" form="approval-action" size="sm" variant={action === 'reject' ? 'danger' : 'primary'} isLoading={isSubmitting}>{action === 'approve' ? 'Setujui' : action === 'revision' ? 'Minta revisi' : 'Tolak'}</Button></>}>
        <form id="approval-action" onSubmit={(event) => { event.preventDefault(); void runAction(); }}><Textarea id="approval-comment" label="Komentar" hint="Opsional, tetapi membantu pengaju memahami keputusan Anda." rows={4} value={comment} onChange={(event) => setComment(event.target.value)} /></form>
      </Modal>
    </div>
  );
}
