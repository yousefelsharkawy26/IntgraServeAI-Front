import z from 'zod';

// --- Request Schema ---
const changePasswordRequestSchema = z.object({
  current_password: z.string().min(1, { message: 'Current password is required' }),
  new_password: z.string().min(6, { message: 'New password must be at least 6 characters' }),
});

const changePasswordFormSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

// --- Response Schema (Success) ---
const changePasswordResponseSchema = z.object({
  message: z.string(),
});

// --- Response Schema (Error) ---
// Matches: { "message": "Current password is incorrect" }
const changePasswordErrorResponseSchema = z.object({
  message: z.string(),
});

// --- Types ---
export type changePasswordRequestT = z.infer<typeof changePasswordRequestSchema>;
export type changePasswordResponseT = z.infer<typeof changePasswordResponseSchema>;
export type changePasswordErrorResponseT = z.infer<
  typeof changePasswordErrorResponseSchema
>;

// --- Exports ---
export {
  changePasswordRequestSchema,
  changePasswordResponseSchema,
  changePasswordErrorResponseSchema,
  changePasswordFormSchema
};