import { type ReactNode } from 'react';
import { Columns3, ListTodo, Tags, Users, LayoutPanelLeft } from 'lucide-react';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { RouteTabs } from '@/components/ui/Tabs';
import type { Project } from '@/types';

/*
  Shared context header for every project sub-page. Keeping the name, status and
  tab strip identical across Overview / Tasks / Kanban / Members / Labels means
  the user never loses their place when moving between them.
*/
export function ProjectWorkspaceHeader({
  project,
  actions,
}: {
  project: Project;
  actions?: ReactNode;
}) {
  const id = project.id;

  return (
    <div className="space-y-4">
      <PageHeader
        title={project.name}
        description={project.description || undefined}
        breadcrumbs={[{ label: 'Projects', to: '/projects' }, { label: project.name }]}
        badge={
          <span className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            {project.is_overdue && <Badge tone="danger">Terlambat</Badge>}
          </span>
        }
      >
        {actions}
      </PageHeader>

      <RouteTabs
        tabs={[
          { to: `/projects/${id}`, label: 'Overview', icon: LayoutPanelLeft, end: true },
          {
            to: `/projects/${id}/tasks`,
            label: 'Tugas',
            icon: ListTodo,
            count: project.tasks_count,
          },
          { to: `/projects/${id}/kanban`, label: 'Kanban', icon: Columns3 },
          {
            to: `/projects/${id}/members`,
            label: 'Anggota',
            icon: Users,
            count: project.members_count,
          },
          { to: `/projects/${id}/labels`, label: 'Label', icon: Tags },
        ]}
      />
    </div>
  );
}
