import { createBrowserRouter, RouterProvider } from 'react-router';

import Login from '../pages/Login.tsx';
import ErrorPage from '../pages/ErrorPage.tsx';
import PageNotFound from '../pages/PageNotFound.tsx';

import AppLayout from '../components/AppLayout.tsx';
import ProtectedRoute from './ProtectedRoute.tsx';
import AppLayoutAdmin from '@/components/AppLayoutAdmin.tsx';
import AdminMain from '@/pages/AdminMain.tsx';
import UsersAdmin from '@/pages/dashboard/UsersAdmin.tsx';
import UnderDevelopmentPage from '@/pages/UnderDevelopmentPage.tsx';
import DashRoleRedirect from './DashRoleRedirect.tsx';
import DashboardHome from '@/pages/dashboard/DashboardHome.tsx';
import TicketsUser from '@/pages/dashboard/user/TicketsUser.tsx';
import TicketsAdmin from '@/pages/dashboard/TicketsAdmin.tsx';
import UnAssignedTickets from '@/pages/dashboard/user/UnAssignedTickets.tsx';

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
              redirectPath={'/dash'}
              shouldRedirectIfLoggedIn={true}
            >
              <></>
            </ProtectedRoute>
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
    path: '/log-in',
    element: (
      <ProtectedRoute
        redirectPath={'/dash'}
        shouldRedirectIfLoggedIn={true}
      >
        <Login />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dash',
    element: (
      <ProtectedRoute
        redirectPath="/log-in"
        shouldRedirectIfLoggedIn={false}
        allowedRoles={['Admin', 'Support User', 'Tech User']}
      >
        <AppLayoutAdmin />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute
            redirectPath="/log-in"
            shouldRedirectIfLoggedIn={false}
            allowedRoles={['Admin', 'Support User', 'Tech User']}
          >
            <AdminMain>
              <DashboardHome />
            </AdminMain>
          </ProtectedRoute>
        ),
      },

      {
        path: `users`,
        element: (
          <ProtectedRoute
            redirectPath={`/log-in`}
            shouldRedirectIfLoggedIn={false}
            allowedRoles={['Admin']}
          >
            <AdminMain>
              <UsersAdmin />
            </AdminMain>
          </ProtectedRoute>
        ),
      },
      {
        path: `tickets`,
        element: (
          <ProtectedRoute
            redirectPath={`/log-in`}
            shouldRedirectIfLoggedIn={false}
            allowedRoles={['Admin', 'Support User', 'Tech User']}
          >
            <AdminMain />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <DashRoleRedirect
                childrenRoutes={[
                  { path: '/dash/tickets/show', allowedRoles: ['Admin'] },
                  {
                    path: '/dash/tickets/manage',
                    allowedRoles: ['Support User', 'Tech User'],
                  },
                  {
                    path: '/dash/tickets/unassigned',
                    allowedRoles: ['Admin', 'Support User', 'Tech User'],
                  },
                ]}
              />
            ),
          },
          {
            path: 'show',
            element: (
              <ProtectedRoute
                redirectPath="/log-in"
                shouldRedirectIfLoggedIn={false}
                allowedRoles={['Admin']}
              >
                <AdminMain>
                  <TicketsAdmin />
                </AdminMain>
              </ProtectedRoute>
            ),
          },
          {
            path: 'manage',
            element: (
              <ProtectedRoute
                redirectPath="/log-in"
                shouldRedirectIfLoggedIn={false}
                allowedRoles={['Support User', 'Tech User']}
              >
                <AdminMain>
                  <TicketsUser />
                </AdminMain>
              </ProtectedRoute>
            ),
          },
          {
            path: 'unassigned',
            element: (
              <ProtectedRoute
                redirectPath="/log-in"
                shouldRedirectIfLoggedIn={false}
                allowedRoles={['Support User', 'Tech User']}
              >
                <AdminMain>
                  <UnAssignedTickets />
                </AdminMain>
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: `page-2`,
        element: (
          <ProtectedRoute
            redirectPath={`/log-in`}
            shouldRedirectIfLoggedIn={false}
            allowedRoles={['Support User']}
          >
            <AdminMain>
              <UnderDevelopmentPage />
            </AdminMain>
          </ProtectedRoute>
        ),
      },
      {
        path: `page-3`,
        element: (
          <ProtectedRoute
            redirectPath={`/log-in`}
            shouldRedirectIfLoggedIn={false}
            allowedRoles={['Tech User']}
          >
            <AdminMain>
              <UnderDevelopmentPage />
            </AdminMain>
          </ProtectedRoute>
        ),
      },
      {
        path: `page-4`,
        element: (
          <ProtectedRoute
            redirectPath={`/log-in`}
            shouldRedirectIfLoggedIn={false}
            allowedRoles={['Support User']}
          >
            <AdminMain>
              <UnderDevelopmentPage />
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
