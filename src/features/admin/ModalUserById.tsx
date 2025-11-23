import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserById } from './useUserById';
import { Spinner } from '@/components/ui/spinner';

interface IProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

const ModalUserById = ({ onClose, open, userId }: IProps) => {
  const { dataUserById, isLoadingUserById } = useUserById(userId || '');
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!p-5 sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Here you can view detailed information for the selected user.
          </DialogDescription>
        </DialogHeader>

        {isLoadingUserById ? (
          <div className="flex justify-center py-10">
            <Spinner className="size-6" />
          </div>
        ) : dataUserById ? (
          <div className="mt-4 space-y-4">
            {/* GRID INFO CARDS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md border !px-2 !py-1">
                <div className="text-xs text-gray-500">Full Name</div>
                <div className="text-sm font-semibold">
                  {dataUserById.full_name}
                </div>
              </div>

              <div className="rounded-md border !px-2 !py-1">
                <div className="text-xs text-gray-500">Email</div>
                <div className="text-sm font-semibold">
                  {dataUserById.email}
                </div>
              </div>

              <div className="rounded-md border !px-2 !py-1">
                <div className="text-xs text-gray-500">Email Confirmed</div>
                <div className="text-sm font-semibold">
                  {dataUserById.email_confirmed ? 'Yes' : 'No'}
                </div>
              </div>

              <div className="rounded-md border !px-2 !py-1">
                <div className="text-xs text-gray-500">Status</div>
                <div className="text-sm font-semibold">
                  {dataUserById.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="col-span-2 rounded-md border !px-2 !py-1">
                <div className="text-xs text-gray-500">Roles</div>
                <div className="text-sm font-semibold">
                  {dataUserById.roles.join(', ')}
                </div>
              </div>

              <div className="col-span-2 rounded-md border !px-2 !py-1">
                <div className="text-xs text-gray-500">Last Login</div>
                <div className="text-sm font-semibold">
                  {dataUserById.last_login
                    ? dataUserById.last_login.toLocaleString()
                    : 'Never'}
                </div>
              </div>

              <div className="rounded-md border !px-2 !py-1">
                <div className="text-xs text-gray-500">Created At</div>
                <div className="text-sm font-semibold">
                  {dataUserById.created_at.toLocaleString()}
                </div>
              </div>

              <div className="rounded-md border !px-2 !py-1">
                <div className="text-xs text-gray-500">Updated At</div>
                <div className="text-sm font-semibold">
                  {dataUserById.updated_at.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-gray-500">
            Failed to load user details
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModalUserById;
