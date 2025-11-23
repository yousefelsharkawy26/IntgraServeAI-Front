import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Spinner } from '@/components/ui/spinner.tsx';
import { useAuthContext } from '@/providers/context/auth-context/AuthContext.ts';

/**
 * @param {string} redirectPath - The path to redirect to if the user is logged in or not.
 * @param {boolean} shouldRedirectIfLoggedIn - shouldRedirectIfLoggedIn is a boolean that determines whether to redirect if the user is logged in or not.
 */
interface IProps {
  children: ReactNode;
  redirectPath: string;
  shouldRedirectIfLoggedIn: boolean;
}

const ProtectedRoute = ({
  children,
  redirectPath = '/',
  shouldRedirectIfLoggedIn,
}: IProps) => {
  const { isLoggedIn, isLoadingUser } = useAuthContext();
  const navigate = useNavigate();

  console.log('isLoggedIn', isLoggedIn);
  useEffect(() => {
    if (!isLoadingUser) {
      const shouldRedirect =
        (isLoggedIn && shouldRedirectIfLoggedIn) ||
        (!isLoggedIn && !shouldRedirectIfLoggedIn);

      if (shouldRedirect) {
        navigate(redirectPath);
      }
    }
  }, [
    isLoadingUser,
    isLoggedIn,
    navigate,
    redirectPath,
    shouldRedirectIfLoggedIn,
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
