import z from 'zod';

// Input Validation
const cancelTicketRequestSchema = z.object({
  cancellation_reason: z.string().min(5, "Reason is required (at least 5 characters)."),
});

// Output Validation
const cancelTicketResponseSchema = z.object({
  message: z.string(),
  ticket_id: z.string(),
});

export type cancelTicketRequestT = z.infer<typeof cancelTicketRequestSchema>;
export type cancelTicketResponseT = z.infer<typeof cancelTicketResponseSchema>;

export { cancelTicketRequestSchema, cancelTicketResponseSchema };