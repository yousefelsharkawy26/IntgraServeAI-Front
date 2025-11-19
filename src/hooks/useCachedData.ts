import { QueryKey, useQueryClient } from '@tanstack/react-query';

type CachedDataT<T> = {
  cachedData: T | undefined;
  isLoading: boolean;
};

const useCachedData = <T>(queryKey: QueryKey): CachedDataT<T> => {
  const queryClient = useQueryClient();
  const cachedData = queryClient.getQueryData<T>(queryKey);

  const queryState = queryClient.getQueryState(queryKey);
  const isLoading = queryState?.status === 'pending';
  return { cachedData, isLoading };
};

export { useCachedData };
