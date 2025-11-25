import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import FormUpdateProfile from './FormUpdateProfile';
import { userProfileResponseT } from '@/schema/admin/userProfileSchema';

interface IProps {
  open: boolean;
  onClose: () => void;
  currentUser: userProfileResponseT | undefined;
}

const ModalUpdateProfile = ({ open, onClose, currentUser }: IProps) => {
  
  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] p-10!">
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