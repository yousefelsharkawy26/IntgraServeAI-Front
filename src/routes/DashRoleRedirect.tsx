import { Navigate } from 'react-router';
import { roleRedirectMap } from './ProtectedRoute';
import { useAuthContext } from '@/providers/context/auth-context/AuthContext';

const DashRoleRedirect = () => {
  const { dataUser } = useAuthContext();

  const firstRole = dataUser?.roles?.[0];
  const redirectPath =
    firstRole && roleRedirectMap[firstRole as keyof typeof roleRedirectMap]
      ? roleRedirectMap[firstRole as keyof typeof roleRedirectMap]
      : '/';

  return <Navigate to={redirectPath} replace />;
};

export default DashRoleRedirect;
