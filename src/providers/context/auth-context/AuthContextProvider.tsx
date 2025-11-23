import { ReactNode } from 'react';
import {
  AuthContext,
  authContextCallbacksT,
  IAuthContext,
} from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { getCookie } from '@/utils/TS-Cookie';
import { useUserByToken } from '@/features/profile/useUserByToken';
import { useLogin } from '@/features/authentication/login/useLogin';
import { LoginFormT } from '@/schema/loginSchema';
import useLogout from '@/features/authentication/logout/useLogout';

interface IProps {
  children: ReactNode;
}

const AuthContextProvider = ({ children }: IProps) => {
  const queryClient = useQueryClient();
  const token = getCookie({ name: 'token' });

  const { dataUserByToken, isLoadingUserByToken, isSuccessUserByToken } =
    useUserByToken(token);

  const { mutateLogin, isLoadingLogin } = useLogin();
  const { mutateLogout } = useLogout();

  const isLoggedIn = isSuccessUserByToken && !!dataUserByToken;

  const login = (data: LoginFormT, callbacks?: authContextCallbacksT) => {
    mutateLogin(data, {
      onSuccess: (data) => {
        queryClient.invalidateQueries();
        callbacks?.onSuccess?.(data);
      },
      onError: (error) => {
        callbacks?.onError?.(error);
      },
    });
  };

  const logout = () => {
    mutateLogout();
    // deleteCookie({ name: 'token' });
    // queryClient.invalidateQueries();
  };

  const value: IAuthContext = {
    dataUser: isLoggedIn ? dataUserByToken : null,
    isLoadingUser: isLoadingUserByToken,
    isLoadingLoggingIn: isLoadingLogin,
    isLoggedIn,
    login,
    logout,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContextProvider;
