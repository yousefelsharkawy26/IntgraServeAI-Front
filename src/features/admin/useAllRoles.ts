import allRoles from '@/services/admin/apiAllRoles';
import { useQuery } from '@tanstack/react-query';

const useAllRoles = () => {
  const {
    data: dataAllRoles,
    isPending: isLoadingAllRoles,
    error: errorAllRoles,
  } = useQuery({
    queryKey: ['allRoles'],
    queryFn: () => allRoles(),
  });

  return {
    dataAllRoles,
    isLoadingAllRoles,
    errorAllRoles,
  };
};

export { useAllRoles };
