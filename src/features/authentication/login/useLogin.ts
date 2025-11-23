import { LoginFormT } from '@/schema/loginSchema';
import { loginUser } from '@/services/apiAuth';
import { setCookie } from '@/utils/TS-Cookie';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';

const useLogin = () => {
  const queryClient = useQueryClient();

  const {
    mutate: mutateLogin,
    isPending: isLoadingLogin,
    error: errorLogin,
  } = useMutation({
    mutationFn: (data: LoginFormT) => loginUser(data),

    onSuccess: (data) => {
      if ('token' in data) {
        // toast.success('تم تسجيل الدخول بنجاح');
        setCookie({ name: 'token', value: data.token, days: 7 });
        console.log('data mutation hook', data);
        queryClient.invalidateQueries({
          queryKey: ['user', data.token],
        });
      }
    },

    onError: (error) => {
      //   toast.error(error.message);
      console.log(error);
    },
  });

  return {
    mutateLogin,
    isLoadingLogin,
    errorLogin,
  };
};

export { useLogin };
