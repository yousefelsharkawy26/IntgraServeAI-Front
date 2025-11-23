import { createUserRequestT } from '@/schema/admin/createUserSchema';
import createUser from '@/services/admin/apiCreateUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useCreateUser = () => {
  const queryClient = useQueryClient();
  const {
    mutate: mutateCreateUser,
    isPending: isLoadingCreateUser,
    error: errorCreateUser,
  } = useMutation({
    mutationFn: (data: createUserRequestT) => createUser(data),

    onSuccess: (data) => {
      console.log('data', data);

      queryClient.invalidateQueries({
        queryKey: ['createUser'],
      });
    },
  });

  return {
    mutateCreateUser,
    isLoadingCreateUser,
    errorCreateUser,
  };
};

export { useCreateUser };
