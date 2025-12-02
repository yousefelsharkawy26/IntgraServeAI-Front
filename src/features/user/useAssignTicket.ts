import assignTicketToMe from '@/services/user/apiAssignTicket';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner'; 

const useAssignTicket = () => {
  const queryClient = useQueryClient();

  const {
    mutate: assignTicket,
    isPending: isAssigning,
    error: assignError,
  } = useMutation({
    mutationFn: (ticketId: string) => assignTicketToMe(ticketId),
    
    onSuccess: (data) => {
      toast.success(data.message);

      queryClient.invalidateQueries({ queryKey: ['unassignedTickets'] });
      
      queryClient.invalidateQueries({ queryKey: ['allTickets'] });
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
    },
    
    onError: (error) => {
      toast.error(error.message); 
    },
  });

  return {
    assignTicket,
    isAssigning,
    assignError,
  };
};

export { useAssignTicket };