import z from 'zod';
import { ticketStatusEnum } from '../shared/allTicketsSchema'; 

const updateTicketStatusRequestSchema = z.object({
  status: ticketStatusEnum,
  notes: z.string().min(5, "Notes must be at least 5 characters"), 
});

const updateTicketStatusResponseSchema = z.object({
  message: z.string(),
  ticket_id: z.string(),
  old_status: ticketStatusEnum,
  new_status: ticketStatusEnum,
});

export type updateTicketStatusRequestT = z.infer<typeof updateTicketStatusRequestSchema>;
export type updateTicketStatusResponseT = z.infer<typeof updateTicketStatusResponseSchema>;

export { updateTicketStatusRequestSchema, updateTicketStatusResponseSchema };