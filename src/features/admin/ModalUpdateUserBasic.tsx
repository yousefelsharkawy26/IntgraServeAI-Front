import { AlertDialogHeader } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import FormUpdateUserBasic from './FormUpdateUserBasic';
import { useUpdateUserBasic } from './useUpdateUserBasic';
import { updateUserBasicRequestT } from '@/schema/admin/updateUserBasicSchema';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/spinner';
import { useUserById } from './useUserById';

interface IProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}

const ModalUpdateUserBasic = ({ onClose, open, userId }: IProps) => {
  const queryClient = useQueryClient();
  const { mutateUpdateUserBasic, isLoadingUpdateUserBasic } =
    useUpdateUserBasic(userId);

  const { dataUserById } = useUserById(userId!);

  if (!userId) return null;

  const handleSubmit = (data: updateUserBasicRequestT) => {
    console.log('update user data info', data);

    mutateUpdateUserBasic(data, {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['listAllUsers'] });
        queryClient.invalidateQueries({ queryKey: ['userActivity'] });
        document.getElementById('close-update-user-info')?.click();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update user info');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-5! sm:max-w-[400px]">
        <AlertDialogHeader>
          <DialogTitle>Update User Basic Info</DialogTitle>
        </AlertDialogHeader>
        <div className="py-4">
          <p className="mb-4!">name: {dataUserById?.full_name}</p>
          <FormUpdateUserBasic
            classNames={{ inputClassName: '!px-3' }}
            onSubmit={handleSubmit}
            onError={(errors) => {
              console.log('FormUpdateUserInfo errors', errors);
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
              id="close-update-user-info"
              className="px-3!"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            form="update-user-basic-form"
            type="submit"
            className="px-3!"
            disabled={isLoadingUpdateUserBasic}
          >
            {isLoadingUpdateUserBasic ? (
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

export default ModalUpdateUserBasic;
