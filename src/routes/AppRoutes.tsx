import { createBrowserRouter, RouterProvider } from 'react-router';

import Login from '../pages/Login.tsx';
import ErrorPage from '../pages/ErrorPage.tsx';
import PageNotFound from '../pages/PageNotFound.tsx';

import AppLayout from '../components/AppLayout.tsx';
import ProtectedRoute from './ProtectedRoute.tsx';
import AppLayoutAdmin from '@/components/AppLayoutAdmin.tsx';
import AdminMain from '@/pages/AdminMain.tsx';
import UsersAdmin from '@/pages/dashboard/UsersAdmin.tsx';
// import UnderDevelopmentPage from '../pages/UnderDevelopmentPage.tsx';

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: (
          <ProtectedRoute
            redirectPath={'/log-in'}
            shouldRedirectIfLoggedIn={false}
          >
            <ProtectedRoute
              redirectPath={'/admin'}
              shouldRedirectIfLoggedIn={true}
            >
              <></>
            </ProtectedRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/log-in',
        element: (
          <ProtectedRoute
            redirectPath={'/admin'}
            shouldRedirectIfLoggedIn={true}
          >
            <Login />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <PageNotFound />,
  },
  {
    element: <AppLayoutAdmin />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: `/admin`,
        element: (
          <ProtectedRoute
            redirectPath={`/log-in`}
            shouldRedirectIfLoggedIn={false}
          >
            <AdminMain>
              <UsersAdmin />
            </AdminMain>
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

const AppRoutes = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
