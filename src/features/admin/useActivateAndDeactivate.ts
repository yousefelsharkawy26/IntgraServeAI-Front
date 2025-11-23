import activateAndDeactivate, {
  IParamsActivateAndDeactivate,
} from '@/services/admin/apiActivateAndDeactivate';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useActivateAndDeactivate = () => {
  const queryClient = useQueryClient();
  const {
    mutate: mutateActivateAndDeactivate,
    isPending: isLoadingActivateAndDeactivate,
    isError: isErrorActivateAndDeactivate,
    error: errorActivateAndDeactivate,
  } = useMutation({
    mutationFn: ({ activeType, data }: IParamsActivateAndDeactivate) =>
      activateAndDeactivate({ activeType, data }),
    onSuccess: (data) => {
      console.log('data', data);

      queryClient.invalidateQueries({
        queryKey: ['activateAndDeactivate'],
      });
    },
  });
  return {
    mutateActivateAndDeactivate,
    isLoadingActivateAndDeactivate,
    isErrorActivateAndDeactivate,
    errorActivateAndDeactivate,
  };
};

export { useActivateAndDeactivate };
