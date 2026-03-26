import { useMutation } from '@tanstack/react-query';
import resetPassword from '@/services/shared/apiResetPassword';

export const useResetPassword = () => {
  const {
    mutate: submitResetPassword,
    isPending: isResettingPassword,
    isSuccess: isPasswordReset,
    isError: isResetError,
    error: resetError,
  } = useMutation({
    mutationFn: ({ token, new_password }: { token: string; new_password: string }) =>
      resetPassword(token, new_password),
  });

  return {
    submitResetPassword,
    isResettingPassword,
    isPasswordReset,
    isResetError,
    resetError,
  };
};
