import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Calendar, User, Mail, Clock, AlertCircle } from 'lucide-react';
import { useTicketDetails } from './useTicketDetails';
import {
  ticketPriorityBGColors,
  ticketStatusBGColors,
} from '@/utils/constants';

interface ModalTicketDetailsProps {
  ticketId: string | null;
  open: boolean;
  onClose: () => void;
}

const ModalTicketDetailsById = ({
  ticketId,
  open,
  onClose,
}: ModalTicketDetailsProps) => {
  
  // Hook Call
  const { ticket, isLoadingTicket, ticketError } = useTicketDetails(ticketId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto px-8! py-4!">
        <DialogHeader>
          <DialogTitle>Ticket Details</DialogTitle>
          <DialogDescription>
            View complete information about this ticket.
          </DialogDescription>
        </DialogHeader>

        {isLoadingTicket ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : ticketError ? (
          <div className="flex h-40 flex-col items-center justify-center text-red-500 gap-2">
            <AlertCircle className="h-8 w-8" />
            <p>{ticketError.message || 'Failed to load ticket details'}</p>
          </div>
        ) : ticket ? (
          <div className="space-y-6!">
            
            {/* Header: Title, ID, Status */}
            <div className="space-y-2!">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-bold leading-tight">{ticket.title}</h2>
                <Badge className={ticketStatusBGColors(ticket.status) + ' px-3! py-1! text-sm'}>
                  {ticket.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">ID: {ticket.id}</p>
            </div>

            {/* Priority & Type Badges */}
            <div className="flex gap-2 mt-2! mb-2!">
               <Badge variant="outline" className={`${ticketPriorityBGColors(ticket.priority)} px-3! py-1!`}>
                  Priority: {ticket.priority}
               </Badge>
               <Badge variant="secondary" className='px-3! py-1!'>
                  Type: {ticket.ticket_type}
               </Badge>
               {ticket.sla_due_date && (
                 <Badge variant="destructive" className="gap-1 px-3! py-1!">
                    <Clock className="w-3 h-3" /> SLA: {new Date(ticket.sla_due_date).toLocaleDateString()}
                 </Badge>
               )}
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2!">
              <h3 className="font-semibold text-sm">Description</h3>
              <div className="rounded-md bg-muted p-4! text-sm whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              
              {/* Customer Info */}
              <div className="space-y-1!">
                <h4 className="font-semibold text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" /> Customer
                </h4>
                <p className="font-medium">{ticket.customer_name}</p>
                <div className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="w-3 h-3" /> {ticket.customer_email}
                </div>
              </div>

              {/* Assignee Info */}
              <div className="space-y-1!">
                <h4 className="font-semibold text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" /> Assignee
                </h4>
                {ticket.assignee_name ? (
                    <>
                        <p className="font-medium">{ticket.assignee_name}</p>
                        {ticket.assigned_at && (
                            <p className="text-xs text-muted-foreground">
                                Since: {new Date(ticket.assigned_at).toLocaleDateString()}
                            </p>
                        )}
                    </>
                ) : (
                    <p className="text-muted-foreground italic">Unassigned</p>
                )}
              </div>

              {/* Timestamps */}
              <div className="space-y-1! md:col-span-2 mt-2">
                <h4 className="font-semibold text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Timeline
                </h4>
                <div className="flex gap-6 text-xs text-muted-foreground">
                    <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
                    <span>Updated: {new Date(ticket.updated_at).toLocaleString()}</span>
                </div>
              </div>

            </div>
            
            {/* Footer Actions (Optional) */}
            <div className="flex justify-end w-full pt-4!">
                <Button variant="outline" onClick={onClose} className='w-30/100 cursor-pointer'>Close</Button>
            </div>

          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ModalTicketDetailsById;