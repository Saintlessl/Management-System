import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { AppLayout } from '@/components/layout/AppLayout';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { LoginPage } from '@/pages/auth/LoginPage';

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage').then((module) => ({ default: module.NotificationsPage })));
const ProjectsPage = lazy(() => import('@/pages/projects/ProjectsPage').then((module) => ({ default: module.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('@/pages/projects/ProjectDetailPage').then((module) => ({ default: module.ProjectDetailPage })));
const ProjectMembersPage = lazy(() => import('@/pages/projects/ProjectMembersPage').then((module) => ({ default: module.ProjectMembersPage })));
const ProjectLabelsPage = lazy(() => import('@/pages/projects/ProjectLabelsPage').then((module) => ({ default: module.ProjectLabelsPage })));
const ProjectTasksPage = lazy(() => import('@/pages/tasks/ProjectTasksPage').then((module) => ({ default: module.ProjectTasksPage })));
const MyTasksPage = lazy(() => import('@/pages/tasks/MyTasksPage').then((module) => ({ default: module.MyTasksPage })));
const ApprovalsPage = lazy(() => import('@/pages/tasks/ApprovalsPage').then((module) => ({ default: module.ApprovalsPage })));
const KanbanPage = lazy(() => import('@/pages/tasks/KanbanPage').then((module) => ({ default: module.KanbanPage })));
const TaskDetailPage = lazy(() => import('@/pages/tasks/TaskDetailPage').then((module) => ({ default: module.TaskDetailPage })));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage').then((module) => ({ default: module.UsersPage })));
const RolesPage = lazy(() => import('@/pages/admin/RolesPage').then((module) => ({ default: module.RolesPage })));
const PermissionsPage = lazy(() => import('@/pages/admin/PermissionsPage').then((module) => ({ default: module.PermissionsPage })));
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage').then((module) => ({ default: module.AuditLogsPage })));
const TeamsPage = lazy(() => import('@/pages/teams/TeamsPage').then((module) => ({ default: module.TeamsPage })));
const ChatPage = lazy(() => import('@/pages/chat/ChatPage').then((module) => ({ default: module.ChatPage })));

function LoadingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="rounded-xl border border-border bg-surface px-5 py-4 text-sm text-foreground-muted shadow-sm">
        Memuat halaman...
      </div>
    </main>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route element={<ProtectedRoute />}><Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} /><Route path="/dashboard" element={<DashboardPage />} />
            <Route element={<ProtectedRoute permission="notification.view" />}><Route path="/notifications" element={<NotificationsPage />} /></Route>
            <Route element={<ProtectedRoute permission="project.view" />}><Route path="/projects" element={<ProjectsPage />} /><Route path="/projects/:id" element={<ProjectDetailPage />} /><Route path="/projects/:id/members" element={<ProjectMembersPage />} /><Route path="/projects/:id/labels" element={<ProjectLabelsPage />} /><Route path="/projects/:id/tasks" element={<ProjectTasksPage />} /><Route path="/projects/:id/kanban" element={<KanbanPage />} /></Route>
            <Route element={<ProtectedRoute permission="task.view" />}><Route path="/my-tasks" element={<MyTasksPage />} /><Route path="/tasks/:id" element={<TaskDetailPage />} /></Route>
            <Route element={<ProtectedRoute permission="task.approve" />}><Route path="/approvals" element={<ApprovalsPage />} /></Route>
            <Route element={<ProtectedRoute permission="team.view" />}><Route path="/teams" element={<TeamsPage />} /></Route>
            <Route element={<ProtectedRoute permission="chat.view" />}><Route path="/chat" element={<ChatPage />} /><Route path="/chat/:id" element={<ChatPage />} /></Route>
            <Route element={<ProtectedRoute permission="users.view" />}><Route path="/admin/users" element={<UsersPage />} /></Route>
            <Route element={<ProtectedRoute permission="roles.view" />}><Route path="/admin/roles" element={<RolesPage />} /></Route>
            <Route element={<ProtectedRoute permission="permissions.view" />}><Route path="/admin/permissions" element={<PermissionsPage />} /></Route>
            <Route element={<ProtectedRoute permission="audit.view" />}><Route path="/admin/audit-logs" element={<AuditLogsPage />} /></Route>
          </Route></Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
}

export default App;
