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
import { useReassignTicket } from '@/features/user/useReassignTicket';
import { ticketTypeEnumT } from '@/schema/shared/allTicketsSchema';
import { ArrowRightLeft, Loader2 } from 'lucide-react';

interface ReassignTicketDialogProps {
  ticketId: string;
  currentType: ticketTypeEnumT;
}

const ReassignTicketDialog = ({
  ticketId,
  currentType,
}: ReassignTicketDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const { reassign, isReassigning } = useReassignTicket();

  const targetType = currentType === 'support' ? 'Tech Team' : 'Support Team';

  const handleSubmit = () => {
    if (!reason.trim()) return;

    reassign(
      { ticketId, reason },
      {
        onSuccess: () => {
          setOpen(false);
          setReason('');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-orange-200 px-2! py-2! text-orange-600 hover:bg-orange-50"
        >
          <ArrowRightLeft className="h-4 w-4" />
          {currentType === 'support' ? 'To Tech' : 'To Support'}
        </Button>
      </DialogTrigger>

      <DialogContent className="p-6! sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Escalate/Reassign</DialogTitle>
          <DialogDescription>
            Move this ticket to{' '}
            <span className="text-foreground font-bold">{targetType}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4!">
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason (Required)</Label>
            <Textarea
              id="reason"
              placeholder={`Why does ${targetType} need to handle this?`}
              className="h-24 resize-none px-4! py-2!"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            className="cursor-pointer p-4! hover:bg-gray-400"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isReassigning || reason.length < 5}
            className="cursor-pointer bg-orange-600 p-4! text-white hover:bg-orange-700"
          >
            {isReassigning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Confirm Move'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReassignTicketDialog;
