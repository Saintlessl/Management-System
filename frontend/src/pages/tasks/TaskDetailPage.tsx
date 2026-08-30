import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  GitBranch,
  Pencil,
  Plus,
  Reply,
  Send,
  Trash2,
  FileText,
  Download,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { collaborationApi } from '@/api/collaboration';
import { tasksApi } from '@/api/tasks';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Avatar, UserCell } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuth } from '@/hooks/useAuth';
import { useTask } from '@/hooks/useTasks';
import { cn, formatDate, formatDateTime, formatRelativeTime } from '@/utils';
import type { Attachment, Comment, TaskPriority } from '@/types';

export function TaskDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const client = useQueryClient();

  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [editComment, setEditComment] = useState<Comment | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [deleteComment, setDeleteComment] = useState<Comment | null>(null);
  const [deleteAttachment, setDeleteAttachment] = useState<Attachment | null>(null);
  const [edit, setEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    deadline: '',
  });

  const { data, isLoading, isError, refetch } = useTask(id);
  const task = data?.data;

  const comments = useQuery({
    queryKey: ['tasks', id, 'comments'],
    queryFn: () => collaborationApi.comments(id),
    enabled: Boolean(task),
  });

  const attachments = useQuery({
    queryKey: ['tasks', id, 'attachments'],
    queryFn: () => collaborationApi.attachments(id),
    enabled: Boolean(task),
  });

  const refreshComments = () => client.invalidateQueries({ queryKey: ['tasks', id, 'comments'] });

  const addComment = useMutation({
    mutationFn: () => collaborationApi.addComment(id, body, replyTo?.id),
    onSuccess: () => {
      setBody('');
      setReplyTo(null);
      refreshComments();
      toast.success('Komentar ditambahkan.');
    },
    onError: () => toast.error('Gagal menambahkan komentar.'),
  });

  const updateComment = useMutation({
    mutationFn: () => collaborationApi.updateComment(editComment!.id, commentBody),
    onSuccess: () => {
      setEditComment(null);
      refreshComments();
      toast.success('Komentar diperbarui.');
    },
    onError: () => toast.error('Gagal memperbarui komentar.'),
  });

  const removeComment = useMutation({
    mutationFn: () => collaborationApi.deleteComment(deleteComment!.id),
    onSuccess: () => {
      setDeleteComment(null);
      refreshComments();
      toast.success('Komentar dihapus.');
    },
    onError: () => toast.error('Gagal menghapus komentar.'),
  });

  const removeAttachment = useMutation({
    mutationFn: () => collaborationApi.deleteAttachment(deleteAttachment!.id),
    onSuccess: () => {
      setDeleteAttachment(null);
      attachments.refetch();
      toast.success('Attachment dihapus.');
    },
    onError: () => toast.error('Gagal menghapus attachment.'),
  });

  const workflow = useMutation({
    mutationFn: ({
      action,
      comment,
    }: {
      action: 'submit' | 'approve' | 'reject' | 'revision';
      comment?: string;
    }) =>
      action === 'submit'
        ? tasksApi.submitReview(id, task!.version, comment)
        : action === 'approve'
        ? tasksApi.approve(id, task!.version, comment)
        : action === 'reject'
        ? tasksApi.reject(id, task!.version, comment)
        : tasksApi.revision(id, task!.version, comment),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['tasks', id] });
      toast.success('Status alur kerja berhasil diperbarui.');
    },
    onError: () => toast.error('Gagal memperbarui alur kerja.'),
  });

  const update = useMutation({
    mutationFn: () =>
      tasksApi.update(id, { ...form, deadline: form.deadline || null, version: task!.version }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['tasks', id] });
      setEdit(false);
      toast.success('Task berhasil diperbarui.');
    },
    onError: () => toast.error('Task gagal diperbarui.'),
  });

  const remove = useMutation({
    mutationFn: () => tasksApi.remove(id),
    onSuccess: () => {
      navigate(`/projects/${task!.project_id}/tasks`);
      toast.success('Task berhasil dihapus.');
    },
    onError: () => toast.error('Task gagal dihapus.'),
  });

  const upload = async (file?: File) => {
    if (!file) return;
    try {
      await collaborationApi.upload(id, file);
      await attachments.refetch();
      toast.success('File berhasil diunggah.');
    } catch {
      toast.error('File gagal diunggah.');
    }
  };

  const openEdit = () => {
    if (!task) return;
    setForm({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      deadline: task.deadline ?? '',
    });
    setEdit(true);
  };

  const startEditComment = (comment: Comment) => {
    setEditComment(comment);
    setCommentBody(comment.body);
  };

  const canManageComment = (comment: Comment) =>
    isSuperAdmin ||
    (comment.user_id === user?.id &&
      (hasPermission('comment.update') || hasPermission('comment.delete')));

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-6 w-36" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <ErrorState
        title="Tugas Tidak Ditemukan"
        message="Tugas tidak ditemukan atau Anda tidak memiliki hak akses."
        onRetry={() => refetch()}
      />
    );
  }

  const renderComment = (comment: Comment, nested = false) => (
    <article
      key={comment.id}
      className={cn(
        'rounded-lg border border-border p-4 transition-colors',
        nested ? 'ml-6 bg-input sm:ml-8' : 'bg-surface'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar name={comment.user?.name || '?'} size="xs" />
          <span className="text-xs font-semibold text-foreground">{comment.user?.name}</span>
        </div>
        <time
          dateTime={comment.created_at}
          title={formatDateTime(comment.created_at)}
          className="text-[11px] font-medium text-foreground-muted/80"
        >
          {formatRelativeTime(comment.created_at)}
        </time>
      </div>

      <p className="mt-2.5 whitespace-pre-wrap text-sm text-foreground leading-relaxed">
        {comment.body}
      </p>

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-2">
        {hasPermission('comment.create') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-foreground-muted hover:text-primary"
            onClick={() => {
              setReplyTo(comment);
              setBody('');
            }}
          >
            <Reply className="h-3 w-3" />
            Balas
          </Button>
        )}
        {canManageComment(comment) && hasPermission('comment.update') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-foreground-muted hover:text-foreground"
            onClick={() => startEditComment(comment)}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
        )}
        {canManageComment(comment) && hasPermission('comment.delete') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-danger hover:bg-danger/10 hover:text-danger"
            onClick={() => setDeleteComment(comment)}
          >
            <Trash2 className="h-3 w-3" />
            Hapus
          </Button>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </article>
  );

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title={task.title}
        description={`Tugas pada ${task.project?.name ?? `proyek #${task.project_id}`}`}
        breadcrumbs={[
          { label: 'Projects', to: '/projects' },
          {
            label: task.project?.name ?? `Proyek #${task.project_id}`,
            to: `/projects/${task.project_id}`,
          },
          { label: 'Tugas' },
        ]}
        badge={
          <span className="flex items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </span>
        }
      >
        {hasPermission('task.update') && (
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
        {hasPermission('task.delete') && (
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger/10 hover:text-danger"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </Button>
        )}
      </PageHeader>

      <div className="grid items-start gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Deskripsi tugas</CardTitle>
              <CardDescription>Ruang lingkup dan hasil kerja yang diharapkan.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {task.description || 'Tidak ada rincian deskripsi pada tugas ini.'}
              </p>

              {(task.status === 'in_progress' || task.status === 'review') && (
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <span className="mr-1 text-xs font-medium text-foreground-muted">Alur kerja</span>
                  {task.status === 'in_progress' && hasPermission('task.submit_review') && (
                    <Button size="sm" onClick={() => workflow.mutate({ action: 'submit' })}>
                      <Send className="h-3.5 w-3.5" />
                      Ajukan review
                    </Button>
                  )}
                  {task.status === 'review' && hasPermission('task.approve') && (
                    <>
                      <Button
                        size="sm"
                        className="bg-success hover:bg-success/85"
                        onClick={() => workflow.mutate({ action: 'approve' })}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-warning/40 text-warning hover:bg-warning/10"
                        onClick={() => workflow.mutate({ action: 'revision' })}
                      >
                        Minta revisi
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => workflow.mutate({ action: 'reject' })}>
                        Tolak
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments Section */}
          <Card>
            <CardHeader
              actions={
                hasPermission('attachment.upload') ? (
                  <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-input">
                    <Plus className="h-3.5 w-3.5" />
                    Unggah file
                    <input
                      type="file"
                      className="hidden"
                      onChange={(event) => upload(event.target.files?.[0])}
                    />
                  </label>
                ) : undefined
              }
            >
              <CardTitle>Lampiran ({attachments.data?.data?.length ?? 0})</CardTitle>
              <CardDescription>Dokumen dan berkas pendukung tugas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {attachments.data?.data && attachments.data.data.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {attachments.data.data.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-input p-3 transition-colors hover:border-primary-border hover:bg-surface"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div className="truncate">
                          <a
                            href={collaborationApi.downloadUrl(file.id)}
                            className="text-xs font-semibold text-foreground hover:text-primary truncate block"
                          >
                            {file.original_name}
                          </a>
                          <span className="text-[11px] text-foreground-muted/80">{file.human_size}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={collaborationApi.downloadUrl(file.id)}
                          className="rounded-lg p-1.5 text-foreground-muted/80 hover:bg-primary-subtle hover:text-primary"
                          title="Unduh"
                          aria-label={`Unduh ${file.original_name}`}
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        {(isSuperAdmin || file.uploaded_by === user?.id) && (
                          <button
                            type="button"
                            onClick={() => setDeleteAttachment(file)}
                            className="rounded-lg p-1.5 text-foreground-muted/80 hover:bg-danger/10 hover:text-danger"
                            title="Hapus"
                            aria-label={`Hapus ${file.original_name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-foreground-muted/80 py-3 text-center">Belum ada file lampiran pada tugas ini.</p>
              )}
            </CardContent>
          </Card>

          {/* Discussion & Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Diskusi ({comments.data?.data?.length ?? 0})</CardTitle>
              <CardDescription>Komentar dan pembaruan dari anggota tim.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {comments.data?.data && comments.data.data.length > 0 ? (
                  comments.data.data.map((comment) => renderComment(comment))
                ) : (
                  <p className="text-xs text-foreground-muted/80 py-3 text-center">Belum ada komentar. Tulis komentar pertama untuk berdiskusi.</p>
                )}
              </div>

              {hasPermission('comment.create') && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    addComment.mutate();
                  }}
                  className="mt-6 space-y-3 border-t border-border pt-4"
                >
                  {replyTo && (
                    <div className="flex items-center justify-between rounded-lg bg-primary-subtle px-3 py-2 text-xs font-medium text-primary">
                      <span>Membalas {replyTo.user?.name}</span>
                      <button type="button" onClick={() => setReplyTo(null)} className="hover:underline">
                        Batal
                      </button>
                    </div>
                  )}

                  <Textarea
                    id="new-comment"
                    label="Komentar"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    required
                    rows={3}
                    placeholder="Tulis komentar atau pembaruan tugas..."
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" isLoading={addComment.isPending}>
                      <Send className="h-3.5 w-3.5" />
                      Kirim komentar
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Properti tugas</CardTitle>
              <CardDescription>Informasi utama dan hubungan tugas.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border border-t border-border">
                <PropertyRow label="Status">
                  <StatusBadge status={task.status} />
                </PropertyRow>
                <PropertyRow label="Prioritas">
                  <PriorityBadge priority={task.priority} />
                </PropertyRow>
                <PropertyRow label="Penanggung jawab">
                  <UserCell name={task.assignee?.name} size="xs" />
                </PropertyRow>
                <PropertyRow label="Tenggat waktu">
                  <span
                    className={cn(
                      'flex items-center gap-1.5 text-[13px] font-medium',
                      task.is_overdue ? 'text-danger' : 'text-foreground'
                    )}
                  >
                    <CalendarDays className="h-3.5 w-3.5 text-foreground-muted/80" />
                    {task.deadline ? formatDate(task.deadline) : 'Tanpa deadline'}
                  </span>
                </PropertyRow>
                <PropertyRow label="Prasyarat">
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                    <GitBranch className="h-3.5 w-3.5 text-foreground-muted/80" />
                    {task.dependencies?.length ?? 0} tugas
                  </span>
                </PropertyRow>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat persetujuan</CardTitle>
              <CardDescription>Keputusan dan perubahan alur kerja.</CardDescription>
            </CardHeader>
            <CardContent>
              {task.approvals?.length ? (
                <ol className="divide-y divide-border border-t border-border">
                  {task.approvals.flatMap(
                    (approval) =>
                      approval.histories?.map((history) => (
                        <li key={history.id} className="py-3">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-[11px] font-semibold tracking-wide text-primary uppercase">
                              {history.action.replaceAll('_', ' ')}
                            </span>
                            <time
                              dateTime={history.created_at}
                              title={formatDateTime(history.created_at)}
                              className="shrink-0 text-[10px] text-foreground-muted/80"
                            >
                              {formatRelativeTime(history.created_at)}
                            </time>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
                            <span className="font-medium text-foreground">{history.user?.name}</span>
                            {history.comment ? ` — “${history.comment}”` : ''}
                          </p>
                        </li>
                      )) ?? []
                  )}
                </ol>
              ) : (
                <p className="text-xs text-foreground-muted">Belum ada riwayat persetujuan.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Modal
        isOpen={edit}
        onClose={() => setEdit(false)}
        title="Edit tugas"
        size="lg"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setEdit(false)}>
              Batal
            </Button>
            <Button type="submit" form="edit-task" size="sm" isLoading={update.isPending}>
              Simpan perubahan
            </Button>
          </>
        }
      >
        <form
          id="edit-task"
          onSubmit={(event) => {
            event.preventDefault();
            update.mutate();
          }}
          className="space-y-4"
        >
          <Input
            id="edit-task-title"
            label="Judul Tugas"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
          <Textarea
            id="edit-task-desc"
            label="Deskripsi"
            rows={4}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <Select
            label="Prioritas"
            options={priorityOptions}
            value={form.priority}
            onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}
          />
          <Input
            id="edit-task-deadline"
            label="Deadline"
            type="date"
            value={form.deadline}
            onChange={(event) => setForm({ ...form, deadline: event.target.value })}
          />
        </form>
      </Modal>

      <Modal
        isOpen={editComment !== null}
        onClose={() => setEditComment(null)}
        title="Edit komentar"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditComment(null)}>
              Batal
            </Button>
            <Button type="submit" form="edit-comment" size="sm" isLoading={updateComment.isPending}>
              Simpan
            </Button>
          </>
        }
      >
        <form
          id="edit-comment"
          onSubmit={(event) => {
            event.preventDefault();
            updateComment.mutate();
          }}
          className="space-y-4"
        >
          <Textarea
            label="Komentar"
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            required
            rows={4}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Hapus tugas"
        message="Tugas beserta seluruh komentar, lampiran, dan riwayat approval akan dihapus permanen."
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
        isLoading={remove.isPending}
      />
      <ConfirmDialog
        isOpen={deleteComment !== null}
        title="Hapus komentar"
        message="Komentar beserta balasan di dalamnya akan dihapus."
        onClose={() => setDeleteComment(null)}
        onConfirm={() => removeComment.mutate()}
        isLoading={removeComment.isPending}
      />
      <ConfirmDialog
        isOpen={deleteAttachment !== null}
        title="Hapus lampiran file"
        message={`Apakah Anda yakin ingin menghapus file "${deleteAttachment?.original_name}"?`}
        onClose={() => setDeleteAttachment(null)}
        onConfirm={() => removeAttachment.mutate()}
        isLoading={removeAttachment.isPending}
      />
    </div>
  );
}

function PropertyRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-[13px] text-foreground-muted">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];
