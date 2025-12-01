import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ReactNode } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { useTicketsStatistics } from './useTicketsStatistics';

interface IProps {
  triggerButton: ReactNode;
}

const ModalTicketsStatistics = ({ triggerButton }: IProps) => {
  const { dataTicketsStatistics, isLoadingTicketsStatistics } =
    useTicketsStatistics();
  return (
    <Dialog>
      <div>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent className="p-5! sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tickets Statistics</DialogTitle>
            <DialogDescription>
              Overview of tickets: status, priority, type, and other key
              metrics.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 h-[50dvh] overflow-auto! py-3!">
            {isLoadingTicketsStatistics ? (
              <div className="flex justify-center py-10">
                <Spinner className="size-6" />
              </div>
            ) : dataTicketsStatistics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Status */}
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Total Tickets</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.total_tickets}
                    </div>
                  </div>
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Open</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.open_tickets}
                    </div>
                  </div>
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">In Progress</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.in_progress_tickets}
                    </div>
                  </div>
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Pending</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.pending_tickets}
                    </div>
                  </div>
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Escalated</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.escalated_tickets}
                    </div>
                  </div>
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Resolved</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.resolved_tickets}
                    </div>
                  </div>
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Closed</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.closed_tickets}
                    </div>
                  </div>
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Canceled</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.canceled_tickets}
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Urgent</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.urgent_tickets}
                    </div>
                  </div>
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">High Priority</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.high_priority_tickets}
                    </div>
                  </div>
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Medium Priority</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.medium_priority_tickets}
                    </div>
                  </div>
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Low Priority</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.low_priority_tickets}
                    </div>
                  </div>

                  {/* Type */}
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Tech Tickets</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.tech_tickets}
                    </div>
                  </div>
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Support Tickets</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.support_tickets}
                    </div>
                  </div>

                  {/* Assignment */}
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Assigned</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.assigned_tickets}
                    </div>
                  </div>
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Unassigned</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.unassigned_tickets}
                    </div>
                  </div>

                  {/* Other */}
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Overdue</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.overdue_tickets}
                    </div>
                  </div>
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Due Soon</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.due_soon_tickets}
                    </div>
                  </div>

                  <div className="col-span-2 rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">
                      Average Resolution Time (hours)
                    </div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.avg_resolution_time_hours ?? '-'}
                    </div>
                  </div>
                  <div className="col-span-2 rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">
                      Average Response Time (hours)
                    </div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.avg_response_time_hours ?? '-'}
                    </div>
                  </div>

                  {/* Created */}
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">Today</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.tickets_today}
                    </div>
                  </div>
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">This Week</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.tickets_this_week}
                    </div>
                  </div>
                  <div className="rounded-md border px-2! py-0.5!">
                    <div className="text-sm text-gray-500">This Month</div>
                    <div className="text-lg font-semibold">
                      {dataTicketsStatistics.tickets_this_month}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-gray-500">
                No statistics available
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                className="cursor-pointer px-3!"
                id="close-ticket-statistics"
                variant="outline"
              >
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default ModalTicketsStatistics;
