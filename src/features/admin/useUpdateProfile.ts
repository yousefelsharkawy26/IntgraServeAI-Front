import { useMutation, useQueryClient } from '@tanstack/react-query';
import updateProfile from '@/services/admin/apiUpdateProfile';
import {
  updateProfileRequestT,
  updateProfileResponseT,
  updateProfileErrorResponseT,
} from '@/schema/admin/updateProfileSchema';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  const {
    mutate: mutateUpdateProfile,
    isPending: isLoadingUpdateProfile,
    error: errorUpdateProfile,
    isSuccess: isSuccessUpdateProfile,
  } = useMutation<
    updateProfileResponseT,          // Success Type
    AxiosError<updateProfileErrorResponseT>, // Error Type (Axios wrapping your Error Schema)
    updateProfileRequestT            // Variables Type (Request Schema)
  >({
    mutationFn: (data) => updateProfile(data),
    onSuccess: (data) => {
      toast.success(data.message);
      // Invalidate the profile query so the menu updates immediately
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error) => {
      // The specific field errors (e.g., email taken) are handled in the Form component.
      // We only show a generic toast if the server didn't return a structured validation error.
      if (!error.response?.data?.errors) {
        toast.error('Failed to update profile. Please try again.');
      }
    },
  });

  return {
    mutateUpdateProfile,
    isLoadingUpdateProfile,
    errorUpdateProfile,
    isSuccessUpdateProfile,
  };
};

export { useUpdateProfile };