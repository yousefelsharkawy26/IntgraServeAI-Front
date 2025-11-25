import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateProfileRequestSchema,
  updateProfileRequestT,
} from '@/schema/admin/updateProfileSchema';
import { useUpdateProfile } from './useUpdateProfile';

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

interface IProps {
  defaultValues: {
    full_name: string;
    email: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const FormUpdateProfile = ({ defaultValues, onSuccess, onCancel }: IProps) => {
  const { mutateUpdateProfile: handleUpdateProfile, isLoadingUpdateProfile } = useUpdateProfile();

  // 1. Initialize Form
  const form = useForm<updateProfileRequestT>({
    resolver: zodResolver(updateProfileRequestSchema),
    defaultValues: {
      full_name: defaultValues.full_name,
      email: defaultValues.email,
    },
  });

  // 2. Handle Submission
  const onSubmit = (data: updateProfileRequestT) => {
    handleUpdateProfile(data, {
      onSuccess: () => {
        onSuccess();
      },
      onError: (error) => {
        // 3. Handle Server-Side Validation Errors
        // Error is typed as AxiosError<updateProfileErrorResponseT>
        const serverErrors = error.response?.data?.errors;

        if (serverErrors) {
          Object.entries(serverErrors).forEach(([key, message]) => {
            if (message) {
              // We cast key to satisfy TS that the key exists in our form schema
              form.setError(key as keyof updateProfileRequestT, {
                type: 'server',
                message: message,
              });
            }
          });
        }
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        
        {/* Full Name Field */}
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem className='mt-5!'>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input className='px-4!' placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className='mt-5!'>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input className='px-4!' placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-center pt-4 mt-5! w-full gap-1">
          <Button
            type="button"
            className='w-25/81 cursor-pointer'
            variant="outline"
            onClick={onCancel}
            disabled={isLoadingUpdateProfile}
          >
            Cancel
          </Button>
          <Button type="submit"
                 className='w-54/81 cursor-pointer'
                 disabled={isLoadingUpdateProfile}>
            {isLoadingUpdateProfile && (
              <Spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default FormUpdateProfile;