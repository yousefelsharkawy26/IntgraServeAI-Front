import cancelTicket from '@/services/user/apiCancelTicket';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const useCancelTicket = () => {
  const queryClient = useQueryClient();

  const {
    mutate: cancel,
    isPending: isCanceling,
    error: cancelError,
  } = useMutation({
    mutationFn: cancelTicket,
    
    onSuccess: (data) => {
      toast.success("Ticket has been canceled.");
      
      // Refresh relevant data
      queryClient.invalidateQueries({ queryKey: ['ticketDetails', data.ticket_id] });
      queryClient.invalidateQueries({ queryKey: ['allTickets'] });
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
    },
    
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    cancel,
    isCanceling,
    cancelError,
  };
};

export { useCancelTicket };