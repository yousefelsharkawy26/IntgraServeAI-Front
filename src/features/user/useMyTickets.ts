import myTickets, { IMyTicketsParams } from '@/services/user/apiMyTickets';
import { useQuery } from '@tanstack/react-query';

const useMyTickets = ({
  page = 1,
  limit = 10,
  sort_by,
  search = '',
  status,
  priority,
}: IMyTicketsParams) => {
  const {
    data: dataMyTickets,
    isPending: isLoadingMyTickets,
    error: errorMyTickets,
  } = useQuery({
    queryKey: ['myTickets', page, limit, sort_by, search, status, priority], 
    queryFn: () => myTickets({ page, limit, sort_by, search, status, priority }),
    placeholderData: undefined, 
  });

  return {
    dataMyTickets,
    isLoadingMyTickets,
    errorMyTickets,
  };
};

export { useMyTickets };