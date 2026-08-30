import { useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { UserCell } from '@/components/ui/Avatar';
import { Table, TableWrap, TBody, Td, Th, THead, Tr } from '@/components/ui/Table';
import { ProjectWorkspaceHeader } from '@/components/projects/ProjectWorkspaceHeader';
import { useAuth } from '@/hooks/useAuth';
import {
  useProject,
  useProjectMemberMutations,
  useProjectMembers,
  useProjectUserOptions,
} from '@/hooks/useProjects';
import { formatDate } from '@/utils';
import type { ProjectRole } from '@/types';

const roleOptions = [
  { value: 'manager', label: 'Manager' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

export function ProjectMembersPage() {
  const id = Number(useParams().id);
  const { hasPermission } = useAuth();
  const projectQuery = useProject(id);
  const membersQuery = useProjectMembers(id);
  const canManage = hasPermission('project.manage_members');
  const { data: options } = useProjectUserOptions(canManage);
  const { addMember, updateMember, removeMember } = useProjectMemberMutations(id);

  const [open, setOpen] = useState(false);
  const [removeId, setRemoveId] = useState<number | null>(null);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<ProjectRole>('member');

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await addMember.mutateAsync({ user_id: Number(userId), project_role: role });
      setOpen(false);
      setUserId('');
      setRole('member');
      toast.success('Anggota berhasil ditambahkan.');
    } catch {
      toast.error('Anggota gagal ditambahkan atau sudah terdaftar.');
    }
  };

  if (projectQuery.isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

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

  const members = membersQuery.data?.data ?? [];

  return (
    <div className="space-y-5">
      <ProjectWorkspaceHeader
        project={project}
        actions={
          canManage && (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Tambah anggota
            </Button>
          )
        }
      />

      {membersQuery.isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : membersQuery.isError ? (
        <ErrorState
          title="Gagal memuat anggota"
          message="Tidak dapat memuat daftar anggota proyek."
          onRetry={() => membersQuery.refetch()}
        />
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada anggota"
          description="Tambahkan anggota agar mereka dapat melihat dan mengerjakan tugas proyek."
          actionLabel={canManage ? 'Tambah anggota' : undefined}
          onAction={canManage ? () => setOpen(true) : undefined}
          actionIcon={Plus}
        />
      ) : (
        <TableWrap>
          <Table minWidth="min-w-[42rem]">
            <THead>
              <Tr>
                <Th className="w-[42%]">Anggota</Th>
                <Th>Peran proyek</Th>
                <Th>Bergabung</Th>
                <Th align="right">Aksi</Th>
              </Tr>
            </THead>
            <TBody>
              {members.map((member) => (
                <Tr key={member.id} interactive>
                  <Td>
                    <UserCell
                      name={member.user?.name}
                      secondary={member.user?.email}
                      size="sm"
                    />
                  </Td>
                  <Td>
                    {canManage ? (
                      <Select
                        options={roleOptions}
                        value={member.project_role}
                        aria-label={`Peran ${member.user?.name}`}
                        className="w-36"
                        onChange={(event) =>
                          updateMember.mutate({
                            memberId: member.id,
                            payload: {
                              user_id: member.user_id,
                              project_role: event.target.value as ProjectRole,
                            },
                          })
                        }
                      />
                    ) : (
                      <Badge>{member.project_role}</Badge>
                    )}
                  </Td>
                  <Td className="text-[13px] text-foreground-muted">
                    {member.joined_at ? formatDate(member.joined_at) : '—'}
                  </Td>
                  <Td align="right">
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-foreground-muted/80 hover:text-danger"
                        onClick={() => setRemoveId(member.id)}
                        aria-label={`Hapus ${member.user?.name} dari proyek`}
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
        title="Tambah anggota"
        description="Pilih pengguna dan perannya dalam proyek ini."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              form="add-project-member"
              size="sm"
              isLoading={addMember.isPending}
            >
              Tambahkan
            </Button>
          </>
        }
      >
        <form id="add-project-member" onSubmit={add} className="space-y-4">
          <Select
            id="member-user"
            label="Pengguna"
            options={(options?.data ?? []).map((user) => ({
              value: String(user.id),
              label: `${user.name} — ${user.email}`,
            }))}
            placeholder="Pilih pengguna"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            required
          />
          <Select
            id="member-role"
            label="Peran proyek"
            options={roleOptions}
            value={role}
            onChange={(event) => setRole(event.target.value as ProjectRole)}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={removeId !== null}
        title="Hapus anggota"
        message="Anggota ini akan kehilangan akses ke tugas dan papan Kanban proyek."
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId !== null) {
            removeMember.mutate(removeId, { onSuccess: () => setRemoveId(null) });
          }
        }}
        isLoading={removeMember.isPending}
      />
    </div>
  );
}
