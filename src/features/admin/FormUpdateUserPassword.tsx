import InputPassword from '@/components/InputPassword';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  updateUserPasswordRequestSchema,
  updateUserPasswordRequestT,
} from '@/schema/admin/updateUserPasswordSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldErrors, SubmitHandler, useForm } from 'react-hook-form';

interface IProps {
  onSubmit: SubmitHandler<updateUserPasswordRequestT>;
  onError: SubmitHandler<FieldErrors>;
  classNames?: {
    inputClassName?: string;
  };
}

const FormUpdateUserPassword = ({
  onError,
  onSubmit,
  classNames = {},
}: IProps) => {
  const form = useForm<updateUserPasswordRequestT>({
    resolver: zodResolver(updateUserPasswordRequestSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      new_password: '',
    },
  });
  return (
    <Form {...form}>
      <form
        id="update-user-password-form"
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className="flex flex-col gap-4 space-y-6"
      >
        {/* new password */}
        <FormField
          control={form.control}
          name="new_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <InputPassword
                  className={classNames.inputClassName}
                  placeholder="Enter new passwrd"
                  field={field}
                  autoComplete="new-password webauthn"
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

export default FormUpdateUserPassword;
