import { ReactNode } from 'react';
import InternetConnectionProvider from './InternetConnectionProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ThemeContextProvider from './context/theme-context/ThemeContextProvider';
import AuthContextProvider from './context/auth-context/AuthContextProvider';

interface IProps {
  children: ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
    },
  },
});

const AppProviders = ({ children }: IProps) => {
  return (
    <ThemeContextProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} />
        <InternetConnectionProvider showSpeedDetails={true}>
          <AuthContextProvider>{children}</AuthContextProvider>
        </InternetConnectionProvider>
      </QueryClientProvider>
    </ThemeContextProvider>
  );
};

export default AppProviders;
