import { useQuery } from '@tanstack/react-query';
import getUserProfile from '@/services/admin/apiUserProfile';
import { userProfileResponseT } from '@/schema/admin/userProfileSchema';

const useUserProfile = () => {
  const {
    data: dataProfile,
    isPending: isLoadingProfile,
    error: errorProfile,
  } = useQuery<userProfileResponseT>({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
    retry: 1,
  });

  return {
    dataProfile,
    isLoadingProfile,
    errorProfile,
  };
};

export { useUserProfile };