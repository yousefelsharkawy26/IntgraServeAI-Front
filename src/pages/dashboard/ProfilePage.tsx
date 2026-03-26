import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, KeyRound, ClipboardList, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuthContext } from '@/providers/context/auth-context/AuthContext';
import FormUpdateProfile from '@/features/admin/FormUpdateProfile';
import FormChangePassword from '@/features/admin/FormChangePassword';
import getMyLogs, { IMyLogsParams } from '@/services/user/apiMyLogs';
import { MyLogItemT } from '@/schema/user/myLogsSchema';
import useDebounce from '@/hooks/useDebounce';
import { toast } from 'sonner';

type Tab = 'profile' | 'password' | 'logs';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile Info', icon: User },
  { id: 'password', label: 'Change Password', icon: KeyRound },
  { id: 'logs', label: 'My Activity Logs', icon: ClipboardList },
];

// ─── Logs helper ──────────────────────────────────────────────────────────────
const getActionColor = (type: string) => {
  if (type.includes('CREATE')) return 'text-green-500 ring-green-600/20';
  if (type.includes('DELETE') || type.includes('DEACTIVATE'))
    return 'text-red-500 ring-red-600/20';
  return 'text-blue-500 ring-blue-700/10';
};

const renderChangedValues = (changes: MyLogItemT['changed_values']) => {
  if (!changes || Object.keys(changes).length === 0) return '-';
  return Object.entries(changes).map(([key, val], i) => {
    if (val && typeof val === 'object' && 'new' in val) {
      const v = val as { old: unknown; new: unknown };
      const oldVal = Array.isArray(v.old) ? `[${(v.old as unknown[]).length}]` : String(v.old);
      const newVal = Array.isArray(v.new) ? `[${(v.new as unknown[]).length}]` : String(v.new);
      return (
        <div key={i} className="flex flex-wrap items-center gap-1! text-xs">
          <span className="font-semibold text-gray-500">{key}:</span>
          <span className="max-w-[100px]! truncate text-red-500 line-through opacity-70" title={oldVal}>{oldVal}</span>
          <span className="text-gray-400">→</span>
          <span className="font-medium text-green-600" title={newVal}>{newVal}</span>
        </div>
      );
    }
    return (
      <div key={i} className="text-xs">
        <span className="font-semibold text-gray-700">{key}:</span>{' '}
        <span className="text-gray-600">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
      </div>
    );
  });
};

// ─── Logs Tab ─────────────────────────────────────────────────────────────────
const MyLogsTab = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [sortBy, setSortBy] = useState<IMyLogsParams['sort_by']>('created_at');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 600);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-logs', page, limit, sortBy, debouncedSearch],
    queryFn: () =>
      getMyLogs({
        page,
        limit,
        sort_by: sortBy,
        search: debouncedSearch.trim() || null,
      }),
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);

  return (
    <div className="space-y-4! mx-6!">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3!">
        <Select
          value={sortBy}
          onValueChange={(v) => { setSortBy(v as IMyLogsParams['sort_by']); setPage(1); }}
        >
          <SelectTrigger className="w-[160px]!">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Date</SelectItem>
            <SelectItem value="action_type">Action Type</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search action or table…"
          className="w-[240px]"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20!">
          <Spinner className="text-primary size-8!" />
        </div>
      ) : isError ? (
        <p className="text-muted-foreground text-center py-16!">Failed to load logs.</p>
      ) : (
        <div className="rounded-md border shadow-sm">
          <Table>
            <TableCaption className="pb-2!">
              Showing {total > 0 ? startIndex + 1 : 0}–{endIndex} of {total} records
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12! text-center!">#</TableHead>
                <TableHead className="w-[200px]!">Target</TableHead>
                <TableHead className="w-[200px]!">Action</TableHead>
                <TableHead className="min-w-[220px]!">Changes</TableHead>
                <TableHead className="w-[160px]!">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.logs && data.logs.length > 0 ? (
                data.logs.map((log, idx) => (
                  <TableRow key={log.id} className="hover:bg-zinc-50/10">
                    <TableCell className="text-center!">{startIndex + idx + 1}</TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-600">{log.target_table}</span>
                        <span className="text-muted-foreground font-mono text-[10px]!">
                          ID: {log.target_record_id.slice(0, 15)}…
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5! py-0.5! text-xs! font-semibold! ring-1! ring-inset! ${getActionColor(log.action_type)}`}
                      >
                        {log.action_type}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1!">{renderChangedValues(log.changed_values)}</div>
                    </TableCell>
                    <TableCell className="align-top text-xs whitespace-nowrap text-gray-400">
                      {new Date(log.created_at).toLocaleString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground h-32! text-center">
                    No activity logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2!">
          <span className="text-muted-foreground text-sm">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4! w-4!" />
          </Button>
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
            <ChevronRight className="h-4! w-4!" />
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── Profile Page ─────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { dataUser } = useAuthContext();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  return (
    <div className="space-y-6!">
      {/* Header */}
      <div>
        <h1 className="ml-6! text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1 ml-6!">Manage your account settings and view activity.</p>
      </div>

      {/* Avatar + Name banner */}
      <div className="from-primary mx-6! flex items-center gap-5! rounded-2xl bg-linear-to-r to-violet-600 p-6! text-white shadow-md">
        <div className="flex h-16! w-16! items-center justify-center rounded-full bg-white/20 text-2xl font-bold ring-2 ring-white/40">
          {dataUser?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="text-xl font-bold">{dataUser?.full_name ?? '—'}</p>
          <div className="mt-1! flex items-center gap-1.5! text-sm text-white/75">
            <Mail className="h-3.5! w-3.5!" />
            <span>{dataUser?.email ?? '—'}</span>
          </div>
          <div className="mt-1! flex gap-1.5!">
            {dataUser?.roles?.map((r) => (
              <span key={r} className="rounded-full bg-white/20 px-2! py-0.5! text-[11px]! font-medium ring-1 ring-white/30">
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-6!">
        <div className="border-border flex gap-1 border-b pb-0!">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setIsEditingProfile(false); setIsChangingPassword(false); }}
              className={`flex cursor-pointer items-center gap-2! rounded-t-md px-4! py-2.5! text-sm font-medium transition-colors ${activeTab === id
                  ? 'border-primary text-primary border-b-2 bg-transparent'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Icon className="h-4! w-4!" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6!">
          {/* ── Profile Info ── */}
          {activeTab === 'profile' && (
            <div className="bg-card max-w-lg! rounded-2xl border p-6! shadow-sm">
              {isEditingProfile ? (
                <>
                  <p className="text-muted-foreground mb-4 text-sm">Edit your profile information below.</p>
                  <FormUpdateProfile
                    defaultValues={{ full_name: dataUser?.full_name ?? '', email: dataUser?.email ?? '' }}
                    onSuccess={() => {
                      toast.success('Profile updated!');
                      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
                      setIsEditingProfile(false);
                    }}
                    onCancel={() => setIsEditingProfile(false)}
                  />
                </>
              ) : (
                <div className="space-y-4!">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Full Name</p>
                    <p className="mt-1! font-medium">{dataUser?.full_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Email</p>
                    <p className="mt-1! font-medium">{dataUser?.email ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Roles</p>
                    <p className="mt-1! font-medium">{dataUser?.roles?.join(', ') ?? '—'}</p>
                  </div>
                  <Button className="cursor-pointer w-full!" onClick={() => setIsEditingProfile(true)}>
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Change Password ── */}
          {activeTab === 'password' && (
            <div className="bg-card max-w-lg! rounded-2xl border p-6! shadow-sm">
              {isChangingPassword ? (
                <FormChangePassword
                  onSuccess={() => { toast.success('Password changed!'); setIsChangingPassword(false); }}
                  onCancel={() => setIsChangingPassword(false)}
                />
              ) : (
                <div className="space-y-4!">
                  <div className="flex items-center gap-3! rounded-xl! border border-blue-200! bg-blue-50/60! px-4! py-3! text-sm! text-blue-700! dark:border-blue-800! dark:bg-blue-950/30! dark:text-blue-300!">
                    <KeyRound className="h-4! w-4! shrink-0!" />
                    <span>Your password is encrypted and never stored in plain text.</span>
                  </div>
                  <Button className="cursor-pointer w-full!" onClick={() => setIsChangingPassword(true)}>
                    Change Password
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── My Activity Logs ── */}
          {activeTab === 'logs' && <MyLogsTab />}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
