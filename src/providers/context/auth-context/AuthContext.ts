import { LoginFormT, LoginResponseT } from '@/schema/loginSchema';
import { userByTokenT } from '@/schema/userByTokenSchema';
import { createContext, useContext } from 'react';

export type authContextCallbacksT = {
  onSuccess?: (data: LoginResponseT) => void;
  onError?: (error: unknown) => void;
};

export interface IAuthContext {
  dataUser: userByTokenT | null;
  isLoadingUser: boolean;
  isLoggedIn: boolean;
  isLoadingLoggingIn: boolean;
  login: (data: LoginFormT, callbacks?: authContextCallbacksT) => void;
  logout: () => void;
}

export const AuthContext = createContext<IAuthContext | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (context === undefined)
    throw new Error(
      'useAuthContext hook must be used within a <AuthContextProvider>...</AuthContextProvider>',
    );

  return context;
};
