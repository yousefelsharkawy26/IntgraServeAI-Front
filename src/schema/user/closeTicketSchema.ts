import z from 'zod';

// Output Validation
const closeTicketResponseSchema = z.object({
  message: z.string(),
  ticket_id: z.string(),
  closed_at: z.string(),
});

export type closeTicketResponseT = z.infer<typeof closeTicketResponseSchema>;
export { closeTicketResponseSchema };