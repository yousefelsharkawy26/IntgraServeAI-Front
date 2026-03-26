import z from 'zod';

// ── Forgot Password ────────────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z.email('Please enter a valid email address'),
});
export type ForgotPasswordFormT = z.infer<typeof forgotPasswordSchema>;
export const forgotPasswordResponseSchema = z.object({ message: z.string() });
export type ForgotPasswordResponseT = z.infer<typeof forgotPasswordResponseSchema>;

// ── Reset Password ─────────────────────────────────────────────────────────────
export const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });
export type ResetPasswordFormT = z.infer<typeof resetPasswordSchema>;
export const resetPasswordResponseSchema = z.object({ message: z.string() });
export type ResetPasswordResponseT = z.infer<typeof resetPasswordResponseSchema>;
