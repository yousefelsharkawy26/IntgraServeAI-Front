import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCancelTicket } from './useCancelTicket';
import { Ban, Loader2 } from 'lucide-react';

interface CancelTicketDialogProps {
  ticketId: string;
  isDisabled?: boolean;
}

const CancelTicketDialog = ({
  ticketId,
  isDisabled = false,
}: CancelTicketDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const { cancel, isCanceling } = useCancelTicket();

  const handleCancel = () => {
    if (!reason.trim()) return;

    cancel(
      { ticketId, cancellation_reason: reason },
      {
        onSuccess: () => {
          setOpen(false);
          setReason('');
        },
      },
    );
  };

  if (isDisabled) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="cursor-pointer gap-2 px-2! py-2!"
        >
          <Ban className="h-4 w-4" />
          Cancel
        </Button>
      </DialogTrigger>

      <DialogContent className="p-6! sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">Cancel Ticket</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this ticket? This action implies the
            issue is no longer valid or is a duplicate.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4!">
          <div className="grid gap-2">
            <Label htmlFor="cancellation_reason" className="text-left">
              Reason for Cancellation (Required)
            </Label>
            <Textarea
              id="cancellation_reason"
              placeholder="e.g. Duplicate of ticket #5599..."
              className="resize-none px-4! py-2!"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer px-4!"
            onClick={() => setOpen(false)}
          >
            Back
          </Button>
          <Button
            variant="destructive"
            className="cursor-pointer px-4!"
            onClick={handleCancel}
            disabled={isCanceling || reason.length < 5}
          >
            {isCanceling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Confirm Cancel'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelTicketDialog;
