import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2 } from 'lucide-react'
import { useActionMutations } from '../hooks/useActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ACTION_TYPES, HTTP_METHODS, ACTION_TYPE_CONFIG } from '@/constants/actions'
import type { Action, ActionType } from '@/types/action'

const actionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['api_request', 'rpc_request', 'internal']),
  requiresConfirmation: z.boolean(),
  apiConfig: z.object({
    protocol: z.enum(['http', 'https']),
    url: z.string().min(1, 'URL is required'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    headers: z.array(z.object({ key: z.string(), value: z.string() })),
    parameters: z.array(z.object({ key: z.string(), value: z.string(), required: z.boolean() })),
    timeout: z.number().min(1000).max(60000),
    responseConfig: z.object({ path: z.string().optional(), mapping: z.record(z.string(), z.any()).optional() }),
  }).optional(),
  rpcConfig: z.object({
    host: z.string().min(1),
    service: z.string().min(1),
    method: z.string().min(1),
    protoFile: z.string().min(1),
    timeout: z.number().min(1000).max(60000),
  }).optional(),
  internalConfig: z.object({
    handler: z.string().min(1),
  }).optional(),
})

type ActionFormData = z.infer<typeof actionSchema>

interface ActionModalProps {
  open: boolean
  onClose: () => void
  action: Action | null
}

export function ActionModal({ open, onClose, action }: ActionModalProps) {
  const { createAction, updateAction } = useActionMutations()
  const [type, setType] = useState<ActionType>('api_request')

  const { register, handleSubmit, watch, setValue, control, reset, formState: { errors } } = useForm<ActionFormData>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'api_request',
      requiresConfirmation: false,
      apiConfig: { protocol: 'https', url: '', method: 'POST', headers: [], parameters: [], timeout: 5000, responseConfig: {} },
      rpcConfig: { host: '', service: '', method: '', protoFile: '', timeout: 3000 },
      internalConfig: { handler: '' },
    },
  })

  const { fields: headerFields, append: appendHeader, remove: removeHeader } = useFieldArray({ control, name: 'apiConfig.headers' as const })
  const { fields: paramFields, append: appendParam, remove: removeParam } = useFieldArray({ control, name: 'apiConfig.parameters' as const })

  const watchedType = watch('type')

  useEffect(() => {
    if (watchedType) setType(watchedType)
  }, [watchedType])

  useEffect(() => {
    if (action) {
      reset({
        name: action.name,
        description: action.description,
        type: action.type,
        requiresConfirmation: action.requiresConfirmation,
        apiConfig: action.apiConfig || { protocol: 'https', url: '', method: 'POST', headers: [], parameters: [], timeout: 5000, responseConfig: {} },
        rpcConfig: action.rpcConfig || { host: '', service: '', method: '', protoFile: '', timeout: 3000 },
        internalConfig: action.internalConfig || { handler: '' },
      })
      setType(action.type)
    } else {
      reset({
        name: '',
        description: '',
        type: 'api_request',
        requiresConfirmation: false,
        apiConfig: { protocol: 'https', url: '', method: 'POST', headers: [], parameters: [], timeout: 5000, responseConfig: {} },
        rpcConfig: { host: '', service: '', method: '', protoFile: '', timeout: 3000 },
        internalConfig: { handler: '' },
      })
      setType('api_request')
    }
  }, [action, reset])

  const onSubmit = (data: ActionFormData) => {
    const payload = {
      ...data,
      apiConfig: data.type === 'api_request' ? data.apiConfig : undefined,
      rpcConfig: data.type === 'rpc_request' ? data.rpcConfig : undefined,
      internalConfig: data.type === 'internal' ? data.internalConfig : undefined,
    }

    if (action) {
      updateAction.mutate({ id: action.id, data: payload })
    } else {
      createAction.mutate(payload as any)
    }
    onClose()
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
            className="fixed left-1/2 top-[5%] z-50 w-full max-w-2xl -translate-x-1/2 rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {action ? 'Edit Action' : 'Create Action'}
              </h2>
              <button onClick={onClose} className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {/* Basic Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="text-sm font-medium">Name</Label>
                  <Input {...register('name')} placeholder="e.g., Get Product Info" className="mt-1.5 h-10" />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <Textarea {...register('description')} placeholder="What does this action do?" className="mt-1.5 min-h-[60px]" />
                  {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Select value={type} onValueChange={(v) => { setValue('type', v as ActionType); setType(v as ActionType) }}>
                    <SelectTrigger className="mt-1.5 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{ACTION_TYPE_CONFIG[t].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={watch('requiresConfirmation')} onCheckedChange={(v) => setValue('requiresConfirmation', v)} />
                    Requires Confirmation
                  </label>
                </div>
              </div>

              {/* Dynamic Fields */}
              <AnimatePresence mode="wait">
                {type === 'api_request' && (
                  <motion.div key="api" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">API Configuration</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Protocol</Label>
                        <Select value={watch('apiConfig.protocol')} onValueChange={(v) => setValue('apiConfig.protocol', v as 'http' | 'https')}>
                          <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="http">HTTP</SelectItem>
                            <SelectItem value="https">HTTPS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Method</Label>
                        <Select value={watch('apiConfig.method')} onValueChange={(v) => setValue('apiConfig.method', v as any)}>
                          <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {HTTP_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs">URL</Label>
                        <Input {...register('apiConfig.url')} placeholder="https://api.example.com/endpoint" className="mt-1 h-9 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">Timeout (ms)</Label>
                        <Input type="number" {...register('apiConfig.timeout', { valueAsNumber: true })} className="mt-1 h-9 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">Response Path</Label>
                        <Input {...register('apiConfig.responseConfig.path')} placeholder="data.result" className="mt-1 h-9 text-xs" />
                      </div>
                    </div>

                    {/* Headers */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Headers</Label>
                        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => appendHeader({ key: '', value: '' })}>
                          <Plus className="h-3 w-3" /> Add
                        </Button>
                      </div>
                      {headerFields.map((field, i) => (
                        <div key={field.id} className="mt-2 flex items-center gap-2">
                          <Input {...register(`apiConfig.headers.${i}.key`)} placeholder="Key" className="h-8 text-xs flex-1" />
                          <Input {...register(`apiConfig.headers.${i}.value`)} placeholder="Value" className="h-8 text-xs flex-1" />
                          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeHeader(i)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Parameters */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Parameters</Label>
                        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => appendParam({ key: '', value: '', required: false })}>
                          <Plus className="h-3 w-3" /> Add
                        </Button>
                      </div>
                      {paramFields.map((field, i) => (
                        <div key={field.id} className="mt-2 flex items-center gap-2">
                          <Input {...register(`apiConfig.parameters.${i}.key`)} placeholder="Key" className="h-8 text-xs flex-1" />
                          <Input {...register(`apiConfig.parameters.${i}.value`)} placeholder="Value" className="h-8 text-xs flex-1" />
                          <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                            <input type="checkbox" {...register(`apiConfig.parameters.${i}.required`)} className="rounded" />
                            Req
                          </label>
                          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeParam(i)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {type === 'rpc_request' && (
                  <motion.div key="rpc" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">RPC Configuration</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Host</Label>
                        <Input {...register('rpcConfig.host')} placeholder="localhost:50051" className="mt-1 h-9 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">Service</Label>
                        <Input {...register('rpcConfig.service')} placeholder="StatusService" className="mt-1 h-9 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">Method</Label>
                        <Input {...register('rpcConfig.method')} placeholder="CheckHealth" className="mt-1 h-9 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">Proto File</Label>
                        <Input {...register('rpcConfig.protoFile')} placeholder="status.proto" className="mt-1 h-9 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">Timeout (ms)</Label>
                        <Input type="number" {...register('rpcConfig.timeout', { valueAsNumber: true })} className="mt-1 h-9 text-xs" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {type === 'internal' && (
                  <motion.div key="internal" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Internal Configuration</h3>
                    <div>
                      <Label className="text-xs">Handler Function</Label>
                      <Input {...register('internalConfig.handler')} placeholder="e.g., productSearchHandler" className="mt-1 h-9 text-xs" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border-light)]">
                <Button type="button" variant="outline" className="h-9 rounded-full px-4" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="h-9 rounded-full px-6 bg-[var(--color-text-primary)] text-white">
                  {action ? 'Save Changes' : 'Create Action'}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
