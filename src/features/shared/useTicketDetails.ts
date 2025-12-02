import getTicketDetails from '@/services/shared/apiTicketDetails';
import { useQuery } from '@tanstack/react-query';

const useTicketDetails = (ticketId: string | null) => {
  const {
    data: ticket,
    isPending: isLoadingTicket,
    error: ticketError,
  } = useQuery({
    queryKey: ['ticketDetails', ticketId],
    queryFn: () => getTicketDetails(ticketId!), 
    enabled: !!ticketId,
    retry: 1,
  });

  return {
    ticket,
    isLoadingTicket,
    ticketError,
  };
};

export { useTicketDetails };