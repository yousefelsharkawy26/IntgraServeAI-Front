import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { UserRolesSelector } from './UserRolesSelector'
import type { User } from '@/types/auth'

const createSchema = z.object({
  email: z.string().email('Valid email is required'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roles_id: z.array(z.string()).min(1, 'At least one role is required'),
})

const editSchema = z.object({
  email: z.string().email('Valid email is required'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  roles_id: z.array(z.string()).min(1, 'At least one role is required'),
})

export type CreateFormData = z.infer<typeof createSchema>
export type EditFormData = z.infer<typeof editSchema>

interface Props {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  user?: User | null
  roles: Array<{ id: string; name: string }>
  onSubmit: (data: CreateFormData | EditFormData) => void
  isSubmitting?: boolean
}

export function UserFormModal({ open, onClose, mode, user, roles, onSubmit, isSubmitting }: Props) {
  const isCreate = mode === 'create'

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateFormData | EditFormData>({
    resolver: zodResolver(isCreate ? createSchema : editSchema),
  })

  const selectedRoles = watch('roles_id') || []

  useEffect(() => {
    if (!open) return
    if (isCreate) {
      reset({ email: '', full_name: '', password: '', roles_id: [] })
    } else if (user) {
      const initialRoles = roles.filter((r) => r.name === user.role).map((r) => r.id)
      reset({ email: user.email, full_name: user.name, roles_id: initialRoles })
    }
  }, [open, isCreate, user, roles, reset])

  const toggleRole = (id: string) => {
    const next = selectedRoles.includes(id)
      ? selectedRoles.filter((x) => x !== id)
      : [...selectedRoles, id]
    setValue('roles_id', next, { shouldValidate: true })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="fixed left-1/2 top-[5%] z-50 w-full max-w-xl -translate-x-1/2 rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {isCreate ? 'Create User' : 'Edit User'}
              </h2>
              <button onClick={onClose} className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <Input {...register('full_name')} placeholder="John Doe" className="mt-1.5 h-10" />
                  {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <Input type="email" {...register('email')} placeholder="user@example.com" className="mt-1.5 h-10" />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                </div>
              </div>

              {isCreate && (
                <div>
                  <Label className="text-sm font-medium">Password</Label>
                  <Input type="password" {...register('password' as any)} placeholder="Minimum 8 characters" className="mt-1.5 h-10" />
                  {(errors as any).password && <p className="mt-1 text-xs text-red-500">{(errors as any).password.message}</p>}
                </div>
              )}

              <UserRolesSelector
                roles={roles}
                selected={selectedRoles}
                onToggle={toggleRole}
                error={errors.roles_id?.message}
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border-light)]">
                <Button type="button" variant="outline" className="h-9 rounded-full px-4" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="h-9 rounded-full px-6 bg-[var(--color-text-primary)] text-white">
                  {isSubmitting ? 'Saving...' : isCreate ? 'Create User' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}