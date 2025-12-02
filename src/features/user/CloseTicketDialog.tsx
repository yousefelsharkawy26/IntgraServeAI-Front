import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCloseTicket } from './useCloseTicket';
import { Archive, Loader2 } from 'lucide-react';
import { ticketStatusEnumT } from '@/schema/shared/allTicketsSchema';

interface CloseTicketDialogProps {
  ticketId: string;
  status: ticketStatusEnumT;
}

const CloseTicketDialog = ({ ticketId, status }: CloseTicketDialogProps) => {
  const [open, setOpen] = useState(false);
  const { close, isClosing } = useCloseTicket();

  if (status !== 'resolved') return null;

  const handleClose = () => {
    close(ticketId, {
      onSuccess: () => setOpen(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="cursor-pointer gap-2 bg-gray-800 p-4! text-white hover:bg-gray-700"
        >
          <Archive className="h-4 w-4" />
          Close Ticket
        </Button>
      </DialogTrigger>

      <DialogContent className="p-6! sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Close Ticket Permanently?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This indicates the ticket cycle is
            completely finished and verified.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4!">
          <Button
            variant="outline"
            className="cursor-pointer px-4! py-2!"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            className="cursor-pointer px-4! py-2!"
            onClick={handleClose}
            disabled={isClosing}
          >
            {isClosing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Confirm Close'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloseTicketDialog;
