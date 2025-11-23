import { AlertDialogHeader } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import FormUpdateUserPassword from './FormUpdateUserPassword';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { useUpdateUserPassword } from './useUpdateUserPassword';
import { useQueryClient } from '@tanstack/react-query';
import { useUserById } from './useUserById';
import { updateUserPasswordRequestT } from '@/schema/admin/updateUserPasswordSchema';

interface IProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}

const ModalUpdateUserPassword = ({ onClose, open, userId }: IProps) => {
  const queryClient = useQueryClient();
  const { mutateUpdateUserPassword, isLoadingUpdateUserPassword } =
    useUpdateUserPassword(userId);

  const { dataUserById } = useUserById(userId!);

  if (!userId) return null;

  const handleSubmit = (data: updateUserPasswordRequestT) => {
    console.log('update user password', data);

    mutateUpdateUserPassword(data, {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['listAllUsers'] });
        queryClient.invalidateQueries({ queryKey: ['userActivity'] });
        document.getElementById('close-update-user-password')?.click();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update user password');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!p-5 sm:max-w-[400px]">
        <AlertDialogHeader>
          <DialogTitle>Update User password</DialogTitle>
        </AlertDialogHeader>
        <div className="py-4">
          <p className="!mb-4">name: {dataUserById?.full_name}</p>
          <FormUpdateUserPassword
            classNames={{ inputClassName: '!px-3' }}
            onSubmit={handleSubmit}
            onError={(errors) => {
              console.log('FormUpdateUserPassword errors', errors);
              Object.values(errors).forEach((error) => {
                if (error && 'message' in error) {
                  toast.error(error.message as string);
                }
              });
            }}
          />
        </div>
        <DialogFooter className="flex justify-between">
          <DialogClose asChild>
            <Button
              variant="outline"
              id="close-update-user-password"
              className="!px-3"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            form="update-user-password-form"
            type="submit"
            className="!px-3"
            disabled={isLoadingUpdateUserPassword}
          >
            {isLoadingUpdateUserPassword ? (
              <Spinner className="size-3" />
            ) : (
              'Update'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalUpdateUserPassword;
