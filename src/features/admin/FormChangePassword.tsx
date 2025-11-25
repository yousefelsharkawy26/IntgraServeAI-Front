import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  changePasswordRequestT,
  changePasswordFormSchema
} from '@/schema/admin/changePasswordSchema'; // Type for API
import z from 'zod'; // We need Zod here to define the UI-specific schema with Confirm Password

import { useChangePassword } from './useChangePassword';

// UI Components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

// 1. Define UI Schema locally (or import if you exported it separately)
// This includes 'confirm_password' which isn't sent to the API


type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

interface IProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const FormChangePassword = ({ onSuccess, onCancel }: IProps) => {
  const { mutateChangePassword: handleChangePassword, isLoadingChangePassword } = useChangePassword();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const onSubmit = (data: ChangePasswordFormValues) => {
    // 2. Create API Payload (Exclude confirm_password)
    const payload: changePasswordRequestT = {
      current_password: data.current_password,
      new_password: data.new_password,
    };

    handleChangePassword(payload, {
      onSuccess: () => {
        form.reset();
        onSuccess();
      },
      onError: (error) => {
        // 3. Handle Specific API Error
        // Error is typed as AxiosError<changePasswordErrorResponseT>
        const errorMessage = error.response?.data?.message;

        if (errorMessage === 'Current password is incorrect') {
          form.setError('current_password', {
            type: 'manual',
            message: errorMessage,
          });
        } else {
          // Fallback for other errors (validation passed, but server rejected)
          toast.error(errorMessage || 'Failed to change password');
        }
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Current Password */}
        <FormField
          control={form.control}
          name="current_password"
          render={({ field }) => (
            <FormItem className='mt-5!'>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your current password ..." className='px-4!' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* New Password */}
        <FormField
          control={form.control}
          name="new_password"
          render={({ field }) => (
            <FormItem className='mt-5!'>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter new password ..." className='px-4!' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm Password */}
        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem className='mt-5!'>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm new password ..." className='px-4!' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex flex-col justify-center pt-4 mt-5! w-full gap-1 gap-sm-0 sm:flex-row">
          <Button
            type="button"
            className='w-full cursor-pointer sm:w-25/81'
            variant="outline"
            onClick={onCancel}
            disabled={isLoadingChangePassword}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoadingChangePassword}
            className='w-full cursor-pointer sm:w-54/81'>
            {isLoadingChangePassword && (
              <Spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Change Password
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default FormChangePassword;