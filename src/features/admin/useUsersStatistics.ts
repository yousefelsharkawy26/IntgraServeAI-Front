import usersStatistics from '@/services/admin/apiUsersStatistics';
import { useQuery } from '@tanstack/react-query';

const useUsersStatistics = () => {
  const {
    data: dataUsersStatistics,
    isPending: isLoadingUsersStatistics,
    error: errorUsersStatistics,
  } = useQuery({
    queryKey: ['usersStatistics'],
    queryFn: () => usersStatistics(),
  });

  return {
    dataUsersStatistics,
    isLoadingUsersStatistics,
    errorUsersStatistics,
  };
};

export { useUsersStatistics };
