import unassignedTickets, { IUnassignedTicketsParams } from '@/services/user/apiUnassignedTickets';
import { useQuery } from '@tanstack/react-query';

const useUnassignedTickets = ({
  page = 1,
  limit = 10,
  sort_by,
  search = '',
  priority,
}: IUnassignedTicketsParams) => {
  const {
    data: dataUnassignedTickets,
    isPending: isLoadingUnassignedTickets,
    error: errorUnassignedTickets,
  } = useQuery({
    queryKey: ['unassignedTickets', page, limit, sort_by, search, priority],
    queryFn: () => unassignedTickets({ page, limit, sort_by, search, priority }),
    placeholderData: undefined, 
  });

  return {
    dataUnassignedTickets,
    isLoadingUnassignedTickets,
    errorUnassignedTickets,
  };
};

export { useUnassignedTickets };