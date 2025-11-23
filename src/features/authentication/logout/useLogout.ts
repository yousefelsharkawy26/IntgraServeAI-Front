import { logoutUser } from '@/services/apiAuth';
import { deleteCookie } from '@/utils/TS-Cookie';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const useLogout = () => {
  const queryClient = useQueryClient();

  const {
    mutate: mutateLogout,
    isPending: isLoadingLogout,
    error: errorLogout,
  } = useMutation({
    mutationFn: () => logoutUser(),

    onSuccess: (data) => {
      toast.success(data.message);
      console.log('logout-data-success', data);
      deleteCookie({ name: 'token' }); // this solved the logout issue
      queryClient.setQueryData(['user'], data);
      queryClient.invalidateQueries(); // this solved the logout issue
    },
  });

  return { mutateLogout, isLoadingLogout, errorLogout };
};

export default useLogout;
