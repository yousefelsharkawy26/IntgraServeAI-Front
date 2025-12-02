import z from 'zod';

export const ticketStatusEnum = z.enum([
  'open',
  'in_progress',
  'pending',
  'escalated',
  'resolved',
  'closed',
  'canceled',
]);
export const ticketPriorityEnum = z.enum(['urgent', 'high', 'medium', 'low']);
export const ticketTypeEnum = z.enum(['tech', 'support']);
export const ticketSortByEnum = z.enum(['created_at', 'updated_at']);

const ticketSchema = z.object({
  id: z.string(),
  ticket_type: ticketTypeEnum,
  title: z.string(),
  customer_email: z.string(),
  customer_name: z.string(),
  status: ticketStatusEnum,
  priority: ticketPriorityEnum,
  assignee_id: z.string().nullable(),
  assignee_name: z.string().nullable(),
  created_at: z.string(),
});

const allTicketsResponseSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  tickets: z.array(ticketSchema),
});

export type allTicketsResponseT = z.infer<typeof allTicketsResponseSchema>;
export type ticketStatusEnumT = z.infer<typeof ticketStatusEnum>;
export type ticketPriorityEnumT = z.infer<typeof ticketPriorityEnum>;
export type ticketTypeEnumT = z.infer<typeof ticketTypeEnum>;
export type ticketSortByEnumT = z.infer<typeof ticketSortByEnum>;

export { ticketSchema, allTicketsResponseSchema };
