import { updateUserBasicRequestT } from '@/schema/admin/updateUserBasicSchema';
import updateUserBasic from '@/services/admin/apiUpdateUserBasic';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useUpdateUserBasic = (userId: string | null) => {
  const queryClient = useQueryClient();
  const {
    mutate: mutateUpdateUserBasic,
    isPending: isLoadingUpdateUserBasic,
    isError: isErrorUpdateUserBasic,
    error: errorUpdateUserBasic,
  } = useMutation({
    mutationFn: (data: updateUserBasicRequestT) =>
      updateUserBasic(userId!, data),
    onSuccess: (data) => {
      console.log('data', data);

      queryClient.invalidateQueries({
        queryKey: ['updateUserBasic'],
      });
    },
  });

  return {
    mutateUpdateUserBasic,
    isLoadingUpdateUserBasic,
    isErrorUpdateUserBasic,
    errorUpdateUserBasic,
  };
};

export { useUpdateUserBasic };
