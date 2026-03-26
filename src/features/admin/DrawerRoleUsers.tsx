import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, ChevronLeft, ChevronRight, Users, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import getRoleUsers from '@/services/admin/apiRoleUsers';
import { RoleStatItemT } from '@/schema/admin/roleStatisticsSchema';

interface IProps {
  role: RoleStatItemT | null;
  onClose: () => void;
}

const DrawerRoleUsers = ({ role, onClose }: IProps) => {
  const [page, setPage] = useState(1);
  const limit = 8;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['role-users', role?.id, page],
    queryFn: () => getRoleUsers({ roleId: role!.id, page, limit }),
    enabled: !!role,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  if (!role) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
        {/* Header */}
        <div className="from-primary flex items-center justify-between bg-linear-to-r to-violet-600 px-6! py-5! text-white">
          <div>
            <p className="text-lg font-bold">{role.name}</p>
            <p className="text-sm text-white/70">{role.user_count} {role.user_count === 1 ? 'member' : 'members'}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8! w-8! cursor-pointer items-center justify-center rounded-lg bg-white/15 transition-colors hover:bg-white/25"
          >
            <X className="h-4! w-4!" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5!">
          {isLoading ? (
            <div className="flex justify-center py-20!">
              <Spinner className="text-primary size-8!" />
            </div>
          ) : isError ? (
            <p className="text-muted-foreground py-20! text-center">Failed to load members.</p>
          ) : data?.users.length === 0 ? (
            <div className="flex flex-col items-center gap-3! py-20! text-center">
              <Users className="text-muted-foreground h-10! w-10!" />
              <p className="text-muted-foreground text-sm">No members in this role yet.</p>
            </div>
          ) : (
            <div className="space-y-3!">
              {data?.users.map((user) => (
                <div
                  key={user.id}
                  className="bg-card flex items-center gap-3! rounded-xl border p-4! shadow-sm"
                >
                  {/* Avatar */}
                  <div className="from-primary flex h-10! w-10! shrink-0 items-center justify-center rounded-full bg-linear-to-br to-violet-600 text-sm font-bold text-white">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold">{user.full_name}</p>
                    <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                  </div>

                  {/* Status badge */}
                  {user.is_active ? (
                    <div className="flex items-center gap-1! rounded-full bg-green-100 px-2! py-0.5! text-xs font-medium text-green-700 ring-1 ring-green-200 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-800">
                      <CheckCircle className="h-3! w-3!" />
                      Active
                    </div>
                  ) : (
                    <div className="flex items-center gap-1! rounded-full bg-red-100 px-2! py-0.5! text-xs font-medium text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800">
                      <XCircle className="h-3! w-3!" />
                      Inactive
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-5! py-4!">
            <span className="text-muted-foreground text-sm">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2!">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4! w-4!" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4! w-4!" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DrawerRoleUsers;
