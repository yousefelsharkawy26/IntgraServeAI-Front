import z from 'zod';

const deleteTicketByIdResponseSchema = z.object({
  message: z.string(),
  ticket_id: z.string(),
});

export type deleteTicketByIdT = z.infer<typeof deleteTicketByIdResponseSchema>;

export { deleteTicketByIdResponseSchema };
