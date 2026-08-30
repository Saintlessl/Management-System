import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 4, name: 'Manager Demo', email: 'manager@example.com' },
    hasPermission: (permission: string) => ['project.view', 'task.view'].includes(permission),
    hasRole: (role: string) => role === 'project-manager',
  }),
}));

vi.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({ data: { data: [] }, isLoading: false }),
}));

vi.mock('@/api/operations', () => ({
  operationsApi: {
    dashboard: vi.fn().mockResolvedValue({
      success: true,
      message: '',
      data: {
        role: 'project-manager',
        active_projects: 1,
        completed_projects: 0,
        total_projects: 1,
        total_tasks: 0,
        done_tasks: 0,
        in_progress_tasks: 0,
        overdue_tasks: 0,
        due_soon_tasks: 0,
        overdue_projects: 0,
        assigned_tasks: 0,
        completion_percentage: 0,
        tasks_by_status: { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 },
        upcoming_deadlines: [],
        team_workload: [],
        recent_activities: [],
        recent_messages: [],
      },
    }),
  },
}));

describe('DashboardPage', () => {
  it('opens with a personal workspace overview instead of a generic heading', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Selamat datang, Manager' })).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-hero')).toBeInTheDocument();
    expect(screen.getByText('Project Manager')).toBeInTheDocument();
  });
});