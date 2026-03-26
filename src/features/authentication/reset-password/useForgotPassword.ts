import { useMutation } from '@tanstack/react-query';
import forgotPassword from '@/services/shared/apiForgotPassword';

export const useForgotPassword = () => {
  const {
    mutate: sendForgotPassword,
    isPending: isSendingForgotPassword,
    isSuccess: isForgotPasswordSent,
    isError: isForgotPasswordError,
    error: forgotPasswordError,
    reset: resetForgotPassword,
  } = useMutation({ mutationFn: (email: string) => forgotPassword(email) });

  return {
    sendForgotPassword,
    isSendingForgotPassword,
    isForgotPasswordSent,
    isForgotPasswordError,
    forgotPasswordError,
    resetForgotPassword,
  };
};
