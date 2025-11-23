import { userActivityResponseT } from '@/schema/admin/userActivitySchema';
import userActivity, {
  IUserActivityParams,
} from '@/services/admin/apiUserActivity';
import { useQuery } from '@tanstack/react-query';

const useUserActivityUsers = ({
  limit = 10,
  page = 1,
  sort_by = 'last_login',
}: IUserActivityParams) => {
  const {
    data: dataUserActivityUsers,
    isPending: isLoadingUserActivityUsers,
    error: errorUserActivityUsers,
    isError: isErrorUserActivityUsers,
    refetch: refetchUserActivityUsers,
  } = useQuery<userActivityResponseT, Error>({
    queryKey: ['userActivity', page, limit, sort_by],
    queryFn: () => userActivity({ limit, page, sort_by }),
    placeholderData: undefined,
  });

  return {
    dataUserActivityUsers,
    isLoadingUserActivityUsers,
    isErrorUserActivityUsers,
    errorUserActivityUsers,
    refetchUserActivityUsers,
  };
};

export { useUserActivityUsers };
