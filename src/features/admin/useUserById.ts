import userById from '@/services/admin/apiUserById';
import { useQuery } from '@tanstack/react-query';

const useUserById = (userId: string) => {
  const {
    data: dataUserById,
    isPending: isLoadingUserById,
    error: errorUserById,
  } = useQuery({
    queryKey: ['userById', userId],
    queryFn: () => userById(userId),
  });

  return {
    dataUserById,
    isLoadingUserById,
    errorUserById,
  };
};

export { useUserById };
