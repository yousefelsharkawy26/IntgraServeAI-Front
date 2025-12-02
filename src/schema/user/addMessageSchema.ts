import z from 'zod';

// Input Validation (UI Logic)
export const addMessageFormSchema = z
  .object({
    ticketId: z.string(),

    message_text: z.string().optional(),
    is_internal_note: z.boolean().default(false),
    files: z.array(z.instanceof(File)).max(5, 'Max 5 files allowed').optional(),
  })
  .refine(
    (data) =>
      data.message_text?.trim() || (data.files && data.files.length > 0),
    {
      message: 'Message text or at least one file is required.',
      path: ['message_text'],
    },
  );

// Output Validation (API Response)
export const addMessageResponseSchema = z.object({
  message: z.string(),
  message_id: z.string(),
});

export const addMessageErrorResponseSchema = z.object({
  message: z.string(),
});

export type addMessageRequestT = z.infer<typeof addMessageFormSchema>;
export type addMessageResponseT = z.infer<typeof addMessageResponseSchema>;
export type addMessageErrorResponseT = z.infer<
  typeof addMessageErrorResponseSchema
>;
