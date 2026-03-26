import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, Trash2, RotateCcw, GitCompare, FileJson, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { listBackups, deleteBackup, deleteAllBackups, restoreBackup, compareBackup } from '@/services/admin/apiActions';
import { BackupInfoT, BackupCompareT } from '@/schema/admin/actionsSchema';

const BackupsPanel = () => {
  const qc = useQueryClient();
  const [expandedCompare, setExpandedCompare] = useState<Record<string, BackupCompareT>>({});
  const [comparingId, setComparingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['backups'],
    queryFn: listBackups,
  });

  const { mutate: doRestore } = useMutation({
    mutationFn: restoreBackup,
    onMutate: (fn) => setRestoringId(fn),
    onSuccess: (res) => {
      toast.success(`Restored ${res.actions_count} actions from "${res.restored_from}"`);
      qc.invalidateQueries({ queryKey: ['actions'] });
      qc.invalidateQueries({ queryKey: ['backups'] });
      setRestoringId(null);
    },
    onError: (e) => { toast.error((e as Error).message); setRestoringId(null); },
  });

  const { mutate: doDelete } = useMutation({
    mutationFn: deleteBackup,
    onMutate: (fn) => setDeletingId(fn),
    onSuccess: (res) => {
      toast.success(`Deleted backup "${res.filename}"`);
      qc.invalidateQueries({ queryKey: ['backups'] });
      setDeletingId(null);
    },
    onError: (e) => { toast.error((e as Error).message); setDeletingId(null); },
  });

  const { mutate: doDeleteAll, isPending: isDeletingAll } = useMutation({
    mutationFn: deleteAllBackups,
    onSuccess: (res) => {
      toast.success(`Deleted ${res.deleted_count} backups`);
      qc.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const handleCompare = async (filename: string) => {
    if (expandedCompare[filename]) {
      const copy = { ...expandedCompare };
      delete copy[filename];
      setExpandedCompare(copy);
      return;
    }
    setComparingId(filename);
    try {
      const result = await compareBackup(filename);
      setExpandedCompare((prev) => ({ ...prev, [filename]: result }));
    } catch (e) {
      toast.error((e as Error).message || 'Compare failed');
    } finally {
      setComparingId(null);
    }
  };

  return (
    <div className="space-y-4!">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {data ? `${data.total} backup file(s) stored on server` : ''}
        </p>
        {data && data.total > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer px-4! text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => doDeleteAll()}
            disabled={isDeletingAll}
          >
            {isDeletingAll ? <Spinner className="size-4!" /> : <><Trash2 className="mr-1.5! h-3.5! w-3.5!" />Delete All</>}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16!"><Spinner className="text-primary size-8!" /></div>
      ) : isError ? (
        <p className="text-muted-foreground text-center py-12!">Failed to load backups.</p>
      ) : data?.backups.length === 0 ? (
        <div className="flex flex-col items-center gap-3! py-16! text-center">
          <Archive className="text-muted-foreground h-10! w-10!" />
          <p className="text-muted-foreground text-sm">No backups available.</p>
        </div>
      ) : (
        <div className="space-y-3!">
          {data?.backups.map((backup: BackupInfoT) => {
            const diff = expandedCompare[backup.filename];
            return (
              <div key={backup.filename} className="bg-card rounded-xl border shadow-sm">
                {/* Backup row */}
                <div className="flex flex-wrap items-center gap-3! p-4!">
                  <FileJson className="text-muted-foreground h-5! w-5! shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium font-mono">{backup.filename}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(backup.created_at).toLocaleString()} · {backup.size_kb.toFixed(1)} KB
                    </p>
                  </div>
                  <div className="flex gap-1.5!">
                    {/* Compare */}
                    <Button variant="outline" size="sm" className="cursor-pointer px-4!"
                      onClick={() => handleCompare(backup.filename)} disabled={comparingId === backup.filename}>
                      {comparingId === backup.filename ? (
                        <Spinner className="size-3.5!" />
                      ) : diff ? (
                        <><ChevronDown className="mr-1! h-3.5! w-3.5!" />Hide Diff</>
                      ) : (
                        <><GitCompare className="mr-1! h-3.5! w-3.5!" />Diff</>
                      )}
                    </Button>
                    {/* Restore */}
                    <Button variant="outline" size="sm" className="cursor-pointer px-4!"
                      onClick={() => doRestore(backup.filename)} disabled={restoringId === backup.filename}>
                      {restoringId === backup.filename ? (
                        <Spinner className="size-3.5!" />
                      ) : (
                        <><RotateCcw className="mr-1! h-3.5! w-3.5!" />Restore</>
                      )}
                    </Button>
                    {/* Delete */}
                    <Button variant="ghost" size="sm"
                      className="cursor-pointer px-4! text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => doDelete(backup.filename)} disabled={deletingId === backup.filename}>
                      {deletingId === backup.filename ? <Spinner className="size-3.5!" /> : <Trash2 className="h-3.5! w-3.5!" />}
                    </Button>
                  </div>
                </div>

                {/* Diff panel */}
                {diff && (
                  <div className="border-t px-4! py-3! space-y-2!">
                    <div className="flex flex-wrap gap-3! text-xs">
                      <span className="text-muted-foreground">Backup: <strong>{diff.backup_actions_count}</strong> · Current: <strong>{diff.current_actions_count}</strong></span>
                      {!diff.has_changes && <span className="text-green-600 font-medium">✓ No changes</span>}
                    </div>
                    {diff.added.length > 0 && (
                      <div className="flex flex-wrap gap-1.5!">
                        <span className="text-xs text-green-600 font-medium">Added:</span>
                        {diff.added.map(n => <span key={n} className="rounded bg-green-100 px-1.5! py-0.5! text-xs font-mono text-green-700 dark:bg-green-900/30 dark:text-green-400">{n}</span>)}
                      </div>
                    )}
                    {diff.removed.length > 0 && (
                      <div className="flex flex-wrap gap-1.5!">
                        <span className="text-xs text-red-600 font-medium">Removed:</span>
                        {diff.removed.map(n => <span key={n} className="rounded bg-red-100 px-1.5! py-0.5! text-xs font-mono text-red-700 dark:bg-red-900/30 dark:text-red-400">{n}</span>)}
                      </div>
                    )}
                    {diff.modified.length > 0 && (
                      <div className="flex flex-wrap gap-1.5!">
                        <span className="text-xs text-amber-600 font-medium">Modified:</span>
                        {diff.modified.map(n => <span key={n} className="rounded bg-amber-100 px-1.5! py-0.5! text-xs font-mono text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{n}</span>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BackupsPanel;
