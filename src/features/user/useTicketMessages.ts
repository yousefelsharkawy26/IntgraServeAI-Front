import getTicketMessages from '@/services/user/apiTicketMessages';
import { useQuery } from '@tanstack/react-query';

const useTicketMessages = (ticketId: string | null, page = 1) => {
  const {
    data: dataMessages,
    isPending: isLoadingMessages,
    error: errorMessages,
  } = useQuery({
    queryKey: ['ticketMessages', ticketId, page],
    queryFn: () => getTicketMessages({ ticketId: ticketId!, page }),
    enabled: !!ticketId,
    placeholderData: (previousData) => previousData,
  });

  return {
    dataMessages,
    isLoadingMessages,
    errorMessages,
  };
};

export { useTicketMessages };