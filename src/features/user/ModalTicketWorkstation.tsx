import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useTicketDetails } from '../shared/useTicketDetails';
import { useUpdateTicketStatus } from './useUpdateTicketStatus';
import { ticketStatusBGColors } from '@/utils/constants';

// Components
import TicketActionsToolbar from './TicketActionsToolbar';
import TicketMessagesList from './TicketMessagesList';
import TicketMessageInput from './TicketMessageInput';

interface ModalTicketWorkstationProps {
  ticketId: string | null;
  open: boolean;
  onClose: () => void;
}

const ModalTicketWorkstation = ({
  ticketId,
  open,
  onClose,
}: ModalTicketWorkstationProps) => {
  const { ticket, isLoadingTicket } = useTicketDetails(ticketId);

  const { updateStatus } = useUpdateTicketStatus();

  const handleReplySent = (isInternal: boolean) => {
    if (
      !isInternal &&
      ticket?.status !== 'pending' &&
      ticket?.status !== 'resolved' &&
      ticket?.status !== 'closed'
    ) {
      updateStatus({
        ticketId: ticket!.id,
        status: 'pending',
        notes: 'Auto-updated to pending after agent reply',
      });
    }
  };

  if (!ticketId) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex h-[90vh] flex-col gap-0 overflow-hidden p-6! sm:min-w-80/100 md:min-w-80/100 lg:min-w-60/100">
        {/* === HEADER === */}
        <DialogHeader className="px-6! py-4!">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <DialogTitle className="flex items-center gap-3 text-xl">
                Chat & Actions
                {ticket && (
                  <Badge
                    className={
                      ticketStatusBGColors(ticket.status) +
                      ' px-2! py-1! text-white'
                    }
                  >
                    {ticket.status}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {isLoadingTicket
                  ? 'Loading...'
                  : `Ticket #${ticket?.id} • ${ticket?.customer_name}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* === BODY (Loading / Content) === */}
        {isLoadingTicket || !ticket ? (
          <div className="flex flex-1 items-center justify-center">
            <p>Loading Workspace...</p>
          </div>
        ) : (
          <>
            {/* 1. ACTIONS TOOLBAR */}
            <TicketActionsToolbar
              ticketId={ticket.id}
              status={ticket.status}
              type={ticket.ticket_type}
            />

            {/* 2. CHAT AREA (Scrollable) */}
            <div className="flex-1 overflow-y-auto!">
              <TicketMessagesList ticketId={ticket.id} />
            </div>

            {/* 3. INPUT AREA (Fixed at bottom) */}
            <div className="border-t">
              {ticket.status === 'closed' || ticket.status === 'canceled' ? (
                <div className="text-muted-foreground rounded-md border py-4! text-center">
                  This ticket is {ticket.status}. You cannot send messages.
                </div>
              ) : (
                // نحتاج لتعديل بسيط في هذا المكون ليقبل onSuccess
                <TicketMessageInput
                  ticketId={ticket.id}
                  onMessageSent={handleReplySent}
                />
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModalTicketWorkstation;
