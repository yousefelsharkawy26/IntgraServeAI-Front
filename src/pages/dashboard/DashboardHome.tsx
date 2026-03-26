import { useTicketsStatistics } from '@/features/admin/useTicketsStatistics';
import { useUsersStatistics } from '@/features/admin/useUsersStatistics';
import { useAuthContext } from '@/providers/context/auth-context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'motion/react';
import {
  Ticket,
  TriangleAlert,
  Clock,
  TrendingUp,
  Users,
  UserCheck,
  CheckCircle,
  Loader,
} from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number | null | undefined;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  isLoading: boolean;
  index: number;
}

const KpiCard = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  isLoading,
  index,
}: KpiCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: index * 0.07 }}
  >
    <Card className="overflow-hidden border transition-shadow hover:shadow-md">
      <CardContent className="p-5!">
        <div className="flex items-start justify-between gap-3!">
          <div className="space-y-1!">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {title}
            </p>
            {isLoading ? (
              <Skeleton className="h-8! w-16! rounded!" />
            ) : (
              <p className="text-3xl font-bold">{value ?? '—'}</p>
            )}
          </div>
          <div className={`rounded-xl p-3! ${bgColor}`}>
            <Icon className={`h-5! w-5! ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const DashboardHome = () => {
  const { dataUser } = useAuthContext();
  const isAdmin = dataUser?.roles.includes('Admin');

  const { dataTicketsStatistics, isLoadingTicketsStatistics } =
    useTicketsStatistics();
  const { dataUsersStatistics, isLoadingUsersStatistics } =
    useUsersStatistics();

  const ticketCards = [
    {
      title: 'Open Tickets',
      value: dataTicketsStatistics?.open_tickets,
      icon: Ticket,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/40',
      isLoading: isLoadingTicketsStatistics,
    },
    {
      title: 'In Progress',
      value: dataTicketsStatistics?.in_progress_tickets,
      icon: Loader,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/40',
      isLoading: isLoadingTicketsStatistics,
    },
    {
      title: 'Overdue',
      value: dataTicketsStatistics?.overdue_tickets,
      icon: TriangleAlert,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/40',
      isLoading: isLoadingTicketsStatistics,
    },
    {
      title: 'Due Soon',
      value: dataTicketsStatistics?.due_soon_tickets,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/40',
      isLoading: isLoadingTicketsStatistics,
    },
    {
      title: 'Resolved',
      value: dataTicketsStatistics?.resolved_tickets,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/40',
      isLoading: isLoadingTicketsStatistics,
    },
    {
      title: 'Tickets Today',
      value: dataTicketsStatistics?.tickets_today,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/40',
      isLoading: isLoadingTicketsStatistics,
    },
  ];

  const adminCards = [
    {
      title: 'Total Users',
      value: dataUsersStatistics?.total_users,
      icon: Users,
      color: 'text-sky-600',
      bgColor: 'bg-sky-100 dark:bg-sky-900/40',
      isLoading: isLoadingUsersStatistics,
    },
    {
      title: 'Active Users',
      value: dataUsersStatistics?.active_users,
      icon: UserCheck,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100 dark:bg-teal-900/40',
      isLoading: isLoadingUsersStatistics,
    },
  ];

  return (
    <div className="space-y-8! p-6!">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back,{' '}
          <span className="font-medium">
            {dataUser?.full_name ?? 'Agent'}
          </span>
          . Here&apos;s a summary of the current system state.
        </p>
      </div>

      {/* Ticket KPIs */}
      <div>
        <h2 className="mb-4! border-l-2 border-primary pl-3! text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Ticket Overview
        </h2>
        <div className="grid gap-4! sm:grid-cols-2! lg:grid-cols-3!">
          {ticketCards.map((card, i) => (
            <KpiCard key={card.title} {...card} index={i} />
          ))}
        </div>
      </div>

      {/* Avg times */}
      <div>
        <h2 className="mb-4! border-l-2 border-primary pl-3! text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Performance
        </h2>
        <div className="grid gap-4! sm:grid-cols-2!">
          <KpiCard
            title="Avg. Resolution Time"
            value={
              dataTicketsStatistics?.avg_resolution_time_hours != null
                ? `${dataTicketsStatistics.avg_resolution_time_hours}h`
                : null
            }
            icon={CheckCircle}
            color="text-green-600"
            bgColor="bg-green-100 dark:bg-green-900/40"
            isLoading={isLoadingTicketsStatistics}
            index={6}
          />
          <KpiCard
            title="Avg. Response Time"
            value={
              dataTicketsStatistics?.avg_response_time_hours != null
                ? `${dataTicketsStatistics.avg_response_time_hours}h`
                : null
            }
            icon={Clock}
            color="text-blue-600"
            bgColor="bg-blue-100 dark:bg-blue-900/40"
            isLoading={isLoadingTicketsStatistics}
            index={7}
          />
        </div>
      </div>

      {/* Admin-only user stats */}
      {isAdmin && (
        <div>
          <h2 className="mb-4 border-l-2 border-primary pl-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            User Management
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {adminCards.map((card, i) => (
              <KpiCard key={card.title} {...card} index={i + 8} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
