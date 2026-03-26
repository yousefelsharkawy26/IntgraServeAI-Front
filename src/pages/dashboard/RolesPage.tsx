import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Users, BarChart3 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import getRoleStatistics from '@/services/admin/apiRoleStatistics';
import { RoleStatItemT } from '@/schema/admin/roleStatisticsSchema';
import RoleCard from '@/features/admin/RoleCard';
import DrawerRoleUsers from '@/features/admin/DrawerRoleUsers';

const RolesPage = () => {
  const [selectedRole, setSelectedRole] = useState<RoleStatItemT | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['role-statistics'],
    queryFn: getRoleStatistics,
  });

  return (
    <div className="space-y-6!">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4! md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="ml-6! text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground mt-1 ml-6!">
            Manage system roles and view members per role.
          </p>
        </div>
      </div>

      {/* ── Stats Strip ─────────────────────────────────────────────── */}
      {data && (
        <div className="mx-6! grid grid-cols-2 gap-4! sm:grid-cols-3">
          {/* Total Roles */}
          <div className="bg-card flex items-center gap-4! rounded-2xl border p-5! shadow-sm ring-1 ring-border/50">
            <div className="flex h-10! w-10! items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <ShieldCheck className="h-5! w-5! text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.total_roles}</p>
              <p className="text-muted-foreground text-xs">Total Roles</p>
            </div>
          </div>

          {/* Total Assignments */}
          <div className="bg-card flex items-center gap-4! rounded-2xl border p-5! shadow-sm ring-1 ring-border/50">
            <div className="flex h-10! w-10! items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-5! w-5! text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.roles.reduce((sum, r) => sum + r.user_count, 0)}</p>
              <p className="text-muted-foreground text-xs">Total Assignments</p>
            </div>
          </div>

          {/* Most Assigned */}
          {data.roles.length > 0 && (() => {
            const top = [...data.roles].sort((a, b) => b.user_count - a.user_count)[0];
            return (
              <div className="bg-card col-span-2 flex items-center gap-4! rounded-2xl border p-5! shadow-sm ring-1 ring-border/50 sm:col-span-1">
                <div className="flex h-10! w-10! items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <BarChart3 className="h-5! w-5! text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-base font-bold leading-tight">{top.name}</p>
                  <p className="text-muted-foreground text-xs">Most Assigned Role</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Role Cards ──────────────────────────────────────────────── */}
      <div className="mx-6!">
        {isLoading ? (
          <div className="flex justify-center py-24!">
            <Spinner className="text-primary size-10!" />
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 py-20! text-center text-sm text-destructive">
            Failed to load role statistics.
          </div>
        ) : data?.roles.length === 0 ? (
          <div className="flex flex-col items-center gap-3! py-24! text-center">
            <ShieldCheck className="text-muted-foreground h-12! w-12!" />
            <p className="text-muted-foreground text-sm">No roles found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4! sm:grid-cols-2 lg:grid-cols-3">
            {data?.roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onClick={(r) => setSelectedRole(r)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Members Drawer ──────────────────────────────────────────── */}
      <DrawerRoleUsers
        role={selectedRole}
        onClose={() => setSelectedRole(null)}
      />
    </div>
  );
};

export default RolesPage;
