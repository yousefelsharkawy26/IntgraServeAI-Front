import { Button } from '@/components/ui/button';
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
import { useDeleteTicketById } from './useDeleteTicketById';
import { useTicketDetailsById } from './useTicketDetailsById';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface IProps {
  ticketId: string | null;
  open: boolean;
  onClose: () => void;
}

const ModalAcceptDeleteAdminTicket = ({ ticketId, open, onClose }: IProps) => {
  const queryClient = useQueryClient();
  const { mutateDeleteTicketById, isLoadingDeleteTicketById } =
    useDeleteTicketById();

  const handleDelete = () => {
    if (!ticketId) return;

    mutateDeleteTicketById(
      { ticket_id: ticketId },
      {
        onSuccess: (data) => {
          toast.success(data.message);
          queryClient.invalidateQueries({ queryKey: ['allTickets'] });
          onClose();
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to delete ticket');
        },
      },
    );
  };

  const { dataTicketDetailsById } = useTicketDetailsById({
    ticket_id: ticketId ?? '',
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-5! sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete Ticket</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this ticket? This action is
            permanent.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          <p className="text-sm text-gray-500">
            Customer:{' '}
            <span className="font-semibold">
              {dataTicketDetailsById?.customer_name}
            </span>
          </p>
        </div>

        <DialogFooter>
          <Button
            className="cursor-pointer bg-red-600 px-3! text-white hover:bg-red-700"
            disabled={isLoadingDeleteTicketById}
            onClick={handleDelete}
          >
            {isLoadingDeleteTicketById ? (
              <Spinner className="size-4" />
            ) : (
              'Delete'
            )}
          </Button>

          <DialogClose asChild>
            <Button
              id="close-accept-delete-ticket"
              variant="outline"
              className="cursor-pointer px-3!"
            >
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalAcceptDeleteAdminTicket;
