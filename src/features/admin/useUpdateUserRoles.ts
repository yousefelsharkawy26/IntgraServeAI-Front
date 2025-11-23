import { updateUserRolesRequestT } from '@/schema/admin/updateUserRolesSchema';
import updateUserRoles from '@/services/admin/apiUpdateUserRoles';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useUpdateUserRoles = (userId: string | null) => {
  const queryClient = useQueryClient();
  const {
    mutate: mutateUpdateUserRoles,
    isPending: isLoadingUpdateUserRoles,
    isError: isErrorUpdateUserRoles,
    error: errorUpdateUserRoles,
  } = useMutation({
    mutationFn: (data: updateUserRolesRequestT) =>
      updateUserRoles(userId!, data),
    onSuccess: (data) => {
      console.log('data', data);

      queryClient.invalidateQueries({
        queryKey: ['updateUserRoles'],
      });
    },
  });

  return {
    mutateUpdateUserRoles,
    isLoadingUpdateUserRoles,
    isErrorUpdateUserRoles,
    errorUpdateUserRoles,
  };
};

export { useUpdateUserRoles };
