import { Navigate } from 'react-router';
import { roleRedirectMap } from './ProtectedRoute';
import { useAuthContext } from '@/providers/context/auth-context/AuthContext';
import { userByTokenRolesEnumT } from '@/schema/userByTokenSchema';

interface ChildRoute {
  path: string;
  allowedRoles?: userByTokenRolesEnumT[];
}

interface Props {
  childrenRoutes?: ChildRoute[];
  fallback?: string;
}

const DashRoleRedirect = ({ childrenRoutes, fallback = '/' }: Props) => {
  const { dataUser } = useAuthContext();
  const roles = dataUser?.roles ?? [];

  if (childrenRoutes && childrenRoutes.length > 0) {
    const allowedChild = childrenRoutes.find((child) => {
      return (
        !child.allowedRoles || child.allowedRoles.some((r) => roles.includes(r))
      );
    });

    return <Navigate to={allowedChild?.path ?? fallback} replace />;
  }

  const firstRole = dataUser?.roles?.[0];
  const redirectPath =
    firstRole && roleRedirectMap[firstRole as keyof typeof roleRedirectMap]
      ? roleRedirectMap[firstRole as keyof typeof roleRedirectMap]
      : '/';

  return <Navigate to={redirectPath} replace />;
};

export default DashRoleRedirect;
