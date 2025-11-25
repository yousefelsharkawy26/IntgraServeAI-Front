import z from 'zod';

// --- Request Schema ---
const updateProfileRequestSchema = z.object({
  email: z
    .email({ message: 'Value is not a valid email address' }),
  full_name: z
    .string()
    .min(2, { message: 'Full name must be at least 2 characters long' }),
});

// --- Response Schema (Success) ---
const updateProfileResponseSchema = z.object({
  message: z.string(),
});

// --- Response Schema (Error) ---
// Matches: { "errors": { "email": "...", "full_name": "..." } }
const updateProfileErrorResponseSchema = z.object({
  errors: z.record(z.string(), z.string().optional()),
});

// --- Types ---
export type updateProfileRequestT = z.infer<typeof updateProfileRequestSchema>;
export type updateProfileResponseT = z.infer<typeof updateProfileResponseSchema>;
export type updateProfileErrorResponseT = z.infer<
  typeof updateProfileErrorResponseSchema
>;

// --- Exports ---
export {
  updateProfileRequestSchema,
  updateProfileResponseSchema,
  updateProfileErrorResponseSchema,
};