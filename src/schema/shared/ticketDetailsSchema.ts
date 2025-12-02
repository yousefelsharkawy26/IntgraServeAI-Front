import z from 'zod';
import { ticketPriorityEnum, ticketStatusEnum, ticketTypeEnum } from './allTicketsSchema';

const ticketDetailsSchema = z.object({
  id: z.string(),
  ticket_type: ticketTypeEnum,
  title: z.string(),
  description: z.string(),
  
  customer_email: z.email(),
  customer_name: z.string(),
  external_customer_id: z.string().nullable().optional(),

  status: ticketStatusEnum,
  priority: ticketPriorityEnum,

  ai_auto_created: z.boolean(),
  ai_confidence: z.number().nullable(),

  sla_due_date: z.string().nullable(),
  assignee_id: z.string().nullable(),
  assignee_name: z.string().nullable(),
  assigned_at: z.string().nullable(),
  
  is_closed: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ticketDetailsResponseT = z.infer<typeof ticketDetailsSchema>;
export { ticketDetailsSchema };