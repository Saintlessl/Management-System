import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi, type RolePayload } from '@/api/roles';

export function useRoles(enabled = true) {
  return useQuery({ queryKey: ['roles'], queryFn: rolesApi.list, enabled });
}

export function useRoleOptions(enabled = true) {
  return useQuery({ queryKey: ['role-options'], queryFn: rolesApi.options, enabled });
}

export function usePermissions(enabled = true) {
  return useQuery({ queryKey: ['permissions'], queryFn: rolesApi.permissions, enabled });
}

export function useRoleMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] });
    queryClient.invalidateQueries({ queryKey: ['role-options'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const createRole = useMutation({ mutationFn: (payload: RolePayload) => rolesApi.create(payload), onSuccess: invalidate });
  const updateRole = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<RolePayload> }) => rolesApi.update(id, payload),
    onSuccess: invalidate,
  });
  const deleteRole = useMutation({ mutationFn: rolesApi.remove, onSuccess: invalidate });

  return { createRole, updateRole, deleteRole };
}
