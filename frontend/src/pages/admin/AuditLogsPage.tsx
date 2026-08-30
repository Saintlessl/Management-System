import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileClock } from 'lucide-react';
import { operationsApi } from '@/api/operations';
import { PageHeader } from '@/components/ui/PageHeader';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserCell } from '@/components/ui/Avatar';
import { Drawer } from '@/components/ui/Drawer';
import { Table, TableWrap, TBody, Td, Th, THead, Tr, CellStack } from '@/components/ui/Table';
import { formatDateTime } from '@/utils';
import type { AuditLog } from '@/types';

export function AuditLogsPage() {
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const logsQuery = useQuery({
    queryKey: ['audit-logs'],
    queryFn: operationsApi.auditLogs,
  });

  const logs = logsQuery.data?.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Audit Logs"
        description="Riwayat perubahan data penting dan aktor yang melakukannya."
      />

      {logsQuery.isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : logsQuery.isError ? (
        <ErrorState
          title="Gagal memuat audit log"
          message="Tidak dapat mengambil riwayat aktivitas sistem."
          onRetry={() => logsQuery.refetch()}
        />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={FileClock}
          title="Belum ada audit log"
          description="Perubahan data penting akan tercatat di sini."
        />
      ) : (
        <TableWrap>
          <Table minWidth="min-w-[54rem]">
            <THead>
              <Tr>
                <Th className="w-[25%]">Aktor</Th>
                <Th>Aksi</Th>
                <Th className="w-[28%]">Entitas</Th>
                <Th>Waktu</Th>
                <Th className="sr-only">Detail</Th>
              </Tr>
            </THead>
            <TBody>
              {logs.map((log) => (
                <Tr
                  key={log.id}
                  interactive
                  className="cursor-pointer"
                  onClick={() => setSelected(log)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelected(log);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`Lihat rincian ${log.action} pada ${log.entity_type}`}
                >
                  <Td>
                    <UserCell name={log.user?.name ?? 'Sistem'} size="xs" />
                  </Td>
                  <Td>
                    <span className="font-medium text-foreground">{humanize(log.action)}</span>
                  </Td>
                  <Td>
                    <CellStack
                      title={shortEntity(log.entity_type)}
                      subtitle={`ID #${log.entity_id}`}
                    />
                  </Td>
                  <Td className="whitespace-nowrap text-[13px] text-foreground-muted">
                    {formatDateTime(log.created_at)}
                  </Td>
                  <Td className="w-1 text-right text-xs font-medium text-primary">Lihat</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      )}

      <Drawer
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? humanize(selected.action) : 'Detail audit'}
        description={
          selected ? `${shortEntity(selected.entity_type)} #${selected.entity_id}` : undefined
        }
        width="lg"
      >
        {selected && <AuditDetail log={selected} />}
      </Drawer>
    </div>
  );
}

function AuditDetail({ log }: { log: AuditLog }) {
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Detail label="Aktor" value={log.user?.name ?? 'Sistem'} />
        <Detail label="Waktu" value={formatDateTime(log.created_at)} />
        <Detail label="Aksi" value={humanize(log.action)} />
        <Detail label="IP address" value={log.ip_address ?? '—'} />
      </dl>

      <div className="grid gap-4 sm:grid-cols-2">
        <ValuePanel title="Nilai sebelumnya" value={log.old_value} />
        <ValuePanel title="Nilai baru" value={log.new_value} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-wide text-foreground-muted uppercase">{label}</dt>
      <dd className="mt-1 text-[13px] text-foreground">{value}</dd>
    </div>
  );
}

function ValuePanel({ title, value }: { title: string; value: Record<string, unknown> | null }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-2 text-[13px] font-medium text-foreground">{title}</h3>
      {value ? (
        <pre className="max-h-[60vh] overflow-auto rounded-lg border border-border bg-input p-3 text-xs leading-relaxed text-foreground">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : (
        <div className="rounded-lg border border-border bg-input px-3 py-4 text-xs text-foreground-muted/80">
          Tidak ada nilai.
        </div>
      )}
    </section>
  );
}

function humanize(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function shortEntity(value: string) {
  return value.split('\\').at(-1) ?? value;
}
