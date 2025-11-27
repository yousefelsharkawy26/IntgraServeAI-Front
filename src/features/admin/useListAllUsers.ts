import { listAllUsersResponseT } from '@/schema/admin/listAllUsersSchema';
import listAllUsers, {
  IListAllUsersParams,
} from '@/services/admin/apiListAllUsers';
import { useQuery } from '@tanstack/react-query';

const useListAllUsers = ({
  page = 1,
  limit = 10,
  sort_by,
  search = '',
}: IListAllUsersParams) => {
  const {
    data: dataListAllUsers,
    isPending: isLoadingListAllUsers,
    error: errorListAllUsers,
    isError: isErrorListAllUsers,
    refetch: refetchListAllUsers,
  } = useQuery<listAllUsersResponseT, Error>({
    queryKey: ['listAllUsers', page, limit, search, sort_by],
    queryFn: () => listAllUsers({ limit, page, search, sort_by }),
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
