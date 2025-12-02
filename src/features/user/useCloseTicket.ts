import closeTicket from '@/services/user/apiCloseTicket';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const useCloseTicket = () => {
  const queryClient = useQueryClient();

  const {
    mutate: close,
    isPending: isClosing,
    error: closeError,
  } = useMutation({
    mutationFn: closeTicket,
    
    onSuccess: (data) => {
      toast.success("Ticket closed permanently.");
      
      queryClient.invalidateQueries({ queryKey: ['ticketDetails', data.ticket_id] });
      queryClient.invalidateQueries({ queryKey: ['allTickets'] });
    },
    
    onError: (error) => {
      toast.error(error.message); 
    },
  });

  return {
    close,
    isClosing,
    closeError,
  };
};

export { useCloseTicket };