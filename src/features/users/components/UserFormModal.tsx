import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  user?: User | null
  roles: Array<{ id: string; name: string }>
  onSubmit: (data: CreateFormData | EditFormData) => void
  isSubmitting?: boolean
}

export function UserFormModal({ open, onClose, mode, user, roles, onSubmit, isSubmitting }: UserFormModalProps) {
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
    defaultValues: isCreate
      ? { email: '', full_name: '', password: '', roles_id: [] }
      : { email: user?.email || '', full_name: user?.name || '', roles_id: [] },
  })

  const selectedRoles = watch('roles_id') || []

  useEffect(() => {
    if (open) {
      if (isCreate) {
        reset({ email: '', full_name: '', password: '', roles_id: [] })
      } else if (user) {
        const initialRoles = roles.filter((r) => r.name === user.role).map((r) => r.id)
        reset({
          email: user.email,
          full_name: user.name,
          roles_id: initialRoles,
        })
      }
    }
  }, [open, isCreate, user, roles, reset])

  const toggleRole = (roleId: string) => {
    const next = selectedRoles.includes(roleId)
      ? selectedRoles.filter((id) => id !== roleId)
      : [...selectedRoles, roleId]
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
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <Input
                    {...register('full_name')}
                    placeholder="John Doe"
                    className="mt-1.5 h-10"
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <Input
                    type="email"
                    {...register('email')}
                    placeholder="user@example.com"
                    className="mt-1.5 h-10"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {isCreate && (
                <div>
                  <Label className="text-sm font-medium">Password</Label>
                  <Input
                    type="password"
                    {...register('password' as any)}
                    placeholder="Minimum 8 characters"
                    className="mt-1.5 h-10"
                  />
                  {(errors as any).password && (
                    <p className="mt-1 text-xs text-red-500">{(errors as any).password.message}</p>
                  )}
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Roles</Label>
                <div className="mt-2 space-y-2 rounded-lg border border-[var(--color-border-light)] p-3">
                  {roles.length === 0 && (
                    <p className="text-xs text-[var(--color-text-muted)]">No roles available.</p>
                  )}
                  {roles.map((role) => {
                    const checked = selectedRoles.includes(role.id)
                    return (
                      <label
                        key={role.id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--color-bg-base)] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRole(role.id)}
                          className="h-4 w-4 rounded border-[var(--color-border-medium)]"
                        />
                        <span className="text-sm text-[var(--color-text-primary)]">{role.name}</span>
                      </label>
                    )
                  })}
                </div>
                {errors.roles_id && (
                  <p className="mt-1 text-xs text-red-500">{errors.roles_id.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border-light)]">
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
                  disabled={isSubmitting}
                  className="h-9 rounded-full px-6 bg-[var(--color-text-primary)] text-white"
                >
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