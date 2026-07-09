import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useActionMutations } from '../hooks/useActions'
import { Button } from '@/components/ui/button'
import {
  actionSchema,
  defaultFormValues,
  type ActionFormData,
} from '@/schemas/actionSchema'
import { actionToFormData, buildCreatePayload } from '@/lib/actionTransforms'
import { BasicInfoFields } from './fields/BasicInfoFields'
import { ApiConfigFields } from './fields/ApiConfigFields'
import { RpcConfigFields } from './fields/RpcConfigFields'
import { InternalConfigFields } from './fields/InternalConfigFields'
import { VectorConfigFields } from './fields/VectorConfigFields'
import { SqlConfigFields } from './fields/SqlConfigFields'
import { KnowledgeConfigFields } from './fields/KnowledgeConfigFields'
import type { Action, ActionType } from '@/types/action'
import { ACTION_TYPE_CONFIGS } from '@/types/action'

const fieldVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' as const },
  exit: { opacity: 0, height: 0 },
}

interface ActionModalProps {
  open: boolean
  onClose: () => void
  action: Action | null
}

const configComponents: Record<string, React.ComponentType> = {
  api_request: ApiConfigFields,
  rpc_request: RpcConfigFields,
  internal: InternalConfigFields,
  vector_query: VectorConfigFields,
  sql_query: SqlConfigFields,
  knowledge_query: KnowledgeConfigFields,
}

export function ActionModal({ open, onClose, action }: ActionModalProps) {
  const { createAction, updateAction } = useActionMutations()

  const methods = useForm<ActionFormData>({
    resolver: zodResolver(actionSchema),
    defaultValues: defaultFormValues,
  })

  const watchedType = methods.watch('type') as ActionType

  useEffect(() => {
    if (action) {
      methods.reset(actionToFormData(action))
    } else {
      methods.reset(defaultFormValues)
    }
  }, [action, methods.reset])

  const onSubmit = (data: ActionFormData) => {
    const payload = buildCreatePayload(data)

    if (action) {
      payload.active = action.status === 'active'
      updateAction.mutate({ id: action.id, data: payload })
    } else {
      createAction.mutate(payload)
    }
    onClose()
  }

  const ConfigComponent = configComponents[watchedType]
  const typeConfig = ACTION_TYPE_CONFIGS[watchedType]

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
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {action ? 'Edit Action' : 'Create Action'}
                </h2>
                {typeConfig && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {typeConfig.description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <FormProvider {...methods}>
              <form
                onSubmit={methods.handleSubmit(
                  onSubmit,
                  (errors) => {
                    console.warn('[ActionModal] validation failed:', errors)
                  },
                )}
                className="p-6 space-y-5"
              >
                <BasicInfoFields />

                {/* Dynamic config section */}
                <AnimatePresence mode="wait">
                  {ConfigComponent && (
                    <motion.div
                      key={watchedType}
                      variants={fieldVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="overflow-hidden"
                    >
                      <ConfigComponent />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer */}
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
                    className="h-9 rounded-full px-6 bg-[var(--color-text-primary)] text-white"
                  >
                    {action ? 'Save Changes' : 'Create Action'}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
