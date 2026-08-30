import { type ElementType } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileCheck,
  FolderKanban,
  ListTodo,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { operationsApi } from '@/api/operations';
import { StatCard } from '@/components/ui/StatCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton, StatRowSkeleton } from '@/components/ui/Skeleton';
import { Panel, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { StatusBadge, PriorityBadge, Badge } from '@/components/ui/Badge';
import { UserCell } from '@/components/ui/Avatar';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/Table';
import { useProjects } from '@/hooks/useProjects';
import { getStatusDotClass as statusDotClass, getStatusStroke as statusStroke } from '@/utils/statusColors';
import type { TaskStatus } from '@/types';
import { cn, formatDate, formatRelativeTime } from '@/utils';
import { useAuth } from '@/hooks/useAuth';

/*
  One colour per task status, shared by the donut and its legend — dots use
  theme token classes, SVG strokes resolve live via statusStroke().
*/
const STATUS_META: { key: TaskStatus; label: string }[] = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];

export function DashboardPage() {
  const { user, hasPermission, hasRole } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: operationsApi.dashboard,
  });

  // Shares the query cache with the Projects page.
  const recentProjectsQuery = useProjects({ page: 1, per_page: 5 });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-80" />
        </div>
        <StatRowSkeleton />
        <div className="grid gap-5 xl:grid-cols-12">
          <Skeleton className="h-72 rounded-xl xl:col-span-8" />
          <Skeleton className="h-72 rounded-xl xl:col-span-4" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Dashboard gagal dimuat"
        message="Tidak dapat mengambil ringkasan proyek dan tugas dari server."
        onRetry={() => refetch()}
      />
    );
  }

  const stats = data.data;
  const role = stats.role ?? (hasRole('super-admin') ? 'super-admin' : hasRole('project-manager') ? 'project-manager' : hasRole('viewer') ? 'viewer' : 'member');
  const isSuperAdmin = role === 'super-admin';
  const isProjectManager = role === 'project-manager';
  const isViewer = role === 'viewer';
  const showTeamWorkload = isSuperAdmin || isProjectManager;
  const showRecentActivity = isSuperAdmin;
  const canViewProjects = hasPermission('project.view');
  const canViewMyTasks = hasPermission('task.view');

  const totalTasks = stats.total_tasks ?? 0;
  const doneTasks = stats.done_tasks ?? 0;
  const inProgressTasks = stats.in_progress_tasks ?? 0;
  const overdueTasks = stats.overdue_tasks ?? 0;
  const dueSoon = stats.due_soon_tasks ?? 0;
  const overdueProjects = stats.overdue_projects ?? 0;
  const activeProjects = stats.active_projects ?? 0;
  const completedProjects = stats.completed_projects ?? 0;
  const totalProjects = stats.total_projects ?? 0;
  const assignedTasks = stats.assigned_tasks ?? 0;
  const pendingApprovals = stats.pending_approvals ?? null;
  const pendingProjectApprovals = stats.pending_project_approvals ?? null;
  const revisionRequestedProjects = stats.revision_requested_projects ?? 0;
  const recentMessages = stats.recent_messages ?? [];
  const completionRate =
    stats.completion_percentage ?? (totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0);

  const byStatus = stats.tasks_by_status;
  const deadlines = stats.upcoming_deadlines ?? [];
  const workload = stats.team_workload ?? [];
  const activities = stats.recent_activities ?? [];

  const recentProjects = recentProjectsQuery.data?.data ?? [];

  const todayLabel = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? 'Pengguna';

  const roleLabel = isSuperAdmin ? 'Super Admin' : isProjectManager ? 'Project Manager' : isViewer ? 'Viewer' : 'Member';
  const roleDescription = isSuperAdmin
    ? 'Ringkasan sistem, proyek, dan aktivitas global.'
    : isProjectManager
      ? 'Ringkasan proyek yang Anda kelola dan item yang perlu ditindaklanjuti.'
      : isViewer
        ? 'Ringkasan proyek yang dapat Anda akses dan pembaruan terkini.'
        : 'Ringkasan tugas, proyek, dan progres pribadi Anda.';

  return (
    <div className="space-y-5 sm:space-y-6">
      <section
        data-testid="dashboard-hero"
        className="dashboard-hero rise-in relative overflow-hidden rounded-2xl border border-white/10 px-5 py-6 text-white shadow-[0_24px_64px_-36px_rgba(31,36,99,0.78)] sm:px-7 sm:py-7"
      >
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-medium text-indigo-50 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-cyan-300" aria-hidden="true" />
              {roleLabel}
            </div>
            <h1 className="mt-4 text-[1.75rem] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[2rem]">
              Selamat datang, {firstName}
            </h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-indigo-100/70 sm:text-sm">
              {roleDescription}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-white/10 bg-white/7 px-3.5 py-3 backdrop-blur-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-cyan-200">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-[10px] font-medium tracking-[0.12em] text-indigo-100/55 uppercase">Hari ini</span>
              <span className="mt-0.5 block text-xs font-medium text-white sm:text-[13px]">{todayLabel}</span>
            </span>
          </div>
        </div>
      </section>

      <section className={cn('grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4', 'rise-in rise-in-1')}>
        {canViewProjects && (
          <StatCard
            label="Proyek aktif"
            value={activeProjects}
            icon={FolderKanban}
            detail={`${totalProjects} total · ${completedProjects} selesai`}
            to="/projects?status=active"
          />
        )}
        {canViewMyTasks && (
          <>
            <StatCard
              label="Tugas berjalan"
              value={inProgressTasks}
              icon={ListTodo}
              detail={`${totalTasks} total · ${assignedTasks} tugas saya`}
              to="/my-tasks"
            />
            <StatCard
              label="Tugas terlambat"
              value={overdueTasks}
              icon={AlertTriangle}
              tone={overdueTasks > 0 ? 'danger' : 'default'}
              detail={dueSoon > 0 ? `${dueSoon} jatuh tempo ≤3 hari` : 'Tidak ada tenggat dekat'}
              to="/my-tasks?deadline=overdue"
            />
            <StatCard
              label="Penyelesaian"
              value={`${completionRate}%`}
              icon={CheckCircle2}
              detail={`${doneTasks} dari ${totalTasks} tugas tuntas`}
            />
          </>
        )}
        {!canViewProjects && !canViewMyTasks && (
          <StatCard
            label="Proyek aktif"
            value={activeProjects}
            icon={FolderKanban}
            detail={`${totalProjects} total · ${completedProjects} selesai`}
            to="/projects"
          />
        )}
      </section>

      {/* Row 1: distribution (donut + legend) + attention queue */}
      <div className="grid gap-5 xl:grid-cols-12">
        <Panel className={cn('xl:col-span-8', 'rise-in rise-in-1')}>
          <CardHeader
            actions={
              <Link
                to="/notifications"
                className="hidden text-[13px] font-medium text-primary hover:text-primary hover:underline sm:inline-flex"
              >
                Kelola notifikasi
              </Link>
            }
          >
            <CardTitle>Distribusi tugas</CardTitle>
            <CardDescription>Sebaran seluruh tugas berdasarkan status kerja.</CardDescription>
          </CardHeader>

          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
            {byStatus && totalTasks > 0 ? (
              <StatusDonut counts={byStatus} total={totalTasks} />
            ) : (
              <p className="text-[13px] text-foreground-muted">Belum ada data tugas untuk ditampilkan.</p>
            )}

            {byStatus && (
              <dl className="flex-1 space-y-2.5 self-stretch">
                {STATUS_META.map(({ key, label }) => {
                  const count = byStatus[key as keyof typeof byStatus] ?? 0;
                  const share = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                  return (
                    <div key={key} className="flex items-center gap-2.5 text-[13px]">
                      <span
                        className={cn('h-2 w-2 shrink-0 rounded-full', statusDotClass(key))}
                        aria-hidden="true"
                      />
                      <dt className="flex-1 text-foreground-muted">{label}</dt>
                      <dd className="text-foreground-muted/80 tabular-nums">{share}%</dd>
                      <dd className="w-10 text-right font-medium text-foreground tabular-nums">
                        {count}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </div>

          {(overdueTasks > 0 || dueSoon > 0 || overdueProjects > 0 || pendingApprovals !== null) && (
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-[13px]">
              {(overdueTasks > 0 || dueSoon > 0 || overdueProjects > 0) && (
                <span className="inline-flex items-center gap-2 text-danger">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {overdueTasks > 0 && <><strong>{overdueTasks}</strong> tugas terlambat</>}
                    {overdueTasks > 0 && dueSoon > 0 && ' · '}
                    {dueSoon > 0 && <><strong>{dueSoon}</strong> jatuh tempo ≤3 hari</>}
                    {((overdueTasks > 0 || dueSoon > 0) && overdueProjects > 0) && ' · '}
                    {overdueProjects > 0 && <><strong>{overdueProjects}</strong> proyek lewat tenggat</>}
                  </span>
                </span>
              )}
              {pendingApprovals !== null && (
                <Link to="/approvals" className="font-medium text-primary hover:underline">
                  {pendingApprovals} menunggu persetujuan
                </Link>
              )}
            </div>
          )}
        </Panel>

        {/* Attention queue: only rows that represent real, actionable counts. */}
        <Panel className={cn('xl:col-span-4', 'rise-in rise-in-1')}>
          <CardHeader>
            <CardTitle>Perlu ditindaklanjuti</CardTitle>
            <CardDescription>Keterlambatan dan tenggat yang mendekat.</CardDescription>
          </CardHeader>

          <dl className="mt-4 divide-y divide-border border-t border-border">
            <AttentionRow icon={AlertTriangle} label="Tugas terlambat" value={overdueTasks} tone={overdueTasks > 0 ? 'danger' : 'default'} />
            <AttentionRow icon={CalendarClock} label="Jatuh tempo ≤3 hari" value={dueSoon} tone={dueSoon > 0 ? 'warning' : 'default'} />
            <AttentionRow icon={FolderKanban} label="Proyek terlambat" value={overdueProjects} tone={overdueProjects > 0 ? 'danger' : 'default'} />
            {pendingProjectApprovals !== null && pendingProjectApprovals > 0 && (
              <AttentionRow icon={FileCheck} label="Persetujuan proyek" value={pendingProjectApprovals} tone="warning" />
            )}
            {revisionRequestedProjects > 0 && (
              <AttentionRow icon={Clock} label="Proyek perlu revisi" value={revisionRequestedProjects} tone="warning" />
            )}
          </dl>

          {deadlines.length === 0 && (
            <p className="mt-4 text-[13px] text-foreground-muted">Semua pekerjaan dalam tenggat.</p>
          )}
        </Panel>
      </div>

      {/* Row 2: recent projects table + upcoming deadlines */}
      <div className="grid gap-5 xl:grid-cols-12">
        <Panel flush className={cn('xl:col-span-8', 'rise-in rise-in-2')}>
          <div className="px-5 pt-5">
            <CardHeader
              actions={
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-1 rounded text-[13px] font-medium text-primary hover:text-primary hover:underline"
                >
                  Lihat semua
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              }
            >
              <CardTitle>Proyek terbaru</CardTitle>
              <CardDescription>Lima proyek teratas beserta progres dan penanggung jawabnya.</CardDescription>
            </CardHeader>
          </div>

          {recentProjectsQuery.isLoading ? (
            <div className="space-y-3 px-5 py-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-1.5 w-full max-w-xs rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <p className="px-5 py-6 text-[13px] text-foreground-muted">
              Belum ada proyek.{' '}
              <Link to="/projects" className="font-medium text-primary hover:underline">
                Buat proyek pertama
              </Link>
              .
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto border-t border-border">
              <Table minWidth="min-w-[38rem]" className="border-separate border-spacing-0 px-0 text-[13px]">
                <THead>
                  <Tr className="hover:bg-transparent">
                    <Th>Proyek</Th>
                    <Th>Status</Th>
                    <Th className="w-36">Progres</Th>
                    <Th>Manager</Th>
                    <Th align="right">Deadline</Th>
                  </Tr>
                </THead>
                <TBody>
                  {recentProjects.map((project) => (
                    <Tr key={project.id} interactive>
                      <Td>
                        <Link
                          to={`/projects/${project.id}`}
                          className="rounded font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {project.name}
                        </Link>
                      </Td>
                      <Td><StatusBadge status={project.status} /></Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Progress value={project.progress ?? 0} label={`Progres ${project.name}`} className="w-16" />
                          <span className="shrink-0 text-xs text-foreground-muted tabular-nums">
                            {project.progress ?? 0}%
                          </span>
                        </div>
                      </Td>
                      <Td>
                        {project.manager ? (
                          <UserCell name={project.manager.name} size="xs" />
                        ) : (
                          <span className="text-foreground-muted/80">—</span>
                        )}
                      </Td>
                      <Td align="right">
                        <span className={cn('whitespace-nowrap', project.is_overdue ? 'font-medium text-danger' : 'text-foreground-muted')}>
                          {project.deadline ? formatDate(project.deadline) : '—'}
                        </span>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </Panel>

        <Panel flush className={cn('xl:col-span-4', 'rise-in rise-in-2')}>
          <div className="px-5 pt-5">
            <CardHeader>
              <CardTitle>Tenggat terdekat</CardTitle>
              <CardDescription>Enam tugas mendekati atau melewati tenggat.</CardDescription>
            </CardHeader>
          </div>

          {deadlines.length === 0 ? (
            <p className="px-5 pb-6 pt-4 text-[13px] text-foreground-muted">
              Tidak ada tugas dengan tenggat ≤14 hari.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border border-t border-border">
              {deadlines.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/tasks/${item.id}`}
                    className="block px-5 py-3 transition-colors duration-150 ease-out hover:bg-input"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate text-[13px] font-medium text-foreground">
                        {item.title}
                      </p>
                      <PriorityBadge priority={item.priority} className="shrink-0" />
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 truncate text-foreground-muted">
                        {item.project_name ?? 'Tanpa proyek'}
                      </span>
                      <DeadlineChip deadline={item.deadline} isOverdue={item.is_overdue} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Row 3: team workload + activity strip + recent messages */}
      <div className="grid gap-5 xl:grid-cols-12">
        {showTeamWorkload && workload.length > 0 && (
          <Panel flush className={cn(recentMessages.length > 0 ? 'xl:col-span-4' : 'xl:col-span-7', 'rise-in rise-in-3')}>
            <div className="px-5 pt-5">
              <CardHeader>
                <CardTitle>Beban kerja tim</CardTitle>
                <CardDescription>Tugas selesai dibanding total per anggota.</CardDescription>
              </CardHeader>
            </div>

            <ul className="mt-4 divide-y divide-border border-t border-border">
              {workload.map((entry) => {
                const share =
                  entry.total_tasks > 0
                    ? Math.round((entry.completed_tasks / entry.total_tasks) * 100)
                    : 0;
                return (
                  <li key={entry.user.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-36 min-w-0 shrink-0 sm:w-44">
                      <UserCell name={entry.user.name} secondary={entry.user.email} />
                    </div>
                    <Progress value={share} label={`${entry.user.name}: ${share}% selesai`} />
                    <span className="w-20 shrink-0 text-right text-xs text-foreground-muted tabular-nums">
                      {entry.completed_tasks}/{entry.total_tasks}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}

        {recentMessages.length > 0 && (
          <Panel flush className="xl:col-span-4 rise-in rise-in-3">
            <div className="px-5 pt-5">
              <CardHeader
                actions={
                  <Link
                    to="/chat"
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
                  >
                    Buka chat
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                }
              >
                <CardTitle>Pesan terbaru</CardTitle>
                <CardDescription>Aktivitas diskusi di tim dan proyek.</CardDescription>
              </CardHeader>
            </div>

            <ul className="mt-4 divide-y divide-border border-t border-border">
              {recentMessages.map((msg) => (
                <li key={msg.id} className="px-5 py-3">
                  <Link to="/chat" className="block hover:opacity-80 transition-opacity">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-foreground">
                        {msg.user_name ?? 'Pengguna'}
                      </span>
                      <span className="shrink-0 text-[10px] text-foreground-muted">
                        {formatRelativeTime(msg.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-foreground-muted">
                      {msg.body ?? 'Lampiran file'}
                    </p>
                    {msg.conversation_name && (
                      <span className="mt-1 inline-block text-[10px] text-primary">
                        #{msg.conversation_name}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {showRecentActivity && activities.length > 0 && (
          <Panel flush className={cn(showTeamWorkload && workload.length > 0 && recentMessages.length > 0 ? 'xl:col-span-4' : showTeamWorkload && workload.length > 0 ? 'xl:col-span-5' : 'xl:col-span-12', 'rise-in rise-in-3')}>
            <div className="px-5 pt-5">
              <CardHeader>
                <CardTitle>Aktivitas terbaru</CardTitle>
                <CardDescription>Perubahan data terakhir di workspace.</CardDescription>
              </CardHeader>
            </div>

            <ul className="mt-4 divide-y divide-border border-t border-border">
              {activities.slice(0, 6).map((activity) => (
                <li key={activity.id} className="flex items-baseline justify-between gap-3 px-5 py-2.5 text-[13px]">
                  <span className="min-w-0 truncate text-foreground">
                    <span className="font-medium text-foreground">
                      {activity.user?.name ?? 'Sistem'}
                    </span>{' '}
                    {activity.action.replaceAll('_', ' ')}{' '}
                    <Badge className="ml-0.5 hidden font-normal md:inline-flex">
                      {shortEntityType(activity.entity_type)} #{activity.entity_id}
                    </Badge>
                  </span>
                  <time className="shrink-0 text-xs text-foreground-muted/80" dateTime={activity.created_at}>
                    {formatRelativeTime(activity.created_at)}
                  </time>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
}

/*
  Compact SVG donut. Segments are stroked arcs on one circle — cheap to render,
  no chart library, and the centre shows the total so the shape answers "how
  much work exists" at a glance. Colour is decorative here; every segment is
  also named in the adjacent legend.
*/
function StatusDonut({
  counts,
  total,
}: {
  counts: Record<string, number>;
  total: number;
}) {
  const size = 148;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Precompute each segment's start position so render stays pure — the arc
  // offsets depend on every preceding segment, resolved once up front. Stroke
  // colors come from the live theme via statusStroke().
  type Segment = { key: TaskStatus; count: number; startFraction: number };
  const segments = STATUS_META.map(({ key }) => ({
    key,
    count: counts[key] ?? 0,
  }))
    .filter((segment) => segment.count > 0)
    .reduce<Segment[]>((acc, segment) => {
      const sum = acc.reduce((total, current) => total + current.count, 0);
      acc.push({ ...segment, startFraction: sum / total });
      return acc;
    }, []);

  return (
    <div className="relative shrink-0" role="img" aria-label={`Distribusi ${total} tugas`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-input"
          strokeWidth={stroke}
        />
        {segments.map(({ key, count, startFraction }) => {
          const fraction = count / total;
          const dash = fraction * circumference;
          return (
            <circle
              key={key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={statusStroke(key)}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(dash - 1, 0)} ${circumference - dash + 1}`}
              strokeDashoffset={-startFraction * circumference}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {total}
        </span>
        <span className="text-[11px] text-foreground-muted">tugas</span>
      </div>
    </div>
  );
}

function DeadlineChip({ deadline, isOverdue }: { deadline: string | null; isOverdue: boolean }) {
  if (!deadline) return <span className="text-foreground-muted/80">—</span>;

  // Computed in an effect-free helper so the component render stays pure; the
  // day boundary only shifts on remount, which is fine for a "days left" chip.
  const daysLeft = computeDaysLeft(deadline);

  if (isOverdue) return <span className="shrink-0 font-medium text-danger">Terlambat</span>;
  if (daysLeft <= 0) return <span className="shrink-0 font-medium text-warning">Hari ini</span>;
  if (daysLeft === 1) return <span className="shrink-0 text-foreground-muted">Besok</span>;

  return (
    <span className="shrink-0 whitespace-nowrap text-foreground-muted tabular-nums">
      {daysLeft} hari · {formatDate(deadline)}
    </span>
  );
}

/** Whole days from now until the end of the deadline day (local time). */
function computeDaysLeft(deadline: string) {
  const endOfDay = new Date(deadline);
  endOfDay.setHours(23, 59, 59, 999);
  return Math.ceil((endOfDay.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
}

const attentionIconTones = {
  default: 'text-foreground-muted/80',
  warning: 'text-warning',
  danger: 'text-danger',
};

const attentionValueTones = {
  default: 'text-foreground',
  warning: 'text-warning',
  danger: 'text-danger',
};

function AttentionRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ElementType;
  label: string;
  value: number;
  tone: 'default' | 'warning' | 'danger';
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon className={cn('h-4 w-4 shrink-0', attentionIconTones[tone])} aria-hidden="true" />
      <dt className="flex-1 text-[13px] text-foreground">{label}</dt>
      <dd className={cn('text-sm font-semibold tabular-nums', attentionValueTones[tone])}>{value}</dd>
    </div>
  );
}

/** Audit entity types arrive namespaced ("App\\Models\\Task") — show the bare name. */
function shortEntityType(value: string) {
  return value.split('\\').at(-1) ?? value;
}
