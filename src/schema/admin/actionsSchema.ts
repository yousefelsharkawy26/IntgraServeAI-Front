import z from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────
export const ActionTypeEnum = z.enum(['api_request', 'rpc_request', 'internal']);
export type ActionTypeT = z.infer<typeof ActionTypeEnum>;

// ─── Action Summary (list view) ───────────────────────────────────────────────
const actionSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: ActionTypeEnum,
  active: z.boolean(),
  requires_confirmation: z.boolean().default(false),
});

const actionListResponseSchema = z.object({
  total: z.number(),
  actions: z.array(actionSummarySchema),
});

// ─── Full Action ──────────────────────────────────────────────────────────────
const actionFullSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: ActionTypeEnum,
  active: z.boolean(),
  requires_confirmation: z.boolean().default(false),
  execution_config: z.record(z.unknown()).nullable().optional(),
  parameters: z.record(z.unknown()).nullable().optional(),
  response_config: z.record(z.unknown()).nullable().optional(),
});

// ─── Mutation responses ───────────────────────────────────────────────────────
const actionMutationResponseSchema = z.object({ message: z.string(), id: z.string(), name: z.string() });
const actionToggleResponseSchema = z.object({ message: z.string(), id: z.string(), name: z.string(), active: z.boolean() });
const actionValidateResponseSchema = z.object({ valid: z.boolean(), message: z.string(), warnings: z.array(z.string()).nullable().optional() });

// ─── Action Types ─────────────────────────────────────────────────────────────
const actionTypeInfoSchema = z.object({
  type: z.string(),
  description: z.string(),
  required_config: z.array(z.string()),
  optional_config: z.array(z.string()),
  allowed_param_types: z.array(z.string()),
  allowed_response_modes: z.array(z.string()),
  read_only: z.boolean().default(false),
});
const actionTypesResponseSchema = z.object({ types: z.array(actionTypeInfoSchema) });

// ─── Backup schemas ───────────────────────────────────────────────────────────
const backupInfoSchema = z.object({
  filename: z.string(),
  created_at: z.string(),
  size_bytes: z.number(),
  size_kb: z.number(),
});
const backupListResponseSchema = z.object({ total: z.number(), backups: z.array(backupInfoSchema) });
const backupContentResponseSchema = z.object({ filename: z.string(), content: z.record(z.unknown()), actions_count: z.number() });
const backupRestoreResponseSchema = z.object({ message: z.string(), restored_from: z.string(), actions_count: z.number() });
const backupDeleteResponseSchema = z.object({ message: z.string(), filename: z.string() });
const backupDeleteAllResponseSchema = z.object({ message: z.string(), deleted_count: z.number() });
const backupCompareResponseSchema = z.object({
  filename: z.string(),
  backup_actions_count: z.number(),
  current_actions_count: z.number(),
  added: z.array(z.string()),
  removed: z.array(z.string()),
  modified: z.array(z.string()),
  has_changes: z.boolean(),
});

// ─── Exports ──────────────────────────────────────────────────────────────────
export type ActionSummaryT = z.infer<typeof actionSummarySchema>;
export type ActionListResponseT = z.infer<typeof actionListResponseSchema>;
export type ActionFullT = z.infer<typeof actionFullSchema>;
export type ActionTypeInfoT = z.infer<typeof actionTypeInfoSchema>;
export type BackupInfoT = z.infer<typeof backupInfoSchema>;
export type BackupCompareT = z.infer<typeof backupCompareResponseSchema>;
export type BackupContentT = z.infer<typeof backupContentResponseSchema>;

export {
  actionListResponseSchema, actionFullSchema, actionMutationResponseSchema,
  actionToggleResponseSchema, actionValidateResponseSchema,
  actionTypesResponseSchema, backupListResponseSchema, backupInfoSchema,
  backupContentResponseSchema, backupRestoreResponseSchema,
  backupDeleteResponseSchema, backupDeleteAllResponseSchema, backupCompareResponseSchema,
};
