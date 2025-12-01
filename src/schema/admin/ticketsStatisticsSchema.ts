import z from 'zod';

const ticketsStatisticsSchema = z.object({
  total_tickets: z.number(),
  open_tickets: z.number(),
  in_progress_tickets: z.number(),
  pending_tickets: z.number(),
  escalated_tickets: z.number(),
  resolved_tickets: z.number(),
  closed_tickets: z.number(),
  canceled_tickets: z.number(),
  urgent_tickets: z.number(),
  high_priority_tickets: z.number(),
  medium_priority_tickets: z.number(),
  low_priority_tickets: z.number(),
  tech_tickets: z.number(),
  support_tickets: z.number(),
  assigned_tickets: z.number(),
  unassigned_tickets: z.number(),
  overdue_tickets: z.number(),
  due_soon_tickets: z.number(),
  ai_created_tickets: z.number(),
  manual_created_tickets: z.number(),
  avg_resolution_time_hours: z.number().nullable(),
  avg_response_time_hours: z.number().nullable(),
  tickets_today: z.number(),
  tickets_this_week: z.number(),
  tickets_this_month: z.number(),
});

export type ticketsStatisticsT = z.infer<typeof ticketsStatisticsSchema>;

export { ticketsStatisticsSchema };
