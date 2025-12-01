import allTickets, { IAllTicketsParams } from '@/services/admin/apiAllTickets';
import { useQuery } from '@tanstack/react-query';

const useAllTickets = ({
  page = 1,
  limit = 10,
  sort_by,
  search = '',
  ...rest
}: IAllTicketsParams) => {
  const {
    data: dataAllTickets,
    isPending: isLoadingAllTickets,
    error: errorAllTickets,
  } = useQuery({
    queryKey: ['allTickets', page, limit, sort_by, search, rest],
    queryFn: () => allTickets({ page, limit, sort_by, search, ...rest }),
    placeholderData: undefined,
  });

  return {
    dataAllTickets,
    isLoadingAllTickets,
    errorAllTickets,
  };
};

export { useAllTickets };
