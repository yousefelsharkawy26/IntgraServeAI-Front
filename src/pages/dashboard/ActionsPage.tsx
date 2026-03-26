import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap, Plus, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useDebounce from '@/hooks/useDebounce';
import { listActions } from '@/services/admin/apiActions';
import { ActionSummaryT } from '@/schema/admin/actionsSchema';
import ActionsTable from '@/features/admin/ActionsTable';
import ModalCreateAction from '@/features/admin/ModalCreateAction';
import BackupsPanel from '@/features/admin/BackupsPanel';

type Tab = 'actions' | 'backups';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'actions', label: 'Actions', icon: Zap },
  { id: 'backups', label: 'Backups', icon: Archive },
];

const ActionsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('actions');
  const [createOpen, setCreateOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useQuery({
    queryKey: ['actions', filterType, filterActive, debouncedSearch],
    queryFn: () =>
      listActions({
        type: filterType !== 'all' ? filterType : null,
        active: filterActive !== 'all' ? filterActive === 'true' : null,
        search: debouncedSearch.trim() || null,
      }),
  });

  const actions: ActionSummaryT[] = data?.actions ?? [];

  // Quick stats
  const activeCount = actions.filter((a) => a.active && a.type !== 'internal').length;
  const internalCount = actions.filter((a) => a.type === 'internal').length;

  return (
    <div className="space-y-6!">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4! md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="ml-6! text-3xl font-bold tracking-tight">Actions</h1>
          <p className="text-muted-foreground mt-1 ml-6!">
            Manage automation actions used by the AI assistant.
          </p>
        </div>
        <div className="ml-6! md:ml-0!">
          <Button
            className="cursor-pointer px-5!"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-1! h-4! w-4!" />
            New Action
          </Button>
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────── */}
      {data && (
        <div className="mx-6! grid grid-cols-3 gap-3!">
          {[
            { label: 'Total', value: data.total, color: 'text-foreground' },
            { label: 'Active', value: activeCount, color: 'text-green-600 dark:text-green-400' },
            { label: 'Internal', value: internalCount, color: 'text-gray-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card flex flex-col items-center rounded-2xl border p-4! shadow-sm">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-muted-foreground text-xs">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="mx-6!">
        <div className="border-border flex gap-1 border-b pb-0!">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex cursor-pointer items-center gap-2! rounded-t-md px-4! py-2.5! text-sm font-medium transition-colors ${
                activeTab === id
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
          {activeTab === 'actions' && (
            <ActionsTable
              actions={actions}
              isLoading={isLoading}
              filterType={filterType}
              filterActive={filterActive}
              search={search}
              onFilterTypeChange={setFilterType}
              onFilterActiveChange={setFilterActive}
              onSearchChange={setSearch}
              onEdit={(action) => {
                // Future: open edit modal
                console.log('Edit', action.id);
              }}
            />
          )}
          {activeTab === 'backups' && <BackupsPanel />}
        </div>
      </div>

      {/* Create modal */}
      <ModalCreateAction open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
};

export default ActionsPage;
