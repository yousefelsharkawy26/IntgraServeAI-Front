import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ReactNode } from 'react';
import FormCreateUser from './FormCreateUser';
import { useCreateUser } from './useCreateUser';
import { toast } from 'sonner';
import { createUserRequestT } from '@/schema/admin/createUserSchema';
import { Spinner } from '@/components/ui/spinner';
import { useQueryClient } from '@tanstack/react-query';

interface IProps {
  triggerButton: ReactNode;
}

const ModalCreateUser = ({ triggerButton }: IProps) => {
  const { mutateCreateUser, isLoadingCreateUser } = useCreateUser();
  const queryClient = useQueryClient();

  const handleSubmit = (data: createUserRequestT) => {
    console.log('create user data', data);

    mutateCreateUser(data, {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['listAllUsers'] });
        queryClient.invalidateQueries({ queryKey: ['userActivity'] });
        document.getElementById('close-create-user')?.click();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create user');
      },
    });
  };

  return (
    <Dialog>
      <div>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent className="p-5! sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
            <DialogDescription>
              You can create new users from here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <FormCreateUser
            onSubmit={handleSubmit}
            onError={(errors) => {
              console.log('FormCreateUser errors', errors);
              Object.values(errors).forEach((error) => {
                if (error && 'message' in error) {
                  toast.error(error.message as string);
                }
              });
            }}
            classNames={{ inputClassName: 'px-3!' }}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button
                className="cursor-pointer px-3!"
                id="close-create-user"
                variant="outline"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="cursor-pointer px-3!"
              disabled={isLoadingCreateUser}
              form={'create-user-form'}
              type="submit"
            >
              {isLoadingCreateUser ? <Spinner className="size-3" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default ModalCreateUser;
