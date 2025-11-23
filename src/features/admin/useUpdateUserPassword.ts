import { updateUserPasswordRequestT } from '@/schema/admin/updateUserPasswordSchema';
import updateUserPassword from '@/services/admin/apiUpdateUserPassword';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useUpdateUserPassword = (userId: string | null) => {
  const queryClient = useQueryClient();
  const {
    mutate: mutateUpdateUserPassword,
    isPending: isLoadingUpdateUserPassword,
    isError: isErrorUpdateUserPassword,
    error: errorUpdateUserPassword,
  } = useMutation({
    mutationFn: (data: updateUserPasswordRequestT) =>
      updateUserPassword(userId!, data),
    onSuccess: (data) => {
      console.log('data', data);

      queryClient.invalidateQueries({
        queryKey: ['updateUserPassword'],
      });
    },
  });

  return {
    mutateUpdateUserPassword,
    isLoadingUpdateUserPassword,
    isErrorUpdateUserPassword,
    errorUpdateUserPassword,
  };
};

export { useUpdateUserPassword };
