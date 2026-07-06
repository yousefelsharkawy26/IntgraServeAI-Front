import { motion } from 'framer-motion'
import { Activity, Ticket, MessageSquare, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useDashboardData } from '../hooks/useDashboardData'
import { MetricCard } from '@/components/common/MetricCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { RevealCard } from '@/components/common/RevealCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'

const COLORS = ['#3B82F6', '#F97316', '#EAB308', '#8B5CF6', '#22C55E', '#94A3B8']

export default function DashboardView() {
  const { data, isLoading } = useDashboardData()

  if (isLoading || !data) {
    return <DashboardSkeleton />
  }

  const { metrics, ticketTrends, statusDistribution, responseTimes, actionUsage, recentActivities, recentTickets, systemStatus } = data

  return (
    <motion.div className="space-y-6">
      {/* Metrics Grid — already staggered via MetricCard index */}
      <div className="grid grid-cols-2 gap-0 rounded-lg border border-[var(--color-bg-grid)] md:grid-cols-3 lg:grid-cols-6 overflow-hidden">
        <MetricCard label="Tickets" value={metrics.totalTickets} subtitle="Total Tickets" color="text-[var(--color-accent-orange)]" index={0} />
        <MetricCard label="Open" value={metrics.openTickets} subtitle="Open tickets" index={1} />
        <MetricCard label="Resolved" value={metrics.resolvedTickets} subtitle="This month" color="text-green-600" index={2} />
        <MetricCard label="Actions" value={metrics.activeActions} subtitle="Active actions" index={3} />
        <MetricCard label="Users" value={metrics.usersCount} subtitle="Team members" index={4} />
        <MetricCard label="SLA" value={metrics.slaPerformance} subtitle="Performance" suffix="%" color="text-[var(--color-accent-blue)]" index={5} />
      </div>

      {/* Charts Row */}
      <RevealCard delay={0.1}>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-[var(--color-border-light)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <TrendingUp className="h-4 w-4 text-[var(--color-text-muted)]" />
                Ticket Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={ticketTrends}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--color-border-medium)',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Area type="monotone" dataKey="created" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorCreated)" name="Created" />
                  <Area type="monotone" dataKey="resolved" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-[var(--color-border-light)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Ticket className="h-4 w-4 text-[var(--color-text-muted)]" />
                Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="count" nameKey="status">
                    {statusDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--color-border-medium)',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {statusDistribution.map((entry, index) => (
                  <div key={entry.status} className="flex items-center gap-1 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[var(--color-text-muted)]">{entry.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </RevealCard>

      {/* Second Charts Row */}
      <RevealCard delay={0.2}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-[var(--color-border-light)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Activity className="h-4 w-4 text-[var(--color-text-muted)]" />
                Response Time vs SLA Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={responseTimes}>
                  <defs>
                    <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} unit="m" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border-medium)', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="avgResponseTime" stroke="#F97316" strokeWidth={2} fill="url(#colorResponse)" name="Avg Response" />
                  <Area type="monotone" dataKey="slaTarget" stroke="#22C55E" strokeWidth={2} strokeDasharray="5 5" fill="none" name="SLA Target" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-[var(--color-border-light)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <MessageSquare className="h-4 w-4 text-[var(--color-text-muted)]" />
                Action Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={actionUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="action" type="category" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border-medium)', fontSize: '12px' }} />
                  <Bar dataKey="usage" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </RevealCard>

      {/* Bottom Row */}
      <RevealCard delay={0.3}>
        <div className={`grid gap-6 ${systemStatus.length > 0 ? 'lg:grid-cols-3' : ''}`}>
          <Card className={`border-[var(--color-border-light)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${systemStatus.length === 0 ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Ticket className="h-4 w-4 text-[var(--color-text-muted)]" />
                Recent Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-light)]">
                      <th className="pb-2 text-left font-medium text-[var(--color-text-muted)]">ID</th>
                      <th className="pb-2 text-left font-medium text-[var(--color-text-muted)]">Subject</th>
                      <th className="pb-2 text-left font-medium text-[var(--color-text-muted)]">Priority</th>
                      <th className="pb-2 text-left font-medium text-[var(--color-text-muted)]">Status</th>
                      <th className="pb-2 text-right font-medium text-[var(--color-text-muted)]">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTickets.map((ticket) => (
                      <tr key={ticket.id} className="group border-b border-[var(--color-border-light)] transition-all duration-200 hover:bg-[var(--color-bg-base)] hover:scale-[1.002]">
                        <td className="py-3 font-mono text-xs text-[var(--color-text-muted)]">#{ticket.id}</td>
                        <td className="py-3 max-w-[200px] truncate text-[var(--color-text-primary)]">{ticket.subject}</td>
                        <td className="py-3"><PriorityBadge priority={ticket.priority as any} /></td>
                        <td className="py-3"><StatusBadge status={ticket.status as any} /></td>
                        <td className="py-3 text-right text-xs text-[var(--color-text-muted)]">
                          {new Date(ticket.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {systemStatus.length > 0 && (
            <Card className="border-[var(--color-border-light)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Activity className="h-4 w-4 text-[var(--color-text-muted)]" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemStatus.map((service) => (
                  <div key={service.service} className="flex items-center justify-between rounded-lg bg-[var(--color-bg-base)] px-3 py-2.5 transition-all duration-200 hover:bg-[var(--color-bg-surface)] hover:shadow-sm">
                    <div className="flex items-center gap-2">
                      {service.status === 'operational' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="text-sm text-[var(--color-text-primary)]">{service.service}</span>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]">{service.uptime}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </RevealCard>

      {/* Recent Activities */}
      <RevealCard delay={0.35}>
        <Card className="border-[var(--color-border-light)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="h-4 w-4 text-[var(--color-text-muted)]" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 rounded-lg border border-[var(--color-border-light)] px-4 py-3 transition-all duration-200 hover:bg-[var(--color-bg-base)] hover:shadow-sm hover:scale-[1.002]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-base)]">
                    <Activity className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text-primary)]">{activity.description}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">by {activity.actor}</p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </RevealCard>
    </motion.div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-0 rounded-lg border border-[var(--color-bg-grid)] md:grid-cols-3 lg:grid-cols-6 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b border-r border-[var(--color-bg-grid)] bg-[var(--color-bg-surface)] px-6 py-5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-9 w-20" />
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}
