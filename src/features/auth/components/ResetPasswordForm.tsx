import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Box, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from 'react-router-dom'

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (_data: ResetFormData) => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsSubmitted(true)
    setIsSubmitting(false)
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
                Your password has been successfully reset.
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

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-[var(--color-text-primary)]">
                    New Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="h-10 rounded-lg border-[var(--color-border-medium)] bg-[var(--color-bg-base)] pr-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--color-text-primary)]">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="mt-1.5 h-10 rounded-lg border-[var(--color-border-medium)] bg-[var(--color-bg-base)]"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 w-full rounded-lg bg-[var(--color-text-primary)] text-white hover:bg-[var(--color-text-primary)]/90"
                >
                  {isSubmitting ? 'Resetting...' : 'Reset password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
