import z from 'zod';

// Input Validation
const resolveTicketRequestSchema = z.object({
  resolution_notes: z.string().min(10, "Resolution notes must be descriptive (at least 10 chars)."),
});

// Output Validation
const resolveTicketResponseSchema = z.object({
  message: z.string(),
  ticket_id: z.string(),
  resolved_at: z.date(), // ISO Date string
});

export type resolveTicketRequestT = z.infer<typeof resolveTicketRequestSchema>;
export type resolveTicketResponseT = z.infer<typeof resolveTicketResponseSchema>;

export { resolveTicketRequestSchema, resolveTicketResponseSchema };