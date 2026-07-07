import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useTicketMutations } from '../hooks/useTickets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TICKET_PRIORITIES, TICKET_PRIORITY_CONFIG } from '@/constants/tickets'
import type { TicketPriority } from '@/types/ticket'

const createTicketSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  customerName: z.string().min(2, 'Customer name is required'),
  customerEmail: z.string().email('Valid email is required'),
})

type CreateTicketFormData = z.infer<typeof createTicketSchema>

interface CreateTicketModalProps {
  open: boolean
  onClose: () => void
}

export function CreateTicketModal({ open, onClose }: CreateTicketModalProps) {
  const { createTicket } = useTicketMutations()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      subject: '',
      description: '',
      priority: 'medium',
      customerName: '',
      customerEmail: '',
    },
  })

  const priority = watch('priority')

  useEffect(() => {
    if (!open) {
      reset({
        subject: '',
        description: '',
        priority: 'medium',
        customerName: '',
        customerEmail: '',
      })
    }
  }, [open, reset])

  const onSubmit = (data: CreateTicketFormData) => {
    createTicket.mutate(data, {
      onSuccess: () => {
        onClose()
      },
    })
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
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">New Ticket</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div>
                <Label className="text-sm font-medium">Subject</Label>
                <Input
                  {...register('subject')}
                  placeholder="Brief description of the issue"
                  className="mt-1.5 h-10"
                />
                {errors.subject && (
                  <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  {...register('description')}
                  placeholder="Provide detailed information about the ticket..."
                  className="mt-1.5 min-h-[100px] resize-none"
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <Input
                    {...register('customerName')}
                    placeholder="John Doe"
                    className="mt-1.5 h-10"
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-xs text-red-500">{errors.customerName.message}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Customer Email</Label>
                  <Input
                    type="email"
                    {...register('customerEmail')}
                    placeholder="customer@example.com"
                    className="mt-1.5 h-10"
                  />
                  {errors.customerEmail && (
                    <p className="mt-1 text-xs text-red-500">{errors.customerEmail.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setValue('priority', v as TicketPriority)}
                >
                  <SelectTrigger className="mt-1.5 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {TICKET_PRIORITY_CONFIG[p].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  disabled={isSubmitting || createTicket.isPending}
                  className="h-9 rounded-full px-6 bg-[var(--color-text-primary)] text-white"
                >
                  {createTicket.isPending ? 'Creating...' : 'Create Ticket'}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}