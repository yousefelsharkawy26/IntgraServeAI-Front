import z from 'zod';
import { ticketTypeEnum } from '../shared/allTicketsSchema';

// Input Schema
const reassignTicketRequestSchema = z.object({
  reason: z.string().min(5, "Reason is required (at least 5 characters)"),
});

// Output Schema
const reassignTicketResponseSchema = z.object({
  message: z.string(),
  ticket_id: z.string(),
  new_ticket_type: ticketTypeEnum,
});

export type reassignTicketRequestT = z.infer<typeof reassignTicketRequestSchema>;
export type reassignTicketResponseT = z.infer<typeof reassignTicketResponseSchema>;

export { reassignTicketRequestSchema, reassignTicketResponseSchema };