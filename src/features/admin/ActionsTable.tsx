import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Edit, Trash2, Power, PowerOff, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { ActionSummaryT, ActionTypeT } from '@/schema/admin/actionsSchema';
import { deleteAction, toggleAction } from '@/services/admin/apiActions';

// ─── Type badge ───────────────────────────────────────────────────────────────
const TYPE_BADGE: Record<ActionTypeT, { label: string; cls: string }> = {
  api_request: { label: 'API', cls: 'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800' },
  rpc_request: { label: 'RPC', cls: 'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800' },
  internal: { label: 'Internal', cls: 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700' },
};

interface IProps {
  actions: ActionSummaryT[];
  isLoading: boolean;
  filterType: string;
  filterActive: string;
  search: string;
  onFilterTypeChange: (v: string) => void;
  onFilterActiveChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onEdit: (action: ActionSummaryT) => void;
}

const ActionsTable = ({
  actions, isLoading,
  filterType, filterActive, search,
  onFilterTypeChange, onFilterActiveChange, onSearchChange,
  onEdit,
}: IProps) => {
  const qc = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { mutate: doDelete } = useMutation({
    mutationFn: deleteAction,
    onMutate: (actionId) => setDeletingId(actionId),
    onSuccess: () => {
      toast.success('Action deleted');
      qc.invalidateQueries({ queryKey: ['actions'] });
      setDeletingId(null);
    },
    onError: (e) => {
      toast.error((e as Error).message || 'Delete failed');
      setDeletingId(null);
    },
  });

  const { mutate: doToggle } = useMutation({
    mutationFn: toggleAction,
    onMutate: (id) => setTogglingId(id),
    onSuccess: (res) => {
      toast.success(`Action ${res.active ? 'activated' : 'deactivated'}`);
      qc.invalidateQueries({ queryKey: ['actions'] });
      setTogglingId(null);
    },
    onError: (e) => {
      toast.error((e as Error).message || 'Toggle failed');
      setTogglingId(null);
    },
  });

  return (
    <div className="space-y-4!">
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-3!">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3! h-4! w-4! -translate-y-1/2" />
          <Input
            placeholder="Search name or description…"
            className="w-[250px]! pl-9!"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Select value={filterType} onValueChange={onFilterTypeChange}>
          <SelectTrigger className="w-[180px]! px-2!">
            <Filter className="mr-1! h-3.5! w-3.5!" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className='p-2!'>
            <SelectItem className='p-2!' value="all">All Types</SelectItem>
            <SelectItem className='p-2!' value="api_request">API</SelectItem>
            <SelectItem className='p-2!' value="rpc_request">RPC</SelectItem>
            <SelectItem className='p-2!' value="internal">Internal</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterActive} onValueChange={onFilterActiveChange}>
          <SelectTrigger className="w-[180px]! px-2!">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="flex justify-center py-20!">
          <Spinner className="text-primary size-8!" />
        </div>
      ) : (
        <div className="rounded-md border shadow-sm">
          <Table>
            <TableCaption className="pb-2!">{actions.length} action(s) found</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]! px-2!">Name</TableHead>
                <TableHead className='px-2!'>Description</TableHead>
                <TableHead className="w-[110px]! px-2!">Type</TableHead>
                <TableHead className="w-[100px]! px-2!">Status</TableHead>
                <TableHead className="w-[140px]! text-right px-2!">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground h-32! text-center">
                    <Zap className="mx-auto! mb-2! h-8! w-8! opacity-30" />
                    No actions found.
                  </TableCell>
                </TableRow>
              ) : (
                actions.map((action) => {
                  const badge = TYPE_BADGE[action.type];
                  return (
                    <TableRow key={action.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-sm font-medium px-2!">{action.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[300px]! px-2! truncate text-sm">
                        {action.description}
                      </TableCell>
                      <TableCell className="px-2!">
                        <span className={`inline-flex items-center rounded-full px-2.5! py-0.5! text-xs! font-semibold ring-1 ring-inset ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-2!">
                        {action.active ? (
                          <span className="inline-flex items-center gap-1! text-xs font-medium text-green-600 dark:text-green-400">
                            <span className="h-1.5! w-1.5! rounded-full bg-green-500" />
                            Active
                          </span>
                        ) : (
                          <span className="text-muted-foreground inline-flex items-center gap-1! text-xs font-medium">
                            <span className="h-1.5! w-1.5! rounded-full bg-gray-400" />
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right px-2!">
                        <div className="flex justify-end gap-1!">
                          {/* Toggle */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer h-8! w-8! p-0!"
                            title={action.active ? 'Deactivate' : 'Activate'}
                            onClick={() => doToggle(action.id)}
                            disabled={togglingId === action.id}
                          >
                            {togglingId === action.id ? (
                              <Spinner className="size-4!" />
                            ) : action.active ? (
                              <PowerOff className="h-4! w-4! text-amber-500" />
                            ) : (
                              <Power className="h-4! w-4! text-green-500" />
                            )}
                          </Button>
                          {/* Edit — not for internal */}
                          {action.type !== 'internal' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer h-8! w-8! p-0!"
                              title="Edit"
                              onClick={() => onEdit(action)}
                            >
                              <Edit className="h-4! w-4!" />
                            </Button>
                          )}
                          {/* Delete — not for internal */}
                          {action.type !== 'internal' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer h-8! w-8! p-0! text-destructive hover:text-destructive"
                              title="Delete"
                              onClick={() => doDelete(action.id)}
                              disabled={deletingId === action.id}
                            >
                              {deletingId === action.id ? (
                                <Spinner className="size-4!" />
                              ) : (
                                <Trash2 className="h-4! w-4!" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ActionsTable;
