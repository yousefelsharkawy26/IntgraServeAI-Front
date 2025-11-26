import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateUserRoles } from './useUpdateUserRoles';
import { useUserById } from './useUserById';
import { updateUserRolesRequestT } from '@/schema/admin/updateUserRolesSchema';
import { toast } from 'sonner';
import FormUpdateUserRoles from './FormUpdateUserRoles';
import { Spinner } from '@/components/ui/spinner';

interface IProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}

const ModalUpdateUserRoles = ({ open, onClose, userId }: IProps) => {
  const queryClient = useQueryClient();
  const { mutateUpdateUserRoles, isLoadingUpdateUserRoles } =
    useUpdateUserRoles(userId);

  const { dataUserById } = useUserById(userId!);

  if (!userId) return null;

  const handleSubmit = (data: updateUserRolesRequestT) => {
    console.log('update user data roles', data);

    mutateUpdateUserRoles(data, {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['listAllUsers'] });
        queryClient.invalidateQueries({ queryKey: ['userActivity'] });
        document.getElementById('close-update-user-roles')?.click();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update user roles');
      },
    });
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-5! sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update User Roles</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4!">name: {dataUserById?.full_name}</p>
          <FormUpdateUserRoles
            onSubmit={handleSubmit}
            onError={(errors) => {
              console.log('FormUpdateUserRoles errors', errors);
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
            form="update-user-roles-form"
            type="submit"
            className="px-3!"
            disabled={isLoadingUpdateUserRoles}
          >
            {isLoadingUpdateUserRoles ? (
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

export default ModalUpdateUserRoles;
