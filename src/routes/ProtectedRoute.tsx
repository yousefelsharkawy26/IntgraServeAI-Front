import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Spinner } from '@/components/ui/spinner.tsx';
import { useAuthContext } from '@/providers/context/auth-context/AuthContext.ts';
import { userByTokenRolesEnumT } from '@/schema/userByTokenSchema';

interface IProps {
  children: ReactNode;
  redirectPath: string;
  shouldRedirectIfLoggedIn: boolean;
  allowedRoles?: userByTokenRolesEnumT[];
}

export const roleRedirectMap: Record<userByTokenRolesEnumT, string> = {
  Admin: '/dash/users',
  'Support User': '/dash/tickets',
  'Tech User': '/dash/tickets',
};

/**
 * A wrapper component that protects routes based on authentication state and user roles.
 *
 * This component handles:
 * - Redirecting users who are not authenticated.
 * - Redirecting authenticated users based on their role (via `roleRedirectMap`).
 * - Restricting access to specific roles using `allowedRoles`.
 * - Optionally redirecting already logged-in users away from public routes.
 *
 * @component
 *
 * @param {React.ReactNode} props.children - The component(s) to render if access is allowed.
 * @param {string} props.redirectPath - The path to navigate to when access is denied.
 * @param {boolean} props.shouldRedirectIfLoggedIn - If `true`, authenticated users will be redirected away from this route.
 * @param {userByTokenRolesEnumT[]} [props.allowedRoles] - Optional list of roles allowed to access this route.
 *
 * @returns {React.ReactElement|null} Returns child components if allowed; otherwise triggers navigation.
 * While loading user data, returns a full-screen spinner.
 *
 * @example
 * ```tsx
 * // Example: Only Admins can access this page
 * <ProtectedRoute
 *   redirectPath="/login"
 *   allowedRoles={['Admin']}
 *   shouldRedirectIfLoggedIn={false}
 * >
 *   <AdminDashboard />
 * </ProtectedRoute>
 * ```
 *
 * @example
 * ```tsx
 * // Example: Prevent logged-in users from accessing the login page
 * <ProtectedRoute
 *   redirectPath="/"
 *   shouldRedirectIfLoggedIn={true}
 * >
 *   <LoginPage />
 * </ProtectedRoute>
 * ```
 */

const ProtectedRoute = ({
  children,
  redirectPath = '/',
  shouldRedirectIfLoggedIn,
  allowedRoles,
}: IProps) => {
  const { dataUser, isLoggedIn, isLoadingUser } = useAuthContext();
  const navigate = useNavigate();

  console.log('isLoggedIn', isLoggedIn);
  useEffect(() => {
    if (isLoadingUser) return;

    const userRoles = dataUser?.roles ?? [];

    const hasRoleAccess =
      !allowedRoles || userRoles.some((role) => allowedRoles.includes(role));

    if (!hasRoleAccess) {
      navigate(redirectPath, { replace: true });
      return;
    }

    if (isLoggedIn && shouldRedirectIfLoggedIn) {
      const firstRole = userRoles[0];

      navigate(roleRedirectMap[firstRole] || redirectPath, { replace: true });
      return;
    }

    if (!isLoggedIn && !shouldRedirectIfLoggedIn) {
      navigate(redirectPath, { replace: true });
      return;
    }
  }, [
    isLoggedIn,
    isLoadingUser,
    dataUser,
    allowedRoles,
    redirectPath,
    shouldRedirectIfLoggedIn,
    navigate,
  ]);

  if (isLoadingUser)
    return (
      <div className="absolute inset-0 -z-10 flex h-full w-full items-center justify-center">
        <Spinner className="size-12" />
      </div>
    );

  return <>{children}</>;
};

export default ProtectedRoute;
