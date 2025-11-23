import userByToken from '@/services/apiUserByToken';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

const useUserByToken = (token: string | undefined) => {
  const {
    data: dataUserByToken,
    isPending: isLoadingUserByToken,
    isFetching: isFetchingUserByToken,
    isSuccess: isSuccessUserByToken,
    isError: isErrorUserByToken,
    error: errorUserByToken,
  } = useQuery({
    queryKey: ['user', token],
    queryFn: () => userByToken(),
    retry: (failureCount, error) => {
      if ((error as AxiosError)?.response?.status === 401) {
        return false;
      }
      return failureCount < 1;
    },
  });

  return {
    dataUserByToken,
    isLoadingUserByToken,
    isFetchingUserByToken,
    isSuccessUserByToken,
    isErrorUserByToken,
    errorUserByToken,
  };
};

export { useUserByToken };
