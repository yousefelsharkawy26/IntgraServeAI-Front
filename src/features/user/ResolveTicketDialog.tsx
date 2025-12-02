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
import { useResolveTicket } from '@/features/user/useResolveTicket';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface ResolveTicketDialogProps {
  ticketId: string;
  isDisabled?: boolean;
}

const ResolveTicketDialog = ({
  ticketId,
  isDisabled = false,
}: ResolveTicketDialogProps) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const { resolve, isResolving } = useResolveTicket();

  const handleResolve = () => {
    if (!notes.trim()) return;

    resolve(
      { ticketId, resolution_notes: notes },
      {
        onSuccess: () => {
          setOpen(false);
          setNotes('');
        },
      },
    );
  };

  if (isDisabled) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="gap-2 bg-green-600 px-2! py-2! text-white hover:bg-green-700"
          size="sm"
        >
          <CheckCircle2 className="h-4 w-4" />
          Resolve
        </Button>
      </DialogTrigger>

      <DialogContent className="p-6! sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mark Ticket as Resolved</DialogTitle>
          <DialogDescription>
            Great job! Please describe how you solved this issue. This
            information will be sent to the customer.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4!">
          <div className="grid gap-2">
            <Label htmlFor="resolution_notes" className="text-left">
              Resolution Notes (Required)
            </Label>
            <Textarea
              id="resolution_notes"
              placeholder="e.g. Cleared cache, Updated database record #123..."
              className="min-h-[120px] px-4! py-2!"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer px-4!"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            disabled={isResolving || notes.length < 10}
            className="cursor-pointer bg-green-600 px-4! text-white hover:bg-green-700"
          >
            {isResolving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Confirm Resolution'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResolveTicketDialog;
