import updateTicketStatus from '@/services/user/apiUpdateTicketStatus';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  const {
    mutate: updateStatus,
    isPending: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: updateTicketStatus,
    
    onSuccess: (data) => {
      toast.success(`Status updated to ${data.new_status}`);
      
      queryClient.invalidateQueries({ queryKey: ['ticketDetails', data.ticket_id] });
      queryClient.invalidateQueries({ queryKey: ['allTickets'] });
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
    },
    
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    updateStatus,
    isUpdating,
    updateError,
  };
};

export { useUpdateTicketStatus };