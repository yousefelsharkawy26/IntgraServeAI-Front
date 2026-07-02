import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ProtectedRoute, PublicOnlyRoute } from './guards'
import { AppLayout } from '@/components/layout/AppLayout'
import { Skeleton } from '@/components/ui/skeleton'

const LoginPage = lazy(() => import('@/features/auth/components/LoginForm'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/components/ForgotPasswordForm'))
const ResetPasswordPage = lazy(() => import('@/features/auth/components/ResetPasswordForm'))
const DashboardPage = lazy(() => import('@/features/dashboard/components/DashboardView'))
const TicketQueue = lazy(() => import('@/features/tickets/components/TicketQueue'))
const TicketDetail = lazy(() => import('@/features/tickets/components/TicketDetail'))
const ActionsList = lazy(() => import('@/features/actions/components/ActionsList'))
const BackupsView = lazy(() => import('@/features/backups/components/BackupsView'))
const UsersList = lazy(() => import('@/features/users/components/UsersList'))
const RolesGrid = lazy(() => import('@/features/roles/components/RolesGrid'))
const ProfileView = lazy(() => import('@/features/profile/components/ProfileView'))
const ChatWidgetPage = lazy(() => import('@/features/chat/components/ChatWidgetPage'))

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-3 gap-4 pt-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicOnlyRoute>
              <ResetPasswordPage />
            </PublicOnlyRoute>
          }
        />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketQueue />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route
            path="/actions"
            element={
              <ProtectedRoute requiredRoles={['Administrator', 'Manager']}>
                <ActionsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/backups"
            element={
              <ProtectedRoute requiredRoles={['Administrator', 'Manager']}>
                <BackupsView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredRoles={['Administrator']}>
                <UsersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute requiredRoles={['Administrator']}>
                <RolesGrid />
              </ProtectedRoute>
            }
          />
          <Route path="/chat" element={<ChatWidgetPage />} />
        </Route>

        {/* Redirect root */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
