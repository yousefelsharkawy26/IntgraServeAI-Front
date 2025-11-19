import { useLayoutEffect, useState } from 'react';
import { deleteCookie, getCookie } from '../utils/TS-Cookie.ts';
import { useStudentByToken } from '../features/students/useStudentByToken.ts';
import { studentByTokenT } from '../schemas/studentByTokenSchema.ts';

interface IUseIsLoggedIn {
  isLoggedIn: boolean;
  token: string | undefined;
  dataUser: studentByTokenT | { message: string } | null;
  isLoading: boolean;
}

const useIsLoggedIn = (): IUseIsLoggedIn => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [dataUser, setDataUser] = useState<
    studentByTokenT | { message: string } | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  const { dataStudentByToken, isLoadingStudentByToken } = useStudentByToken();

  useLayoutEffect(() => {
    const tokenFromCookie = getCookie({ name: 'token' });
    console.log('tokenFromCoolie', tokenFromCookie);
    setToken(tokenFromCookie);

    if (!tokenFromCookie) {
      setIsLoggedIn(false);
      setDataUser({ message: 'Unauthorized' });
      setIsLoading(false);
      return;
    }

    if (dataStudentByToken) {
      if ('data' in dataStudentByToken) {
        setIsLoggedIn(true);
        setDataUser(dataStudentByToken);
      } else {
        setIsLoggedIn(false);
        setDataUser(dataStudentByToken);
        deleteCookie({ name: 'token' });
      }
      setIsLoading(false);
    } else {
      setIsLoading(isLoadingStudentByToken);
    }
    return () => {
      // this solved the logout issue
      if (!tokenFromCookie) {
        setIsLoggedIn(false);
        setDataUser({ message: 'Unauthorized' });
        setIsLoading(false);
      }
    };
  }, [dataStudentByToken, isLoadingStudentByToken]);

  return { isLoggedIn, token, dataUser, isLoading };
};

export default useIsLoggedIn;
