import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUpdateTicketStatus } from './useUpdateTicketStatus';
import { ticketStatusEnumT } from '@/schema/shared/allTicketsSchema';
import { Loader2, RefreshCw } from 'lucide-react';

interface TicketStatusSelectorProps {
  ticketId: string;
  currentStatus: ticketStatusEnumT;
}

const TicketStatusSelector = ({
  ticketId,
  currentStatus,
}: TicketStatusSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<ticketStatusEnumT>(currentStatus);
  const [notes, setNotes] = useState('');

  const { updateStatus, isUpdating } = useUpdateTicketStatus();

  const handleSubmit = () => {
    if (!notes.trim()) return;

    updateStatus(
      { ticketId, status: selectedStatus, notes },
      {
        onSuccess: () => {
          setOpen(false);
          setNotes('');
        },
      },
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 p-2!">
          <RefreshCw className="h-4 w-4" />
          Change Status
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-4!" align="end">
        <div className="space-y-4!">
          <h4 className="leading-none font-medium">Update Status</h4>

          {/* Status Select */}
          <div className="space-y-2!">
            <Label htmlFor="status">New Status</Label>
            <Select
              value={selectedStatus}
              onValueChange={(val) =>
                setSelectedStatus(val as ticketStatusEnumT)
              }
            >
              <SelectTrigger id="status" className="px-4!">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="px-2! py-1!" value="open">
                  Open
                </SelectItem>
                <SelectItem className="px-2! py-1!" value="in_progress">
                  In Progress
                </SelectItem>
                <SelectItem className="px-2! py-1!" value="pending">
                  Pending
                </SelectItem>
                <SelectItem className="px-2! py-1!" value="resolved">
                  Resolved
                </SelectItem>
                <SelectItem className="px-2! py-1!" value="closed">
                  Closed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes Input */}
          <div className="space-y-2!">
            <Label htmlFor="notes">Notes (Required)</Label>
            <Textarea
              id="notes"
              placeholder="Why are you changing the status?"
              className="h-20 resize-none px-4! py-2!"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              className="cursor-pointer px-4!"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="cursor-pointer px-4!"
              onClick={handleSubmit}
              disabled={
                isUpdating || !notes.trim() || selectedStatus === currentStatus
              }
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Update'
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TicketStatusSelector;
