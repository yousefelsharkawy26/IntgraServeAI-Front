import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useProfileMutations } from '../hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { User } from '@/types'

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

  const onSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data, { onSuccess: onClose })
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
            className="fixed left-1/2 top-[10%] z-50 w-full max-w-md -translate-x-1/2 rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Edit Profile</h2>
              <button onClick={onClose} className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <Label className="text-sm font-medium">Full Name</Label>
                <Input {...register('name')} className="mt-1.5 h-10" />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <Input {...register('email')} type="email" className="mt-1.5 h-10" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium">Department</Label>
                <Input {...register('department')} className="mt-1.5 h-10" placeholder="e.g., Engineering" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" className="h-9 rounded-full px-4" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || updateProfile.isPending} className="h-9 rounded-full px-6 bg-[var(--color-text-primary)] text-white">
                  {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
