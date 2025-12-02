import resolveTicket from '@/services/user/apiResolveTicket';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const useResolveTicket = () => {
  const queryClient = useQueryClient();

  const {
    mutate: resolve,
    isPending: isResolving,
    error: resolveError,
  } = useMutation({
    mutationFn: resolveTicket,
    
    onSuccess: (data) => {
      toast.success("Ticket resolved successfully! Good job.");
      
      queryClient.invalidateQueries({ queryKey: ['ticketDetails', data.ticket_id] });
      queryClient.invalidateQueries({ queryKey: ['allTickets'] });
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
    },
    
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    resolve,
    isResolving,
    resolveError,
  };
};

export { useResolveTicket };