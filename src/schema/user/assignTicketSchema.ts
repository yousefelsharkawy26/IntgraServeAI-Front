import z from 'zod';

// Success Response Schema
const assignTicketResponseSchema = z.object({
  message: z.string(),
  ticket_id: z.string(),
  assignee_name: z.string(),
});

// Error Response Schema (Optional but good for typing)
const assignTicketErrorSchema = z.object({
  message: z.string(),
});

export type assignTicketResponseT = z.infer<typeof assignTicketResponseSchema>;
export { assignTicketResponseSchema, assignTicketErrorSchema };