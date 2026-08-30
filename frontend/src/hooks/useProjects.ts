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

export function useProjectCompletionApprovals(id: number) {
  return useQuery({ queryKey: ['projects', id, 'completion-approvals'], queryFn: () => projectsApi.completionApprovals(id), enabled: Boolean(id) });
}

export function useProjectLabels(id: number) {
  return useQuery({ queryKey: ['projects', id, 'labels'], queryFn: () => projectsApi.labels(id), enabled: Boolean(id) });
}

export function useProjectMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['projects'] });
  const invalidateProject = (id: number) => {
    invalidate();
    queryClient.invalidateQueries({ queryKey: ['projects', id, 'completion-approvals'] });
  };

  return {
    createProject: useMutation({ mutationFn: (payload: ProjectPayload) => projectsApi.create(payload), onSuccess: invalidate }),
    updateProject: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<ProjectPayload> }) => projectsApi.update(id, payload),
      onSuccess: (_, { id }) => invalidateProject(id),
    }),
    deleteProject: useMutation({ mutationFn: projectsApi.remove, onSuccess: invalidate }),
    submitCompletion: useMutation({ mutationFn: ({ id, comment }: { id: number; comment?: string }) => projectsApi.submitCompletion(id, comment), onSuccess: (_, { id }) => invalidateProject(id) }),
    approveCompletion: useMutation({ mutationFn: ({ id, comment }: { id: number; comment?: string }) => projectsApi.approveCompletion(id, comment), onSuccess: (_, { id }) => invalidateProject(id) }),
    requestCompletionRevision: useMutation({ mutationFn: ({ id, comment }: { id: number; comment: string }) => projectsApi.requestCompletionRevision(id, comment), onSuccess: (_, { id }) => invalidateProject(id) }),
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
