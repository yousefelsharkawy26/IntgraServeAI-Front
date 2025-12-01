import ticketsStatistics from '@/services/admin/apiTicketsStatistics';
import { useQuery } from '@tanstack/react-query';

const useTicketsStatistics = () => {
  const {
    data: dataTicketsStatistics,
    isPending: isLoadingTicketsStatistics,
    error: errorTicketsStatistics,
  } = useQuery({
    queryKey: ['ticketsStatistics'],
    queryFn: () => ticketsStatistics(),
  });

  return {
    dataTicketsStatistics,
    isLoadingTicketsStatistics,
    errorTicketsStatistics,
  };
};

export { useTicketsStatistics };
