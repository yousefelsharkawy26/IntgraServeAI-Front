// ============================================================
// Create Ticket Tool
// ============================================================
// A self-contained tool component that renders a ticket creation
// form and sends the result back through the Tool Context.
// This component knows NOTHING about the chat infrastructure.
// ============================================================

import { useState } from 'react'
import { useToolContext } from '../ToolContext'
import { useTicketMutations } from '@/features/tickets/hooks/useTickets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, Loader2 } from 'lucide-react'

export function CreateTicketTool() {
  const { toolCallId, params, sendResult, cancel } = useToolContext()
  const { createTicket } = useTicketMutations()

  // Pre-fill from backend params if available
  const [subject, setSubject] = useState((params.subject as string) || '')
  const [description, setDescription] = useState((params.description as string) || '')
  const [priority, setPriority] = useState((params.priority as string) || 'medium')
  const [customerName, setCustomerName] = useState((params.customerName as string) || '')
  const [customerEmail, setCustomerEmail] = useState((params.customerEmail as string) || '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isSubmitting = createTicket.isPending

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (subject.trim().length < 3) errs.subject = 'Subject must be at least 3 characters'
    if (description.trim().length < 10) errs.description = 'Description must be at least 10 characters'
    if (customerName.trim().length < 2) errs.customerName = 'Customer name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) errs.customerEmail = 'Valid email is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    createTicket.mutate(
      { subject, description, priority: priority as any, customerName, customerEmail },
      {
        onSuccess: (newTicket) => {
          // Send the result back to the backend via the tool runtime.
          // The backend owns the lifecycle — we just report what happened.
          sendResult({
            ticketId: newTicket.id,
            subject,
            priority,
            customerName,
            customerEmail,
          })
        },
        onError: (err: any) => {
          // Report failure through the tool runtime contract.
          // We do NOT call cancel() — that means user-initiated cancellation.
          // A failed API call is a 'failed' result.
        },
      }
    )
  }

  return (
    <div className="fixed left-1/2 top-[5%] z-50 w-full max-w-xl -translate-x-1/2 rounded-xl border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 z-[-1] bg-black/40" onClick={cancel} />

      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">Create Ticket</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tool: {toolCallId}
          </p>
        </div>
        <button
          onClick={cancel}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Cancel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <Label className="text-sm font-medium">Subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description of the issue"
            className="mt-1.5 h-10"
          />
          {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
        </div>

        <div>
          <Label className="text-sm font-medium">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide detailed information about the ticket..."
            className="mt-1.5 min-h-[100px] resize-none"
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-sm font-medium">Customer Name</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe"
              className="mt-1.5 h-10"
            />
            {errors.customerName && <p className="mt-1 text-xs text-red-500">{errors.customerName}</p>}
          </div>
          <div>
            <Label className="text-sm font-medium">Customer Email</Label>
            <Input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@example.com"
              className="mt-1.5 h-10"
            />
            {errors.customerEmail && <p className="mt-1 text-xs text-red-500">{errors.customerEmail}</p>}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Priority</Label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full px-4"
            onClick={cancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-9 rounded-full px-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Ticket'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
