import type { DashboardData } from '@/types/dashboard'
import { mapBackendTicketToFrontend } from './ticket.mapper'

export const mapDashboardData = (
  ticketStats: any,
  userStats: any,
  actions: any[],
  recentTickets: any[] = []
): DashboardData => {
  const t = ticketStats || {}
  const u = userStats || {}
  const acts = actions || []
  
  const total = t.total_tickets || 0
  const overdue = t.overdue_tickets || 0
  const slaPerformance = total > 0 ? Math.round(100 - (overdue / total) * 100) : 100

  // Count active actions
  const activeActions = acts.filter((a: any) => a.active || a.status === 'active').length

  const mappedRecentTickets = recentTickets.map((rt: any) => {
    const ft = mapBackendTicketToFrontend(rt)
    return {
      id: ft.id,
      subject: ft.subject,
      requester: ft.customerEmail,
      priority: ft.priority,
      status: ft.status,
      updatedAt: ft.updatedAt,
    }
  })

  return {
    metrics: {
      totalTickets: total,
      openTickets: t.open_tickets || 0,
      resolvedTickets: t.resolved_tickets || 0,
      activeActions: activeActions,
      usersCount: u.total_users || 0,
      slaPerformance: slaPerformance,
    },
    ticketTrends: [
      { date: 'Today', created: t.tickets_today || 0, resolved: t.resolved_tickets || 0 },
      { date: 'This Week', created: t.tickets_this_week || 0, resolved: t.resolved_tickets || 0 },
      { date: 'This Month', created: t.tickets_this_month || 0, resolved: t.resolved_tickets || 0 },
    ],
    statusDistribution: [
      { status: 'Open', count: t.open_tickets || 0 },
      { status: 'In Progress', count: t.in_progress_tickets || 0 },
      { status: 'Pending', count: t.pending_tickets || 0 },
      { status: 'Escalated', count: t.escalated_tickets || 0 },
      { status: 'Resolved', count: t.resolved_tickets || 0 },
      { status: 'Closed', count: t.closed_tickets || 0 },
    ],
    responseTimes: [
      { date: 'Avg Response', avgResponseTime: t.avg_response_time_hours || 0, slaTarget: 5 },
      { date: 'Avg Resolution', avgResponseTime: t.avg_resolution_time_hours || 0, slaTarget: 24 },
    ],
    actionUsage: acts.slice(0, 4).map((a: any) => ({
      action: a.name || 'Action',
      usage: a.usage_count || a.execution_count || 0,
    })),
    recentActivities: [
      { id: '1', type: 'ticket_created', description: `${t.tickets_today || 0} tickets created today`, actor: 'System', timestamp: new Date().toISOString() },
      { id: '2', type: 'user_login', description: `${u.recent_logins || 0} recent user logins`, actor: 'System', timestamp: new Date().toISOString() },
      { id: '3', type: 'ticket_resolved', description: `${t.resolved_tickets || 0} tickets resolved in total`, actor: 'System', timestamp: new Date().toISOString() },
    ],
    recentTickets: mappedRecentTickets.slice(0, 5),
    systemStatus: [],
  }
}
