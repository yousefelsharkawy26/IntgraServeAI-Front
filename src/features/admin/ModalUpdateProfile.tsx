import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import FormUpdateProfile from './FormUpdateProfile';
import { userByTokenT } from '@/schema/userByTokenSchema';

interface IProps {
  open: boolean;
  onClose: () => void;
  currentUser: userByTokenT | undefined;
}

const ModalUpdateProfile = ({ open, onClose, currentUser }: IProps) => {
  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-10! sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Update Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <FormUpdateProfile
          defaultValues={{
            full_name: currentUser.full_name,
            email: currentUser.email,
          }}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ModalUpdateProfile;
