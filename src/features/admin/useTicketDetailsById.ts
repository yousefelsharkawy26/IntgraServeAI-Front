import ticketDetailsById, {
  ITicketDetailsByIdParams,
} from '@/services/admin/apiTicketDetailsById';
import { useQuery } from '@tanstack/react-query';

const useTicketDetailsById = ({ ticket_id }: ITicketDetailsByIdParams) => {
  const {
    data: dataTicketDetailsById,
    isPending: isLoadingTicketDetailsById,
    error: errorTicketDetailsById,
  } = useQuery({
    queryKey: ['ticketDetailsById', ticket_id],
    queryFn: () => ticketDetailsById({ ticket_id }),
  });

  return {
    dataTicketDetailsById,
    isLoadingTicketDetailsById,
    errorTicketDetailsById,
  };
};

export { useTicketDetailsById };
