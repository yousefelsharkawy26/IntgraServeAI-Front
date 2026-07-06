import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Box } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/services/auth.service'
import { useNotificationStore } from '@/store/notificationStore'
import { Link } from 'react-router-dom'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const login = useAuthStore((state) => state.login)
  const addToast = useNotificationStore((state) => state.addToast)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    try {
      const response = await authService.login({
        email: data.email,
        password: data.password,
      })

      login(response.user, response.accessToken, response.refreshToken)
      addToast({ type: 'success', title: 'Welcome back!', message: 'Successfully signed in.' })
    } catch (error: any) {
      addToast({ 
        type: 'error', 
        title: 'Login failed', 
        message: error?.response?.data?.message || 'Invalid credentials. Please try again.' 
      })
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
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-orange)]">
            <Box className="h-6 w-6 text-white" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            IntegraServe
          </span>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Sign in</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Enter your credentials to access your account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-[var(--color-text-primary)]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                className="mt-1.5 h-10 rounded-lg border-[var(--color-border-medium)] bg-[var(--color-bg-base)]"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-[var(--color-text-primary)]">
                Password
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <input type="checkbox" className="rounded border-[var(--color-border-medium)]" />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-[var(--color-accent-blue)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full rounded-lg bg-[var(--color-text-primary)] text-white hover:bg-[var(--color-text-primary)]/90"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                />
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Don't have an account?{' '}
          <span className="font-medium text-[var(--color-accent-blue)]">Contact your administrator</span>
        </p>
      </motion.div>
    </div>
  )
}
