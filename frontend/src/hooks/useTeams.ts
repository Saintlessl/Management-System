import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teamsApi, type TeamMemberPayload, type TeamPayload } from '@/api/teams';

export function useTeams(enabled = true) {
  return useQuery({ queryKey: ['teams'], queryFn: teamsApi.list, enabled });
}

export function useTeam(id: number) {
  return useQuery({ queryKey: ['teams', id], queryFn: () => teamsApi.get(id), enabled: Boolean(id) });
}

export function useTeamMembers(id: number) {
  return useQuery({ queryKey: ['teams', id, 'members'], queryFn: () => teamsApi.members(id), enabled: Boolean(id) });
}

export function useTeamUserOptions(enabled = true) {
  return useQuery({ queryKey: ['project-user-options'], queryFn: teamsApi.userOptions, enabled });
}

export function useTeamMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['teams'] });

  return {
    createTeam: useMutation({ mutationFn: (payload: TeamPayload) => teamsApi.create(payload), onSuccess: invalidate }),
    updateTeam: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<TeamPayload> }) => teamsApi.update(id, payload), onSuccess: invalidate }),
    deleteTeam: useMutation({ mutationFn: teamsApi.remove, onSuccess: invalidate }),
  };
}

export function useTeamMemberMutations(teamId: number) {
  const client = useQueryClient();
  const invalidate = () => {
    client.invalidateQueries({ queryKey: ['teams', teamId] });
    client.invalidateQueries({ queryKey: ['teams'] });
  };

  return {
    addMember: useMutation({ mutationFn: (payload: TeamMemberPayload) => teamsApi.addMember(teamId, payload), onSuccess: invalidate }),
    updateMember: useMutation({ mutationFn: ({ memberId, payload }: { memberId: number; payload: TeamMemberPayload }) => teamsApi.updateMember(teamId, memberId, payload), onSuccess: invalidate }),
    removeMember: useMutation({ mutationFn: (memberId: number) => teamsApi.removeMember(teamId, memberId), onSuccess: invalidate }),
  };
}
