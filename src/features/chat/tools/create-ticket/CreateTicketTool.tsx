// ============================================================
// Create Ticket Tool
// ============================================================
// Collects ticket details from the user and sends them to the
// backend via the Tool SDK. The backend handles the actual
// ticket creation and resumes the AI conversation.
// ============================================================

import { useState } from 'react'
import { useTool } from '../sdk'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Loader2, X } from 'lucide-react'

const CATEGORY_OPTIONS = [
  { value: 'technical', label: 'Technical' },
  { value: 'billing', label: 'Billing' },
  { value: 'account', label: 'Account' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'general', label: 'General Support' },
]

const getParamString = (params: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    const value = params[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}

export function CreateTicketTool() {
  const tool = useTool()
  const isSubmitting = tool.isBusy || tool.submissionStatus === 'submitting'

  // Pre-fill from backend params if available. Keep both title/subject aliases
  // because the chat tool protocol may receive either from existing actions.
  const [title, setTitle] = useState(getParamString(tool.params, 'title', 'subject'))
  const [description, setDescription] = useState(getParamString(tool.params, 'description', 'body'))
  const [priority, setPriority] = useState(getParamString(tool.params, 'priority') || 'medium')
  const [category, setCategory] = useState(getParamString(tool.params, 'category') || 'technical')
  const [customerName, setCustomerName] = useState(getParamString(tool.params, 'customerName', 'customer_name', 'name'))
  const [customerEmail, setCustomerEmail] = useState(getParamString(tool.params, 'customerEmail', 'customer_email', 'email'))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (title.trim().length < 3) nextErrors.title = 'Title must be at least 3 characters'
    if (description.trim().length < 10) nextErrors.description = 'Description must be at least 10 characters'
    if (!CATEGORY_OPTIONS.some((option) => option.value === category)) nextErrors.category = 'Category is required'
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) nextErrors.priority = 'Priority is required'
    if (customerName.trim().length < 2) nextErrors.customerName = 'Customer name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) nextErrors.customerEmail = 'Valid email is required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (isSubmitting || !validate()) return

    tool.setBusy()
    tool.log('Submitting ticket details to backend', 'info')

    // Send exactly one tool_result payload to the backend. The modal remains
    // open in a submitting state until the backend emits tool_end or tool_error.
    tool.complete({
      title: title.trim(),
      subject: title.trim(),
      description: description.trim(),
      priority,
      category,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
    })
  }

  return (
    <div className="fixed left-1/2 top-[5%] z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-y-auto rounded-xl border bg-card shadow-2xl">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[-1] bg-black/40"
        onClick={() => !isSubmitting && tool.cancel()}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">{tool.metadata.definition.label}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {tool.actionName}@{tool.version} • {tool.toolCallId}
          </p>
        </div>
        <button
          type="button"
          onClick={() => tool.cancel()}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          disabled={isSubmitting}
          aria-label="Cancel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        {tool.submissionStatus === 'failed' && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">Ticket creation failed</p>
              <p className="mt-0.5 text-xs">
                {tool.submissionError || 'The backend could not create the ticket. Please review the details and try again.'}
              </p>
            </div>
          </div>
        )}

        <div>
          <Label className="text-sm font-medium">Title</Label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Brief description of the issue"
            className="mt-1.5 h-10"
            disabled={isSubmitting}
            aria-invalid={!!errors.title}
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
        </div>

        <div>
          <Label className="text-sm font-medium">Description</Label>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Provide detailed information about the ticket..."
            className="mt-1.5 min-h-[100px] resize-none"
            disabled={isSubmitting}
            aria-invalid={!!errors.description}
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-sm font-medium">Category</Label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
              disabled={isSubmitting}
              aria-invalid={!!errors.category}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
          </div>

          <div>
            <Label className="text-sm font-medium">Priority</Label>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
              disabled={isSubmitting}
              aria-invalid={!!errors.priority}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            {errors.priority && <p className="mt-1 text-xs text-red-500">{errors.priority}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-sm font-medium">Customer Name</Label>
            <Input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="John Doe"
              className="mt-1.5 h-10"
              disabled={isSubmitting}
              aria-invalid={!!errors.customerName}
            />
            {errors.customerName && <p className="mt-1 text-xs text-red-500">{errors.customerName}</p>}
          </div>
          <div>
            <Label className="text-sm font-medium">Customer Email</Label>
            <Input
              type="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              placeholder="customer@example.com"
              className="mt-1.5 h-10"
              disabled={isSubmitting}
              aria-invalid={!!errors.customerEmail}
            />
            {errors.customerEmail && <p className="mt-1 text-xs text-red-500">{errors.customerEmail}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full px-4"
            onClick={() => tool.cancel()}
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : tool.submissionStatus === 'failed' ? (
              'Retry Create'
            ) : (
              'Create Ticket'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
