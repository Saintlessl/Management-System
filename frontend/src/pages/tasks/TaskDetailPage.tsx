import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, GitBranch, History, Paperclip, Pencil, Reply, Send, Trash2, User } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { collaborationApi } from '@/api/collaboration';
import { tasksApi } from '@/api/tasks';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/hooks/useAuth';
import { useTask } from '@/hooks/useTasks';
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
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as TaskPriority, deadline: '' });
  const { data, isLoading, isError, refetch } = useTask(id);
  const task = data?.data;
  const comments = useQuery({ queryKey: ['tasks', id, 'comments'], queryFn: () => collaborationApi.comments(id), enabled: Boolean(task) });
  const attachments = useQuery({ queryKey: ['tasks', id, 'attachments'], queryFn: () => collaborationApi.attachments(id), enabled: Boolean(task) });
  const refreshComments = () => client.invalidateQueries({ queryKey: ['tasks', id, 'comments'] });
  const addComment = useMutation({
    mutationFn: () => collaborationApi.addComment(id, body, replyTo?.id),
    onSuccess: () => { setBody(''); setReplyTo(null); refreshComments(); },
  });
  const updateComment = useMutation({
    mutationFn: () => collaborationApi.updateComment(editComment!.id, commentBody),
    onSuccess: () => { setEditComment(null); refreshComments(); toast.success('Komentar diperbarui.'); },
  });
  const removeComment = useMutation({
    mutationFn: () => collaborationApi.deleteComment(deleteComment!.id),
    onSuccess: () => { setDeleteComment(null); refreshComments(); toast.success('Komentar dihapus.'); },
  });
  const removeAttachment = useMutation({
    mutationFn: () => collaborationApi.deleteAttachment(deleteAttachment!.id),
    onSuccess: () => { setDeleteAttachment(null); attachments.refetch(); toast.success('Attachment dihapus.'); },
  });
  const workflow = useMutation({
    mutationFn: ({ action, comment }: { action: 'submit' | 'approve' | 'reject' | 'revision'; comment?: string }) => action === 'submit' ? tasksApi.submitReview(id, task!.version, comment) : action === 'approve' ? tasksApi.approve(id, task!.version, comment) : action === 'reject' ? tasksApi.reject(id, task!.version, comment) : tasksApi.revision(id, task!.version, comment),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['tasks', id] }); toast.success('Workflow berhasil diperbarui.'); },
    onError: () => toast.error('Workflow gagal diperbarui.'),
  });
  const update = useMutation({
    mutationFn: () => tasksApi.update(id, { ...form, deadline: form.deadline || null, version: task!.version }),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['tasks', id] }); setEdit(false); toast.success('Task diperbarui.'); },
    onError: () => toast.error('Task gagal diperbarui.'),
  });
  const remove = useMutation({ mutationFn: () => tasksApi.remove(id), onSuccess: () => navigate(`/projects/${task!.project_id}/tasks`), onError: () => toast.error('Task gagal dihapus.') });
  const upload = async (file?: File) => {
    if (!file) return;
    try { await collaborationApi.upload(id, file); await attachments.refetch(); toast.success('File berhasil diunggah.'); }
    catch { toast.error('File gagal diunggah.'); }
  };
  const openEdit = () => {
    if (!task) return;
    setForm({ title: task.title, description: task.description ?? '', priority: task.priority, deadline: task.deadline ?? '' });
    setEdit(true);
  };
  const startEditComment = (comment: Comment) => { setEditComment(comment); setCommentBody(comment.body); };
  const canManageComment = (comment: Comment) => isSuperAdmin || (comment.user_id === user?.id && (hasPermission('comment.update') || hasPermission('comment.delete')));

  if (isLoading) return <div className="py-16 text-center text-slate-500">Memuat task...</div>;
  if (isError || !task) return <div className="py-16 text-center"><p className="text-red-600">Task gagal dimuat atau tidak dapat diakses.</p><Button className="mt-3" variant="outline" onClick={() => refetch()}>Coba lagi</Button></div>;

  const renderComment = (comment: Comment, nested = false) => (
    <article key={comment.id} className={nested ? 'ml-6 rounded-lg border-l-2 border-blue-200 bg-white p-3' : 'rounded-lg bg-slate-50 p-3'}>
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium">{comment.user?.name}</span><span className="text-xs text-slate-400">{comment.created_at}</span></div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{comment.body}</p>
      <div className="mt-2 flex gap-2">
        {hasPermission('comment.create') && <Button variant="ghost" size="sm" onClick={() => { setReplyTo(comment); setBody(''); }}><Reply className="mr-1 h-3.5 w-3.5" />Reply</Button>}
        {canManageComment(comment) && hasPermission('comment.update') && <Button variant="ghost" size="sm" onClick={() => startEditComment(comment)}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button>}
        {canManageComment(comment) && hasPermission('comment.delete') && <Button variant="ghost" size="sm" onClick={() => setDeleteComment(comment)}><Trash2 className="mr-1 h-3.5 w-3.5 text-red-600" />Delete</Button>}
      </div>
      {comment.replies?.map((reply) => renderComment(reply, true))}
    </article>
  );

  return <div className="space-y-5">
    <Link to={`/projects/${task.project_id}/tasks`} className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"><ArrowLeft className="h-4 w-4" />Kembali ke tasks</Link>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold">{task.title}</h1><StatusBadge status={task.status} /><PriorityBadge priority={task.priority} /></div><div className="flex gap-2">{hasPermission('task.update') && <Button variant="outline" onClick={openEdit}><Pencil className="mr-2 h-4 w-4" />Edit</Button>}{hasPermission('task.delete') && <Button variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>}</div></div>
      <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">{task.description || 'Tidak ada deskripsi.'}</p>
      <div className="mt-5 flex flex-wrap gap-2">{task.status === 'in_progress' && hasPermission('task.submit_review') && <Button onClick={() => workflow.mutate({ action: 'submit' })}>Submit for Review</Button>}{task.status === 'review' && hasPermission('task.approve') && <><Button onClick={() => workflow.mutate({ action: 'approve' })}>Approve</Button><Button variant="outline" onClick={() => workflow.mutate({ action: 'revision' })}>Request Revision</Button><Button variant="danger" onClick={() => workflow.mutate({ action: 'reject' })}>Reject</Button></>}</div>
      <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3"><Info icon={<User className="h-4 w-4" />} label="Assignee" value={task.assignee?.name ?? 'Unassigned'} /><Info icon={<CalendarDays className="h-4 w-4" />} label="Deadline" value={task.deadline ?? 'Tidak ada'} /><Info icon={<GitBranch className="h-4 w-4" />} label="Dependencies" value={String(task.dependencies?.length ?? 0)} /></div>
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-semibold"><History className="h-4 w-4" />Approval History</h2><div className="mt-3 space-y-3">{task.approvals?.length ? task.approvals.flatMap((approval) => approval.histories?.map((history) => <div key={history.id} className="rounded-lg border border-slate-200 p-3"><div className="flex justify-between gap-2"><span className="text-sm font-medium">{history.action.replaceAll('_', ' ')}</span><span className="text-xs text-slate-400">{history.created_at}</span></div><p className="mt-1 text-xs text-slate-500">{history.user?.name}{history.comment ? ` — ${history.comment}` : ''}</p></div>) ?? []) : <p className="text-sm text-slate-500">Belum ada aktivitas approval.</p>}</div></section>
    <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Attachments</h2>{hasPermission('attachment.upload') && <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"><Paperclip className="mr-2 inline h-4 w-4" />Upload<input type="file" className="hidden" onChange={(event) => upload(event.target.files?.[0])} /></label>}</div><div className="mt-3 space-y-2">{attachments.data?.data.map((file) => <div key={file.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm"><a href={collaborationApi.downloadUrl(file.id)} className="text-blue-600">{file.original_name} · {file.human_size}</a>{(isSuperAdmin || file.uploaded_by === user?.id) && <Button variant="ghost" size="sm" onClick={() => setDeleteAttachment(file)}><Trash2 className="h-4 w-4 text-red-600" /></Button>}</div>)}</div></section>
    <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Discussion</h2><div className="mt-4 space-y-3">{comments.data?.data.map((comment) => renderComment(comment))}</div>{hasPermission('comment.create') && <form onSubmit={(event) => { event.preventDefault(); addComment.mutate(); }} className="mt-4"><div className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>{replyTo ? `Reply to ${replyTo.user?.name}` : 'Komentar baru'}</span>{replyTo && <button type="button" onClick={() => setReplyTo(null)} className="text-blue-600">Batal reply</button>}</div><div className="flex gap-2"><textarea value={body} onChange={(event) => setBody(event.target.value)} required placeholder="Tulis komentar, mention dengan @email@company.com" className="min-h-20 flex-1 rounded-lg border border-slate-300 p-3 text-sm" /><Button type="submit" isLoading={addComment.isPending}><Send className="h-4 w-4" /></Button></div></form>}</section>
    <Modal isOpen={edit} onClose={() => setEdit(false)} title="Edit task"><form onSubmit={(event) => { event.preventDefault(); update.mutate(); }} className="space-y-4"><Input id="edit-task-title" label="Judul" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /><textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-lg border border-slate-300 p-3 text-sm" /><Select label="Priority" options={priorityOptions} value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })} /><Input id="edit-task-deadline" label="Deadline" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /><div className="flex justify-end"><Button type="submit" isLoading={update.isPending}>Simpan</Button></div></form></Modal>
    <Modal isOpen={editComment !== null} onClose={() => setEditComment(null)} title="Edit komentar"><form onSubmit={(event) => { event.preventDefault(); updateComment.mutate(); }}><textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} required className="min-h-28 w-full rounded-lg border border-slate-300 p-3 text-sm" /><div className="mt-4 flex justify-end"><Button type="submit" isLoading={updateComment.isPending}>Simpan</Button></div></form></Modal>
    <ConfirmDialog isOpen={confirmDelete} title="Hapus task" message="Task beserta comment, approval, dan attachment akan dihapus." onClose={() => setConfirmDelete(false)} onConfirm={() => remove.mutate()} isLoading={remove.isPending} />
    <ConfirmDialog isOpen={deleteComment !== null} title="Hapus komentar" message="Komentar dan balasan terkait akan dihapus." onClose={() => setDeleteComment(null)} onConfirm={() => removeComment.mutate()} isLoading={removeComment.isPending} />
    <ConfirmDialog isOpen={deleteAttachment !== null} title="Hapus attachment" message={`Hapus ${deleteAttachment?.original_name ?? 'attachment'}?`} onClose={() => setDeleteAttachment(null)} onConfirm={() => removeAttachment.mutate()} isLoading={removeAttachment.isPending} />
  </div>;
}

const priorityOptions = [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }];
function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div><p className="text-xs font-medium uppercase text-slate-400">{label}</p><p className="mt-1 flex items-center gap-2 text-sm font-medium">{icon}{value}</p></div>; }
