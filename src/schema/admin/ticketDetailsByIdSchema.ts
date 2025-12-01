import z from 'zod';
import {
  ticketPriorityEnum,
  ticketStatusEnum,
  ticketTypeEnum,
} from './allTicketsSchema';

const ticketDetailsByIdSchema = z.object({
  id: z.string(),
  ticket_type: ticketTypeEnum,
  title: z.string(),
  description: z.string().nullable(),
  customer_email: z.email(),
  customer_name: z.string(),
  external_customer_id: z.string(),
  status: ticketStatusEnum,

  priority: ticketPriorityEnum,

  ai_auto_created: z.boolean(),
  ai_confidence: z.number().nullable(),

  sla_due_date: z.string().nullable(),

  assignee_id: z.string().nullable(),
  assignee_name: z.string().nullable(),
  assigned_at: z.string().nullable(),

  previous_assignee_id: z.string().nullable(),

  is_closed: z.boolean(),
  is_active: z.boolean(),

  closed_at: z.string().nullable(),
  resolution_notes: z.string().nullable(),
  cancellation_reason: z.string().nullable(),
  escalation_reason: z.string().nullable(),
  resolved_at: z.string().nullable(),

  created_at: z.string(),
  updated_at: z.string(),
});

export type ticketDetailsByIdT = z.infer<typeof ticketDetailsByIdSchema>;

export { ticketDetailsByIdSchema };
