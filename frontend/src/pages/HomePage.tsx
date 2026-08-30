import { ShieldCheck, Users, FolderKanban, FileClock, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function HomePage() {
  const { user, hasPermission, hasRole } = useAuth();
  const isSuperAdmin = hasRole('super-admin');
  const isProjectManager = hasRole('project-manager');
  const isViewer = hasRole('viewer');

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-medium text-primary">
          {isSuperAdmin ? 'Panel administrator' : isProjectManager ? 'Panel manajemen proyek' : isViewer ? 'Panel klien' : 'Workspace pribadi'}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Halo, {user?.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
          {isSuperAdmin
            ? 'Kelola pengguna, role, permission, proyek, dan pengaturan sistem dari satu tempat.'
            : isProjectManager
              ? 'Pantau proyek yang Anda kelola, tugas tim, dan item yang perlu ditindaklanjuti.'
              : isViewer
                ? 'Lihat proyek, progres, dan deliverables yang tersedia untuk Anda.'
                : 'Lihat tugas yang ditugaskan, proyek Anda, dan notifikasi terkini.'}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {hasPermission('users.view') && (
          <Link to="/admin/users" className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary-border hover:shadow-sm">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="mt-3 font-semibold">Kelola pengguna</h2>
            <p className="mt-1 text-sm text-foreground-muted">Buat akun, atur status, dan tetapkan role.</p>
          </Link>
        )}
        {(isSuperAdmin || isProjectManager) && hasPermission('project.view') && (
          <Link to="/projects" className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary-border hover:shadow-sm">
            <FolderKanban className="h-6 w-6 text-primary" />
            <h2 className="mt-3 font-semibold">{isSuperAdmin ? 'Semua proyek' : 'Proyek saya'}</h2>
            <p className="mt-1 text-sm text-foreground-muted">Kelola progres, anggota, dan tugas proyek.</p>
          </Link>
        )}
        {isViewer && hasPermission('project.view') && (
          <Link to="/projects" className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary-border hover:shadow-sm">
            <FolderKanban className="h-6 w-6 text-primary" />
            <h2 className="mt-3 font-semibold">Proyek saya</h2>
            <p className="mt-1 text-sm text-foreground-muted">Lihat progres, milestone, dan deliverables.</p>
          </Link>
        )}
        {isSuperAdmin && hasPermission('roles.view') && (
          <Link to="/admin/roles" className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary-border hover:shadow-sm">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h2 className="mt-3 font-semibold">Kelola role</h2>
            <p className="mt-1 text-sm text-foreground-muted">Susun role dan permission akses.</p>
          </Link>
        )}
        {isSuperAdmin && hasPermission('audit.view') && (
          <Link to="/admin/audit-logs" className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary-border hover:shadow-sm">
            <FileClock className="h-6 w-6 text-primary" />
            <h2 className="mt-3 font-semibold">Audit Logs</h2>
            <p className="mt-1 text-sm text-foreground-muted">Pantau aktivitas sistem dan perubahan penting.</p>
          </Link>
        )}
        {(isProjectManager || isSuperAdmin) && hasPermission('task.approve') && (
          <Link to="/approvals" className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary-border hover:shadow-sm">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <h2 className="mt-3 font-semibold">Persetujuan</h2>
            <p className="mt-1 text-sm text-foreground-muted">Review tugas yang menunggu persetujuan.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
