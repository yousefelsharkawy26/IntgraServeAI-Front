import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, User as UserIcon, Building2 } from 'lucide-react'
import { useProfileMutations } from '../hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { User } from '@/types'
import { useEscapeClose } from '../hooks/useEscapeClose'
import { preventBodyScroll } from '../hooks/preventBodyScroll'

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  department: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface EditProfileModalProps {
  open: boolean
  onClose: () => void
  user: User
}

export function EditProfileModal({ open, onClose, user }: EditProfileModalProps) {
  const { updateProfile } = useProfileMutations()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, email: user.email, department: user.department || '' },
  })

  useEffect(() => {
    if (open) {
      reset({ name: user.name, email: user.email, department: user.department || '' })
    }
  }, [open, user, reset])

  useEscapeClose(open, onClose)
  preventBodyScroll(open)

  const onSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data, { onSuccess: onClose })
  }

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
            {/* Mobile drag handle */}
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[var(--color-border-medium)] sm:hidden" />

            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Edit Profile</h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  Update your personal information
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

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-4 overflow-y-auto p-6">
              <Field
                label="Full Name"
                error={errors.name?.message}
                icon={<UserIcon className="h-4 w-4" />}
              >
                <Input {...register('name')} className="h-10" />
              </Field>

              <Field
                label="Email"
                error={errors.email?.message}
                icon={<Mail className="h-4 w-4" />}
              >
                <Input {...register('email')} type="email" className="h-10" />
              </Field>

              <Field
                label="Department"
                hint="Optional"
                icon={<Building2 className="h-4 w-4" />}
              >
                <Input
                  {...register('department')}
                  className="h-10"
                  placeholder="e.g., Engineering"
                />
              </Field>
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
                disabled={isSubmitting || updateProfile.isPending}
                onClick={handleSubmit(onSubmit)}
                className="h-9 rounded-full px-6 bg-[var(--color-text-primary)] text-white hover:opacity-90"
              >
                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── Shared field wrapper ────────────────────────────────────────────────
function Field({
  label,
  hint,
  error,
  icon,
  children,
}: {
  label: string
  hint?: string
  error?: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <Label className="flex items-center justify-between text-sm font-medium text-[var(--color-text-primary)]">
        <span className="flex items-center gap-1.5">
          {icon && <span className="text-[var(--color-text-muted)]">{icon}</span>}
          {label}
        </span>
        {hint && <span className="text-[11px] text-[var(--color-text-muted)]">{hint}</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
