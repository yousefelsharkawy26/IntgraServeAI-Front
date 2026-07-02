import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, EyeOff } from 'lucide-react'
import { useProfileMutations } from '../hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type PasswordFormData = z.infer<typeof passwordSchema>

interface ChangePasswordModalProps {
  open: boolean
  onClose: () => void
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { changePassword } = useProfileMutations()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onSubmit = (data: PasswordFormData) => {
    changePassword.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword, confirmPassword: data.confirmPassword },
      { onSuccess: () => { reset(); onClose() } }
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-1/2 top-[15%] z-50 w-full max-w-md -translate-x-1/2 rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Change Password</h2>
              <button onClick={onClose} className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <Label className="text-sm font-medium">Current Password</Label>
                <div className="relative mt-1.5">
                  <Input type={showCurrent ? 'text' : 'password'} {...register('currentPassword')} className="h-10 pr-10" />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.currentPassword && <p className="mt-1 text-xs text-red-500">{errors.currentPassword.message}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium">New Password</Label>
                <div className="relative mt-1.5">
                  <Input type={showNew ? 'text' : 'password'} {...register('newPassword')} className="h-10 pr-10" />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium">Confirm Password</Label>
                <div className="relative mt-1.5">
                  <Input type={showConfirm ? 'text' : 'password'} {...register('confirmPassword')} className="h-10 pr-10" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" className="h-9 rounded-full px-4" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={changePassword.isPending} className="h-9 rounded-full px-6 bg-[var(--color-text-primary)] text-white">
                  {changePassword.isPending ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
