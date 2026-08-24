import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi, type TaskPayload } from '@/api/tasks';
import type { TaskFilters } from '@/types';

export function useTasks(projectId: number, filters: TaskFilters) {
  return useQuery({
    queryKey: ['projects', projectId, 'tasks', filters],
    queryFn: () => tasksApi.list(projectId, filters),
    enabled: Boolean(projectId),
  });
}

export function useTask(id: number) {
  return useQuery({ queryKey: ['tasks', id], queryFn: () => tasksApi.get(id), enabled: Boolean(id) });
}

export function useTaskMutations(projectId?: number) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  return {
    createTask: useMutation({
      mutationFn: (payload: TaskPayload) => tasksApi.create(projectId!, payload),
      onSuccess: invalidate,
    }),
    updateTask: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: TaskPayload }) => tasksApi.update(id, payload),
      onSuccess: invalidate,
    }),
    deleteTask: useMutation({ mutationFn: tasksApi.remove, onSuccess: invalidate }),
  };
}
