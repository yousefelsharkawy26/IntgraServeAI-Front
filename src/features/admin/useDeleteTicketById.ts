import deleteTicketById, {
  IDeleteTicketByIdParams,
} from '@/services/admin/apiDeleteTicketById';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useDeleteTicketById = () => {
  const queryClient = useQueryClient();
  const {
    mutate: mutateDeleteTicketById,
    isPending: isLoadingDeleteTicketById,
    error: errorDeleteTicketById,
  } = useMutation({
    mutationFn: ({ ticket_id }: IDeleteTicketByIdParams) =>
      deleteTicketById({ ticket_id }),
    onSuccess: (data) => {
      console.log('data', data);

      queryClient.invalidateQueries({
        queryKey: ['deleteTicketById'],
      });
    },
  });

  return {
    mutateDeleteTicketById,
    isLoadingDeleteTicketById,
    errorDeleteTicketById,
  };
};

export { useDeleteTicketById };
