import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { useUserLogs } from './useUserLogs';
import {
  userLogItemT,
  userLogsResponseT,
} from '@/schema/admin/userLogsByIdShema';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useDebounce from '@/hooks/useDebounce';
import { IUserLogsParams } from '@/services/admin/apiUserLogs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface IProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

const ModalUserLogs = ({ onClose, open, userId }: IProps) => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [sortBy, setSortBy] =
    useState<IUserLogsParams['sort_by']>('last_login');
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 1000);

  const { dataUserLogs, isLoadingUserLogs } = useUserLogs({
    limit,
    page,
    userId,
    sort_by: sortBy,
    search:
      debouncedSearchQuery && debouncedSearchQuery.trim() !== ''
        ? debouncedSearchQuery
        : null,
  });
  const username = dataUserLogs?.logs[0]?.user_name || 'Unknown User';

  // Helper to format the dynamic "changed_values" object
  const renderChangedValues = (
    changes: userLogsResponseT['logs'][0]['changed_values'],
  ) => {
    if (!changes || Object.keys(changes).length === 0) return '-';

    return Object.entries(changes).map(([key, val], index) => {
      // Case: { new: ..., old: ... }
      if (val && typeof val === 'object' && 'new' in val) {
        const oldVal = Array.isArray(val.old)
          ? `[${val.old.length}]`
          : String(val.old);
        const newVal = Array.isArray(val.new)
          ? `[${val.new.length}]`
          : String(val.new);

        return (
          <div
            key={index}
            className="flex flex-wrap items-center gap-1 text-xs"
          >
            <span className="font-semibold text-gray-500">{key}:</span>
            <span
              className="max-w-[100px] truncate text-red-500 line-through opacity-70"
              title={String(oldVal)}
            >
              {oldVal}
            </span>
            <span className="text-gray-400">→</span>
            <span className="font-medium text-green-600" title={String(newVal)}>
              {newVal}
            </span>
          </div>
        );
      }
      // Case: Flat value
      return (
        <div key={index} className="text-xs">
          <span className="font-semibold text-gray-700">{key}:</span>{' '}
          <span className="text-gray-600">
            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
          </span>
        </div>
      );
    });
  };

  // Calculations for Pagination
  const total = dataUserLogs?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);

  // Helper for Action Badge Colors
  const getActionColor = (type: string) => {
    if (type.includes('CREATE')) return 'text-green-500 ring-green-600/20';
    if (type.includes('DELETE') || type.includes('DEACTIVATE'))
      return 'text-red-500 ring-red-600/20';
    return 'text-blue-500 ring-blue-700/10';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-5! sm:max-w-[1224px]">
        {/* 1. HEADER WITH USER NAME */}
        <DialogHeader>
          <DialogTitle className="text-lg">
            Audit Logs: <span className="text-primary">{username}</span>
          </DialogTitle>
          <DialogDescription>
            View the history of changes and actions performed on this account.
          </DialogDescription>
        </DialogHeader>
        {/* Sort selector */}
        <div className="mb-4 flex flex-row items-center gap-3">
          <div className="flex flex-row items-center gap-3">
            <span className="text-muted-foreground text-sm">Sort by:</span>
            <Select
              value={sortBy}
              onValueChange={(val: string) => {
                setSortBy(val as IUserLogsParams['sort_by']);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px] px-3!">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="px-3! py-2!">
                <SelectItem value="last_login">Last Login</SelectItem>
                <SelectItem value="created_at">Created At</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-row items-center gap-3">
            <span className="text-muted-foreground text-sm whitespace-nowrap!">
              search:
            </span>
            <Input
              placeholder="Search with email / full name"
              className="w-[250px] px-3!"
              type="search"
              value={searchQuery ?? ''}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="min-w[600px] max-w-[1220px] overflow-x-auto! p-6">
          {isLoadingUserLogs ? (
            <div className="flex justify-center py-20">
              <Spinner className="text-primary size-8" />
            </div>
          ) : dataUserLogs ? (
            <div className="space-y-4">
              {/* TABLE */}
              <div className="rounded-md border shadow-sm">
                <Table>
                  <TableCaption className="pb-2!">
                    Showing {total > 0 ? startIndex + 1 : 0} to {endIndex} of{' '}
                    {total} records
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      {/* 3. SORTED COLUMNS: Target - Action - Changes - Date */}
                      <TableHead className="mx-5 w-10">#</TableHead>
                      <TableHead className="mx-5 w-[200px]">Target</TableHead>
                      <TableHead className="w-[200px]">Action</TableHead>
                      <TableHead className="min-w-[250px]">Changes</TableHead>
                      <TableHead className="w-[170px]">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataUserLogs.logs.length > 0 ? (
                      dataUserLogs.logs.map(
                        (log: userLogItemT, index: number) => (
                          <TableRow
                            key={log.id}
                            className="hover:bg-zinc-50/10"
                          >
                            {/* TARGET */}
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="align-top">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-600">
                                  {log.target_table}
                                </span>
                                <span className="text-muted-foreground font-mono text-[10px]">
                                  ID: {log.target_record_id.slice(0, 15)}...
                                </span>
                              </div>
                            </TableCell>

                            {/* ACTION (Includes Admin Name) */}
                            <TableCell className="align-top">
                              <div className="flex flex-col items-start gap-1.5">
                                {/* 2. ENHANCED BADGE STYLE */}
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5! py-0.5! text-xs font-semibold ring-1 ring-inset ${getActionColor(log.action_type)}`}
                                >
                                  {log.action_type}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  by{' '}
                                  <span className="font-medium text-gray-500">
                                    {log.user_name}
                                  </span>
                                </span>
                              </div>
                            </TableCell>

                            {/* CHANGES */}
                            <TableCell className="align-top">
                              <div className="space-y-1">
                                {renderChangedValues(log.changed_values)}
                              </div>
                            </TableCell>

                            {/* DATE */}
                            <TableCell className="align-top text-xs whitespace-nowrap text-gray-400">
                              {new Date(log.created_at).toLocaleString(
                                undefined,
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )}
                            </TableCell>
                          </TableRow>
                        ),
                      )
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-muted-foreground h-32 text-center"
                        >
                          No logs found for this user.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* PAGINATION */}
              <div
                className="flex items-center justify-end gap-2"
                style={{ margin: '5px' }}
              >
                <span className="text-muted-foreground text-sm">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground py-20 text-center">
              Failed to load user logs.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalUserLogs;
