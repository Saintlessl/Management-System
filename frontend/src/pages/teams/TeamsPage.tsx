import { useState } from 'react';
import { Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, TableWrap, TBody, Td, Th, THead, Tr, CellStack } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/hooks/useAuth';
import { useTeamMutations, useTeams } from '@/hooks/useTeams';
import type { Team } from '@/types';
import type { TeamPayload } from '@/api/teams';

const emptyForm: TeamPayload = { name: '', description: '' };

export function TeamsPage() {
  const { hasPermission } = useAuth();
  const teamsQuery = useTeams();
  const { createTeam, updateTeam, deleteTeam } = useTeamMutations();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [deleting, setDeleting] = useState<Team | null>(null);
  const [form, setForm] = useState<TeamPayload>(emptyForm);
  const teams = teamsQuery.data?.data ?? [];
  const canCreate = hasPermission('team.create');

  const openCreate = () => { setEditing(null); setForm(emptyForm); setIsOpen(true); };
  const openEdit = (team: Team) => { setEditing(team); setForm({ name: team.name, description: team.description }); setIsOpen(true); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editing) await updateTeam.mutateAsync({ id: editing.id, payload: form });
      else await createTeam.mutateAsync(form);
      toast.success(editing ? 'Tim berhasil diperbarui.' : 'Tim berhasil dibuat.');
      setIsOpen(false);
    } catch {
      toast.error('Tim gagal diproses.');
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try { await deleteTeam.mutateAsync(deleting.id); toast.success('Tim berhasil dihapus.'); setDeleting(null); }
    catch { toast.error('Tim gagal dihapus.'); }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Teams" description="Kelola kelompok kerja global sebelum menetapkan anggota secara spesifik ke proyek.">
        {canCreate && <Button onClick={openCreate}><Plus className="h-3.5 w-3.5" />Tim baru</Button>}
      </PageHeader>
      {teamsQuery.isLoading ? <TableSkeleton rows={6} cols={4} /> : teamsQuery.isError ? (
        <ErrorState title="Gagal memuat tim" message="Daftar tim tidak dapat dimuat dari server." onRetry={() => teamsQuery.refetch()} />
      ) : teams.length === 0 ? (
        <EmptyState icon={UsersRound} title="Belum ada tim" description="Buat tim global untuk mengorganisir anggota lintas proyek." actionLabel={canCreate ? 'Buat tim' : undefined} onAction={canCreate ? openCreate : undefined} actionIcon={Plus} />
      ) : (
        <TableWrap><Table minWidth="min-w-[44rem]"><THead><Tr><Th>Tim</Th><Th align="center">Anggota</Th><Th align="center">Proyek</Th><Th align="right">Aksi</Th></Tr></THead><TBody>
          {teams.map((team) => {
            const canEdit = hasPermission('team.update');
            const canDelete = hasPermission('team.delete');
            return <Tr key={team.id} interactive><Td><CellStack title={team.name} subtitle={team.description || undefined} /></Td><Td align="center" className="tabular-nums">{team.members_count ?? 0}</Td><Td align="center" className="tabular-nums">{team.projects_count ?? 0}</Td><Td align="right"><span className="inline-flex gap-1">{canEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(team)} aria-label={`Edit ${team.name}`}><Pencil className="h-3.5 w-3.5" /></Button>}{canDelete && <Button variant="ghost" size="icon-sm" className="text-danger hover:text-danger" onClick={() => setDeleting(team)} aria-label={`Hapus ${team.name}`}><Trash2 className="h-3.5 w-3.5" /></Button>}</span></Td></Tr>;
          })}
        </TBody></Table></TableWrap>
      )}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Edit tim' : 'Tim baru'} size="lg" footer={<><Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>Batal</Button><Button type="submit" form="team-form" size="sm" isLoading={createTeam.isPending || updateTeam.isPending}>Simpan tim</Button></>}>
        <form id="team-form" onSubmit={submit} className="space-y-4"><Input id="team-name" label="Nama tim" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /><Textarea id="team-description" label="Deskripsi" rows={3} value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></form>
      </Modal>
      <ConfirmDialog isOpen={deleting !== null} title="Hapus tim" message={`Hapus tim “${deleting?.name}”? Keanggotaan tim akan dihapus, tetapi proyek tetap ada.`} onClose={() => setDeleting(null)} onConfirm={remove} isLoading={deleteTeam.isPending} />
    </div>
  );
}
