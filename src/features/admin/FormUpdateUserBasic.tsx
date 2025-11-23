import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  updateUserBasicRequestSchema,
  updateUserBasicRequestT,
} from '@/schema/admin/updateUserBasicSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldErrors, SubmitHandler, useForm } from 'react-hook-form';

interface IProps {
  onSubmit: SubmitHandler<updateUserBasicRequestT>;
  onError: SubmitHandler<FieldErrors>;
  classNames?: {
    inputClassName?: string;
  };
}

const FormUpdateUserBasic = ({
  onSubmit,
  onError,
  classNames = {},
}: IProps) => {
  const form = useForm<updateUserBasicRequestT>({
    resolver: zodResolver(updateUserBasicRequestSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      full_name: '',
    },
  });
  return (
    <Form {...form}>
      <form
        id="update-user-basic-form"
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className="flex flex-col gap-4 space-y-6"
      >
        {/* Full Name */}
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  className={classNames.inputClassName}
                  placeholder="Enter full name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  className={classNames.inputClassName}
                  placeholder="Enter email"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default FormUpdateUserBasic;
