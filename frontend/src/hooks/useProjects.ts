import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi, type ProjectMemberPayload, type ProjectPayload } from '@/api/projects';
import type { ProjectFilters } from '@/types';

export function useProjects(filters: ProjectFilters) {
  return useQuery({ queryKey: ['projects', filters], queryFn: () => projectsApi.list(filters) });
}

export function useProject(id: number) {
  return useQuery({ queryKey: ['projects', id], queryFn: () => projectsApi.get(id), enabled: Boolean(id) });
}

export function useProjectUserOptions(enabled = true) {
  return useQuery({ queryKey: ['project-user-options'], queryFn: projectsApi.userOptions, enabled });
}

export function useProjectMembers(id: number) {
  return useQuery({ queryKey: ['projects', id, 'members'], queryFn: () => projectsApi.members(id), enabled: Boolean(id) });
}

export function useProjectLabels(id: number) {
  return useQuery({ queryKey: ['projects', id, 'labels'], queryFn: () => projectsApi.labels(id), enabled: Boolean(id) });
}

export function useProjectMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['projects'] });

  return {
    createProject: useMutation({ mutationFn: (payload: ProjectPayload) => projectsApi.create(payload), onSuccess: invalidate }),
    updateProject: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<ProjectPayload> }) => projectsApi.update(id, payload),
      onSuccess: invalidate,
    }),
    deleteProject: useMutation({ mutationFn: projectsApi.remove, onSuccess: invalidate }),
  };
}

export function useProjectMemberMutations(projectId: number) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  return {
    addMember: useMutation({ mutationFn: (payload: ProjectMemberPayload) => projectsApi.addMember(projectId, payload), onSuccess: invalidate }),
    updateMember: useMutation({
      mutationFn: ({ memberId, payload }: { memberId: number; payload: ProjectMemberPayload }) => projectsApi.updateMember(projectId, memberId, payload),
      onSuccess: invalidate,
    }),
    removeMember: useMutation({ mutationFn: (memberId: number) => projectsApi.removeMember(projectId, memberId), onSuccess: invalidate }),
  };
}
