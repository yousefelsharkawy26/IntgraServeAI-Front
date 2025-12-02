import reassignTicket from '@/services/user/apiReassignTicket';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const useReassignTicket = () => {
  const queryClient = useQueryClient();

  const {
    mutate: reassign,
    isPending: isReassigning,
    error: reassignError,
  } = useMutation({
    mutationFn: reassignTicket,
    
    onSuccess: (data) => {
      toast.success(data.message);
      
      queryClient.invalidateQueries({ queryKey: ['ticketDetails', data.ticket_id] });
      queryClient.invalidateQueries({ queryKey: ['allTickets'] });
    },
    
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    reassign,
    isReassigning,
    reassignError,
  };
};

export { useReassignTicket };