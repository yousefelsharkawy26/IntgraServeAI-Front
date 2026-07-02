export interface DashboardMetrics {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  activeActions: number
  usersCount: number
  slaPerformance: number
}

export interface TicketTrendPoint {
  date: string
  created: number
  resolved: number
}

export interface TicketStatusDistribution {
  status: string
  count: number
}

export interface ResponseTimePoint {
  date: string
  avgResponseTime: number
  slaTarget: number
}

export interface ActionUsagePoint {
  action: string
  usage: number
}

export interface RecentActivity {
  id: string
  type: 'ticket_created' | 'ticket_updated' | 'ticket_resolved' | 'user_login' | 'action_triggered' | 'backup_created'
  description: string
  actor: string
  timestamp: string
}

export interface RecentTicket {
  id: string
  subject: string
  requester: string
  priority: string
  status: string
  updatedAt: string
}

export interface SystemStatus {
  service: string
  status: 'operational' | 'degraded' | 'down'
  uptime: string
}

export interface DashboardData {
  metrics: DashboardMetrics
  ticketTrends: TicketTrendPoint[]
  statusDistribution: TicketStatusDistribution[]
  responseTimes: ResponseTimePoint[]
  actionUsage: ActionUsagePoint[]
  recentActivities: RecentActivity[]
  recentTickets: RecentTicket[]
  systemStatus: SystemStatus[]
}
