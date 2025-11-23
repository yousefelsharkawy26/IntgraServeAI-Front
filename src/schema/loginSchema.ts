import z from 'zod';

const loginSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .nonempty('password is required')
    .min(8, 'password must be at least 8 characters long'),
});

const loginErrorResponseSchema = z.object({
  message: z.string(),
});

const loginSuccessResponseSchema = z.object({
  token: z.string(),
});

const loginResponseSchema = z.union([
  loginErrorResponseSchema,
  loginSuccessResponseSchema,
]);

export type LoginFormT = z.infer<typeof loginSchema>;
export type LoginErrorResponseT = z.infer<typeof loginErrorResponseSchema>;
export type LoginSuccessResponseT = z.infer<typeof loginSuccessResponseSchema>;
export type LoginResponseT = z.infer<typeof loginResponseSchema>;

export { loginSchema, loginErrorResponseSchema, loginResponseSchema };
