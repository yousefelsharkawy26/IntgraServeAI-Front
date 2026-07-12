import { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Loader2, X } from 'lucide-react'
import { useActionDetail, useActionMutations } from '../hooks/useActions'
import { Button } from '@/components/ui/button'
import {
  actionSchema,
  defaultFormValues,
  type ActionFormData,
} from '@/schemas/actionSchema'
import { actionToFormData, buildCreatePayload, buildUpdatePayload } from '@/lib/actionTransforms'
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

const configComponents: Record<ActionType, React.ComponentType> = {
  api_request: ApiConfigFields,
  rpc_request: RpcConfigFields,
  internal: InternalConfigFields,
  vector_query: VectorConfigFields,
  sql_query: SqlConfigFields,
  knowledge_query: KnowledgeConfigFields,
}

function cloneDefaultFormValues(): ActionFormData {
  return structuredClone(defaultFormValues)
}

function countValidationErrors(errors: unknown): number {
  if (!errors || typeof errors !== 'object') return 0

  let total = 0
  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue
    total += 'message' in value ? 1 : countValidationErrors(value)
  }
  return total
}

export function ActionModal({ open, onClose, action }: ActionModalProps) {
  const { createAction, updateAction } = useActionMutations()
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  // The list endpoint may return only summary data. Always fetch the detail
  // record before editing so saved execution_config values (URL, headers,
  // response config, parameters, etc.) are available in the modal.
  const actionId = open && action ? action.id : ''
  const {
    data: actionDetail,
    isFetching: isFetchingDetail,
    isError: isDetailError,
  } = useActionDetail(actionId, open && !!actionId)

  const sourceAction = actionDetail || action
  const isEditMode = !!action
  const isSaving = createAction.isPending || updateAction.isPending

  const methods = useForm<ActionFormData>({
    resolver: zodResolver(actionSchema),
    defaultValues: cloneDefaultFormValues(),
    mode: 'onSubmit',
  })

  const { reset, watch, handleSubmit } = methods
  const watchedType = watch('type') as ActionType

  const formValues = useMemo(() => {
    if (!sourceAction) return cloneDefaultFormValues()
    return actionToFormData(sourceAction)
  }, [sourceAction])

  useEffect(() => {
    if (!open) {
      reset(cloneDefaultFormValues())
      setValidationMessage(null)
      return
    }

    reset(formValues)
    setValidationMessage(null)
  }, [formValues, open, reset])

  const closeIfIdle = () => {
    if (!isSaving) onClose()
  }

  const onSubmit = (data: ActionFormData) => {
    setValidationMessage(null)
    const payload = buildCreatePayload(data)

    if (sourceAction) {
      const updatePayload = buildUpdatePayload(data)
      updatePayload.active = sourceAction.status === 'active'
      updateAction.mutate(
        { id: sourceAction.id, data: updatePayload },
        { onSuccess: onClose }
      )
      return
    }

    createAction.mutate(payload, { onSuccess: onClose })
  }

  const onInvalid = (errors: unknown) => {
    const count = countValidationErrors(errors)
    setValidationMessage(
      count > 0
        ? `Please fix ${count} highlighted field${count === 1 ? '' : 's'} before saving.`
        : 'Please review the form before saving.'
    )
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
            onClick={closeIfIdle}
          />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="fixed left-1/2 top-[5%] z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 overflow-y-auto rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {isEditMode ? 'Edit Action' : 'Create Action'}
                </h2>
                {typeConfig && (
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {typeConfig.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeIfIdle}
                disabled={isSaving}
                className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-base)] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close action modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <FormProvider {...methods}>
              <form
                onSubmit={handleSubmit(onSubmit, onInvalid)}
                className="space-y-5 p-6"
              >
                {isFetchingDetail && isEditMode && (
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-base)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading saved action configuration…
                  </div>
                )}

                {isDetailError && isEditMode && (
                  <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Unable to load the full action details. Showing the available cached values.
                  </div>
                )}

                {validationMessage && (
                  <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {validationMessage}
                  </div>
                )}

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
                <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border-light)] pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-full px-4"
                    onClick={closeIfIdle}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving || (isEditMode && isFetchingDetail && !actionDetail)}
                    className="h-9 rounded-full bg-[var(--color-text-primary)] px-6 text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isEditMode ? 'Saving…' : 'Creating…'}
                      </>
                    ) : isEditMode ? (
                      'Save Changes'
                    ) : (
                      'Create Action'
                    )}
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
