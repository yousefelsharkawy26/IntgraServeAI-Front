import getUserLogs, { IUserLogsParams } from '@/services/admin/apiUserLogs';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query'; // Optional: helpful for pagination

const useUserLogs = ({
  page = 1,
  limit = 10,
  sort_by,
  search = '',
  userId,
}: IUserLogsParams) => {
  const {
    data: dataUserLogs,
    isPending: isLoadingUserLogs,
    error: errorUserLogs,
  } = useQuery({
    // We include page and limit in the key so the query refetches when they change
    queryKey: ['userLogs', userId, page, limit, sort_by, search],
    queryFn: () => getUserLogs({ limit, page, userId, search, sort_by }),
    // Optional: This keeps the old data visible while fetching the new page (prevents flickering)
    placeholderData: keepPreviousData,
    // Optional: Only run query if userId exists
    enabled: !!userId,
  });

  return {
    dataUserLogs,
    isLoadingUserLogs,
    errorUserLogs,
  };
};

export { useUserLogs };
