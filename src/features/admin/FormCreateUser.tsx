import InputPassword from '@/components/InputPassword';
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
  createUserRequestSchema,
  createUserRequestT,
} from '@/schema/admin/createUserSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldErrors, SubmitHandler, useForm } from 'react-hook-form';
import { useAllRoles } from './useAllRoles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

interface IProps {
  onSubmit: SubmitHandler<createUserRequestT>;
  onError: SubmitHandler<FieldErrors>;
  classNames?: {
    inputClassName?: string;
  };
}

const FormCreateUser = ({ onSubmit, onError, classNames = {} }: IProps) => {
  const form = useForm<createUserRequestT>({
    resolver: zodResolver(createUserRequestSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      roles_id: [],
    },
  });

  const { dataAllRoles, isLoadingAllRoles } = useAllRoles();

  return (
    <Form {...form}>
      <form
        id="create-user-form"
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className="flex flex-col gap-4 space-y-6"
      >
        {/* email field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  className={classNames.inputClassName}
                  placeholder="Enter your email"
                  type="email"
                  autoComplete="email webauthn"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* fullname field */}
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>full name</FormLabel>
              <FormControl>
                <Input
                  className={classNames.inputClassName}
                  placeholder="Enter your name"
                  type="text"
                  autoComplete="name webauthn"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* password field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <InputPassword
                  field={field}
                  isShow={false}
                  autoComplete="current-password webauthn"
                  className={classNames.inputClassName}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="roles_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Select onValueChange={(value) => field.onChange([value])}>
                  <SelectTrigger className="cursor-pointer px-3!">
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent className="px-1! py-1!">
                    {isLoadingAllRoles && (
                      <SelectItem
                        disabled
                        value="loading"
                        className="cursor-not-allowed"
                      >
                        <Spinner className="size-4" />
                      </SelectItem>
                    )}
                    {dataAllRoles?.map((role) => (
                      <SelectItem
                        key={role.id}
                        value={role.id}
                        className="cursor-pointer px-3!"
                      >
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default FormCreateUser;
