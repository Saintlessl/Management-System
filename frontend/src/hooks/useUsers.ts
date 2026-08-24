import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, type UserFilters, type UserPayload } from '@/api/users';

export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersApi.list(filters),
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const createUser = useMutation({ mutationFn: (payload: UserPayload) => usersApi.create(payload), onSuccess: invalidate });
  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<UserPayload> }) => usersApi.update(id, payload),
    onSuccess: invalidate,
  });
  const deleteUser = useMutation({ mutationFn: usersApi.remove, onSuccess: invalidate });

  return { createUser, updateUser, deleteUser };
}
