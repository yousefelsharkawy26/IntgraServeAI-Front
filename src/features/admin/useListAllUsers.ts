import { listAllUsersResponseT } from '@/schema/admin/listAllUsersSchema';
import listAllUsers from '@/services/admin/apiListAllUsers';
import { useQuery } from '@tanstack/react-query';

const useListAllUsers = (page: number = 1, limit: number = 10) => {
  const {
    data: dataListAllUsers,
    isPending: isLoadingListAllUsers,
    error: errorListAllUsers,
    isError: isErrorListAllUsers,
    refetch: refetchListAllUsers,
  } = useQuery<listAllUsersResponseT, Error>({
    queryKey: ['listAllUsers', page, limit],
    queryFn: () => listAllUsers(page, limit),
    placeholderData: undefined,
  });

  return {
    dataListAllUsers,
    isLoadingListAllUsers,
    isErrorListAllUsers,
    errorListAllUsers,
    refetchListAllUsers,
  };
};

export { useListAllUsers };
