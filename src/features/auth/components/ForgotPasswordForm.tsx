import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Box, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useNotificationStore } from '@/store/notificationStore'

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotFormData = z.infer<typeof forgotSchema>

export default function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { addToast } = useNotificationStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotFormData) => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await authService.forgotPassword({ email: data.email })
      // For security, always show the success message — even if the email
      // doesn't exist (avoids account enumeration).
      setIsSubmitted(true)
      addToast({
        type: 'success',
        title: 'Reset link sent',
        message: 'Check your inbox for the password reset link.',
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send reset link. Please try again.'
      setSubmitError(message)
      addToast({ type: 'error', title: 'Request failed', message })
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
              <h2 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">Check your email</h2>
              <p className="mt-2 text-center text-sm text-[var(--color-text-muted)]">
                We've sent a password reset link to your email address.
              </p>
              <Link
                to="/login"
                className="mt-6 flex items-center gap-2 text-sm font-medium text-[var(--color-accent-blue)] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
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
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Forgot password</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Enter your email and we'll send you a reset link
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-[var(--color-text-primary)]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className="mt-1.5 h-10 rounded-lg border-[var(--color-border-medium)] bg-[var(--color-bg-base)]"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p id="email-error" role="alert" className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email.message}
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
                  disabled={isSubmitting}
                  className="h-10 w-full rounded-lg bg-[var(--color-text-primary)] text-white hover:bg-[var(--color-text-primary)]/90"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    'Send reset link'
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