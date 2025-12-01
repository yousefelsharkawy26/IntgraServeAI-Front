import AdminTicketsTable from '@/components/AdminTicketsTable';
import { Button } from '@/components/ui/button';
import ModalTicketsStatistics from '@/features/admin/ModalTicketsStatistics';
import { ChartArea } from 'lucide-react';

const TicketsAdmin = () => {
  return (
    <div className="space-y-6!">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="ml-6! text-3xl font-bold tracking-tight">
            Show Tickets
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and show users tickets
          </p>
        </div>
        <div className="flex flex-row gap-3">
          <ModalTicketsStatistics
            triggerButton={
              <Button className="cursor-pointer gap-2 p-3!">
                <ChartArea className="h-4 w-4" />
                Show Tickets Statistics
              </Button>
            }
          />
        </div>
      </div>

      {/* Tickets Table */}
      <AdminTicketsTable />
    </div>
  );
};

export default TicketsAdmin;
