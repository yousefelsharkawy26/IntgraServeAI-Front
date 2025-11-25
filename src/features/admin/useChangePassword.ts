import { useMutation } from '@tanstack/react-query';
import changePassword from '@/services/admin/apiChangePassword';
import {
  changePasswordRequestT,
  changePasswordResponseT,
  changePasswordErrorResponseT,
} from '@/schema/admin/changePasswordSchema';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

const useChangePassword = () => {
  const {
    mutate: mutateChangePassword,
    isPending: isLoadingChangePassword,
    error: errorChangePassword,
    isSuccess: isSuccessChangePassword,
  } = useMutation<
    changePasswordResponseT,           // Success Type
    AxiosError<changePasswordErrorResponseT>, // Error Type
    changePasswordRequestT             // Variables Type
  >({
    mutationFn: (data) => changePassword(data),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      // The specific "Incorrect password" error is handled in the Form component.
      // We only show a toast if the error is generic or unexpected.
      if (!error.response?.data?.message) {
        toast.error('An unexpected error occurred. Please try again.');
      }
    },
  });

  return {
    mutateChangePassword,
    isLoadingChangePassword,
    errorChangePassword,
    isSuccessChangePassword,
  };
};

export { useChangePassword };