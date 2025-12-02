import CancelTicketDialog from './CancelTicketDialog';
import ResolveTicketDialog from './ResolveTicketDialog';
import ReassignTicketPopover from './ReassignTicketDialog';
import CloseTicketDialog from './CloseTicketDialog';
import TicketStatusSelector from './TicketStatusSelector';
import {
  ticketStatusEnumT,
  ticketTypeEnumT,
} from '@/schema/shared/allTicketsSchema';

interface TicketActionsToolbarProps {
  ticketId: string;
  status: ticketStatusEnumT;
  type: ticketTypeEnumT;
}

const TicketActionsToolbar = ({
  ticketId,
  status,
  type,
}: TicketActionsToolbarProps) => {
  const isClosed = status === 'closed' || status === 'canceled';
  const isResolved = status === 'resolved';

  return (
    <div className="flex items-center gap-2 overflow-x-auto! border-b p-2!">
      {/* 1. Resolve (The Goal) */}
      {!isResolved && !isClosed && <ResolveTicketDialog ticketId={ticketId} />}

      {/* 2. Close (Final Step - Only if Resolved) */}
      {isResolved && <CloseTicketDialog ticketId={ticketId} status={status} />}

      {/* 3. Reassign (Escalation) */}
      {!isClosed && (
        <ReassignTicketPopover ticketId={ticketId} currentType={type} />
      )}

      {/* 4. Cancel (Destructive) */}
      {!isClosed && <CancelTicketDialog ticketId={ticketId} />}

      <div className="ml-auto!">
        {/* 5. Status Selector (Manual Override) */}
        {!isClosed && (
          <TicketStatusSelector ticketId={ticketId} currentStatus={status} />
        )}
      </div>
    </div>
  );
};

export default TicketActionsToolbar;
