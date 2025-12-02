import z from 'zod';

export const senderTypeEnum = z.enum(['agent', 'customer', 'ai', 'system']);

const attachmentSchema = z.object({
  filename: z.string(),
  file_path: z.string(), // e.g. "uploads\tickets\..."
  file_size: z.number(), // in bytes
  content_type: z.string(), // e.g. "application/pdf"
});

const messageSchema = z.object({
  id: z.string(),
  ticket_id: z.string(),
  sender_type: senderTypeEnum,
  sender_name: z.string(),
  sender_email: z.email().nullable().optional(),
  message_text: z.string(),
  is_internal_note: z.boolean(),
  attachments: z.array(attachmentSchema).nullable(),
  created_at: z.string(),
});

const ticketMessagesResponseSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  messages: z.array(messageSchema),
});

export type ticketMessagesResponseT = z.infer<
  typeof ticketMessagesResponseSchema
>;
export type messageT = z.infer<typeof messageSchema>;
export type attachmentT = z.infer<typeof attachmentSchema>;

export { messageSchema, ticketMessagesResponseSchema };
