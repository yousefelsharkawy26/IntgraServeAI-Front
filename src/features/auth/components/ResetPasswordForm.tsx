import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Box, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useNotificationStore } from '@/store/notificationStore'

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type ResetFormData = z.infer<typeof resetSchema>

export default function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToast } = useNotificationStore()

  const token = searchParams.get('token') || ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetFormData) => {
    if (!token) {
      setSubmitError(
        'No reset token found. Please request a new password reset link from the forgot password page.'
      )
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await authService.resetPassword({
        token,
        password: data.password,
        // confirmPassword is validated client-side by Zod and never sent
        // to the backend, but the ResetPasswordData type requires it.
        confirmPassword: data.confirmPassword,
      })
      setIsSubmitted(true)
      addToast({
        type: 'success',
        title: 'Password reset',
        message: 'You can now sign in with your new password.',
      })
      // Auto-navigate to login after a short delay so the user sees the success state.
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to reset password. The link may have expired — please request a new one.'
      setSubmitError(message)
      addToast({ type: 'error', title: 'Reset failed', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--color-bg-base)] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-orange)]">
            <Box className="h-6 w-6 text-white" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            IntegraServe
          </span>
        </div>

        <div className="rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] p-6 shadow-sm">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">Password reset</h2>
              <p className="mt-2 text-center text-sm text-[var(--color-text-muted)]">
                Your password has been successfully reset. Redirecting you to sign in...
              </p>
              <Link
                to="/login"
                className="mt-6 flex items-center gap-2 rounded-lg bg-[var(--color-text-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-text-primary)]/90"
              >
                Sign in
              </Link>
            </motion.div>
          ) : (
            <>
              <Link
                to="/login"
                className="mb-4 flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Reset password</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Create a new password for your account</p>

              {!token && (
                <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>No reset token found in the URL. Please open the link from your email, or request a new one.</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-[var(--color-text-primary)]">
                    New Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : 'password-hint'}
                      className="h-10 rounded-lg border-[var(--color-border-medium)] bg-[var(--color-bg-base)] pr-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p id="password-hint" className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                    At least 8 characters with one uppercase letter and one number.
                  </p>
                  {errors.password && (
                    <p id="password-error" role="alert" className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--color-text-primary)]">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                    className="mt-1.5 h-10 rounded-lg border-[var(--color-border-medium)] bg-[var(--color-bg-base)]"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p id="confirmPassword-error" role="alert" className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {submitError && (
                  <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || !token}
                  className="h-10 w-full rounded-lg bg-[var(--color-text-primary)] text-white hover:bg-[var(--color-text-primary)]/90"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resetting...
                    </span>
                  ) : (
                    'Reset password'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}