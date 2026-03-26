import { Users, ShieldCheck, TrendingUp } from 'lucide-react';
import { RoleStatItemT } from '@/schema/admin/roleStatisticsSchema';

// Role-specific icon/color map
const ROLE_STYLES: Record<string, { color: string; ring: string; bg: string; iconBg: string }> = {
  Admin: {
    color: 'text-violet-600 dark:text-violet-400',
    ring: 'ring-violet-200 dark:ring-violet-800',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
  },
  'Support User': {
    color: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-200 dark:ring-blue-800',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
  },
  'Tech User': {
    color: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
};

const DEFAULT_STYLE = {
  color: 'text-gray-600 dark:text-gray-400',
  ring: 'ring-gray-200 dark:ring-gray-700',
  bg: 'bg-gray-50 dark:bg-gray-900/30',
  iconBg: 'bg-gray-100 dark:bg-gray-800/50',
};

interface IProps {
  role: RoleStatItemT;
  onClick: (role: RoleStatItemT) => void;
}

const RoleCard = ({ role, onClick }: IProps) => {
  const style = ROLE_STYLES[role.name] ?? DEFAULT_STYLE;

  return (
    <button
      onClick={() => onClick(role)}
      className={`group w-full cursor-pointer rounded-2xl border p-5! text-left shadow-sm ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${style.bg} ${style.ring}`}
    >
      {/* Icon + Role name */}
      <div className="flex items-center gap-3!">
        <div className={`flex h-10! w-10! shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}>
          <ShieldCheck className={`h-5! w-5! ${style.color}`} />
        </div>
        <div>
          <p className={`text-sm font-semibold ${style.color}`}>{role.name}</p>
          <p className="text-muted-foreground line-clamp-1 text-xs">{role.description}</p>
        </div>
      </div>

      {/* Divider */}
      <div className={`my-4! h-px w-full ${style.ring} ring-0 border-0 bg-current opacity-10`} />

      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5!">
          <Users className={`h-4! w-4! ${style.color}`} />
          <span className={`text-2xl font-bold ${style.color}`}>{role.user_count}</span>
          <span className="text-muted-foreground text-xs">
            {role.user_count === 1 ? 'member' : 'members'}
          </span>
        </div>
        <div className={`flex items-center gap-1 rounded-full px-2.5! py-1! text-xs font-medium ${style.iconBg} ${style.color} ring-1 ${style.ring} group-hover:scale-105 transition-transform`}>
          <TrendingUp className="h-3! w-3!" />
          View
        </div>
      </div>
    </button>
  );
};

export default RoleCard;
