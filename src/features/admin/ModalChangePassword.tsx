import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import FormChangePassword from './FormChangePassword';

interface IProps {
  open: boolean;
  onClose: () => void;
}

const ModalChangePassword = ({ open, onClose }: IProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] p-10!">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and a new password to update your credentials.
          </DialogDescription>
        </DialogHeader>

        <FormChangePassword
          onSuccess={onClose}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ModalChangePassword;