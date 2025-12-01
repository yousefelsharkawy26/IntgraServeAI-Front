import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useTicketDetailsById } from './useTicketDetailsById';
import { Button } from '@/components/ui/button';
import {
  ticketPriorityBGColors,
  ticketStatusBGColors,
} from '@/utils/constants';

interface IProps {
  ticketId: string | null;
  open: boolean;
  onClose: () => void;
}

const ModalTicketDetailsById = ({ onClose, open, ticketId }: IProps) => {
  const { dataTicketDetailsById, isLoadingTicketDetailsById } =
    useTicketDetailsById({ ticket_id: ticketId || '' });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-5! sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Ticket Details</DialogTitle>
          <DialogDescription>
            Detailed information for the selected ticket.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 h-[50dvh] overflow-auto! py-3!">
          {isLoadingTicketDetailsById ? (
            <div className="flex justify-center py-10">
              <Spinner className="size-6" />
            </div>
          ) : dataTicketDetailsById ? (
            <div className="mt-4 space-y-4">
              {/* GRID INFO CARDS */}
              <div className="grid grid-cols-2 gap-4">
                {/* Title */}
                <div className="col-span-2 rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">Title</div>
                  <div className="text-sm font-semibold">
                    {dataTicketDetailsById.title}
                  </div>
                </div>

                {/* Description */}
                <div className="col-span-2 rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">Description</div>
                  <div className="text-sm font-semibold whitespace-pre-wrap">
                    {dataTicketDetailsById.description ?? 'No Description'}
                  </div>
                </div>

                {/* Type */}
                <div className="rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">Ticket Type</div>
                  <div className="text-sm font-semibold">
                    {dataTicketDetailsById.ticket_type}
                  </div>
                </div>

                {/* Priority */}
                <div className="rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">Priority</div>
                  <div className="text-sm font-semibold">
                    <span
                      className={`rounded-full px-2! py-0! capitalize ${ticketPriorityBGColors(dataTicketDetailsById.priority)}`}
                    >
                      {dataTicketDetailsById.priority}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="text-sm font-semibold">
                    <span
                      className={`rounded-full px-2! py-0! capitalize ${ticketStatusBGColors(dataTicketDetailsById.status)}`}
                    >
                      {dataTicketDetailsById.status}
                    </span>
                  </div>
                </div>

                {/* SLA Due Date */}
                <div className="rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">SLA Due</div>
                  <div className="text-sm font-semibold">
                    {new Date(
                      dataTicketDetailsById.sla_due_date ?? '—',
                    ).toLocaleString()}
                  </div>
                </div>

                {/* Customer Email */}
                <div className="rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">Customer Email</div>
                  <div className="text-sm font-semibold">
                    {dataTicketDetailsById.customer_email}
                  </div>
                </div>

                {/* Customer Name */}
                <div className="rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">Customer Name</div>
                  <div className="text-sm font-semibold">
                    {dataTicketDetailsById.customer_name}
                  </div>
                </div>

                {/* Assignee */}
                <div className="rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">Assignee</div>
                  <div className="text-sm font-semibold">
                    {dataTicketDetailsById.assignee_name ?? 'Unassigned'}
                  </div>
                </div>

                {/* Assigned At */}
                <div className="rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">Assigned At</div>
                  <div className="text-sm font-semibold">
                    {dataTicketDetailsById.assigned_at ?? '—'}
                  </div>
                </div>

                {/* AI Auto Created */}
                <div className="rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">AI Generated</div>
                  <div className="text-sm font-semibold">
                    {dataTicketDetailsById.ai_auto_created ? 'Yes' : 'No'}
                  </div>
                </div>

                {/* AI Confidence */}
                <div className="rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">AI Confidence</div>
                  <div className="text-sm font-semibold">
                    {dataTicketDetailsById.ai_confidence ?? '—'}
                  </div>
                </div>

                {/* Resolution Notes */}
                <div className="col-span-2 rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">Resolution Notes</div>
                  <div className="text-sm font-semibold whitespace-pre-wrap">
                    {dataTicketDetailsById.resolution_notes ?? '—'}
                  </div>
                </div>

                {/* Cancellation Reason */}
                <div className="col-span-2 rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">
                    Cancellation Reason
                  </div>
                  <div className="text-sm font-semibold whitespace-pre-wrap">
                    {dataTicketDetailsById.cancellation_reason ?? '—'}
                  </div>
                </div>

                {/* Escalation Reason */}
                <div className="col-span-2 rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">Escalation Reason</div>
                  <div className="text-sm font-semibold whitespace-pre-wrap">
                    {dataTicketDetailsById.escalation_reason ?? '—'}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">Created At</div>
                  <div className="text-sm font-semibold">
                    {new Date(
                      dataTicketDetailsById.created_at,
                    ).toLocaleString()}
                  </div>
                </div>

                <div className="rounded-md border px-2! py-1!">
                  <div className="text-xs text-gray-500">Updated At</div>
                  <div className="text-sm font-semibold">
                    {new Date(
                      dataTicketDetailsById.updated_at,
                    ).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-gray-500">
              Failed to load ticket details
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              className="cursor-pointer px-3!"
              id="close-ticket-details-id"
              variant="outline"
            >
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalTicketDetailsById;
