import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, EyeOff, Lock, KeyRound, ShieldCheck } from 'lucide-react'
import { useProfileMutations } from '../hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEscapeClose } from '../hooks/useEscapeClose'
import { preventBodyScroll } from '../hooks/preventBodyScroll'

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[0-9]/, 'Must include at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type PasswordFormData = z.infer<typeof passwordSchema>

interface ChangePasswordModalProps {
  open: boolean
  onClose: () => void
}

function passwordStrength(pwd: string) {
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (pwd.length >= 12) score++
  return score // 0..5
}

const strengthMeta = [
  { label: 'Too weak', color: 'bg-red-500' },
  { label: 'Weak', color: 'bg-orange-500' },
  { label: 'Fair', color: 'bg-amber-500' },
  { label: 'Good', color: 'bg-yellow-500' },
  { label: 'Strong', color: 'bg-lime-500' },
  { label: 'Very strong', color: 'bg-green-500' },
]

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { changePassword } = useProfileMutations()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [newPwd, setNewPwd] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  // Sync strength meter
  useEffect(() => {
    const sub = watch((v) => setNewPwd((v.newPassword as string) ?? ''))
    return () => sub.unsubscribe()
  }, [watch])

  useEscapeClose(open, onClose)
  preventBodyScroll(open)

  const onSubmit = (data: PasswordFormData) => {
    changePassword.mutate(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      },
      { onSuccess: () => { reset(); setNewPwd(''); onClose() } }
    )
  }

  const score = passwordStrength(newPwd)
  const meta = strengthMeta[score]

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[var(--color-bg-overlay)] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="relative z-10 flex max-h-[100dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] shadow-2xl sm:rounded-2xl"
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[var(--color-border-medium)] sm:hidden" />

            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Change Password
                </h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  Use at least 8 characters with letters and numbers
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-base)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex-1 space-y-4 overflow-y-auto p-6"
            >
              <PasswordField
                label="Current Password"
                error={errors.currentPassword?.message}
                icon={<KeyRound className="h-4 w-4" />}
                show={showCurrent}
                onToggle={() => setShowCurrent((s) => !s)}
                {...register('currentPassword')}
              />

              <div>
                <PasswordField
                  label="New Password"
                  error={errors.newPassword?.message}
                  icon={<Lock className="h-4 w-4" />}
                  show={showNew}
                  onToggle={() => setShowNew((s) => !s)}
                  {...register('newPassword')}
                />
                {/* strength meter */}
                {newPwd && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {strengthMeta.slice(1).map((_, i) => (
                        <div
                          key={i}
                          className={[
                            'h-1 flex-1 rounded-full transition-colors',
                            i < score ? meta.color : 'bg-[var(--color-border-medium)]',
                          ].join(' ')}
                        />
                      ))}
                    </div>
                    <p className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                      <ShieldCheck className="h-3 w-3" />
                      {meta.label}
                    </p>
                  </div>
                )}
              </div>

              <PasswordField
                label="Confirm Password"
                error={errors.confirmPassword?.message}
                icon={<Lock className="h-4 w-4" />}
                show={showConfirm}
                onToggle={() => setShowConfirm((s) => !s)}
                {...register('confirmPassword')}
              />
            </form>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border-light)] bg-[var(--color-bg-base)]/60 px-6 py-3">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full px-4"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={changePassword.isPending}
                onClick={handleSubmit(onSubmit)}
                className="h-9 rounded-full px-6 bg-[var(--color-text-primary)] text-white hover:opacity-90"
              >
                {changePassword.isPending ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function PasswordField({
  label,
  error,
  icon,
  show,
  onToggle,
  ...inputProps
}: {
  label: string
  error?: string
  icon: React.ReactNode
  show: boolean
  onToggle: () => void
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)]">
        <span className="text-[var(--color-text-muted)]">{icon}</span>
        {label}
      </Label>
      <div className="relative mt-1.5">
        <Input
          type={show ? 'text' : 'password'}
          {...inputProps}
          className="h-10 pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
