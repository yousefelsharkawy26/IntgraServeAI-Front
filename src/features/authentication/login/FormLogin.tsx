import { FieldErrors, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { LoginFormT, loginSchema } from '@/schema/loginSchema';
import {
  Form,
  FormControl,
  //   FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useLogin } from './useLogin';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import InputPassword from '@/components/InputPassword';
import { useAuthContext } from '@/providers/context/auth-context/AuthContext';

interface IProps {
  classNames?: {
    inputClassName?: string;
  };
}

const FormLogin = ({ classNames = {} }: IProps) => {
  const form = useForm<LoginFormT>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { errorLogin } = useLogin();
  const { login, isLoadingLoggingIn } = useAuthContext();

  const onSubmit: SubmitHandler<LoginFormT> = (data) => {
    console.log('Yes', data);
    login(data, {
      onSuccess: (data) => {
        console.log('Yes success', data);
        toast.success('Login successful!');
      },

      onError: (data) => {
        console.log('No, Failed', data);
        if (isAxiosError(data) && data.response?.data?.message) {
          toast.error(data.response.data.message);
        } else {
          toast.error('An error occurred, but no message was provided');
        }
      },
    });
  };

  const onError: SubmitHandler<FieldErrors> = (errors) => {
    console.log('errors', errors);
    Object.values(errors).forEach((error) => {
      if (error && 'message' in error) {
        toast.error(error.message as string);
      }
    });
  };

  return (
    <Form {...form}>
      <form
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

        <Button
          type="submit"
          disabled={isLoadingLoggingIn}
          className={`w-full cursor-pointer rounded-md px-4 py-2 text-white hover:bg-blue-700 focus:outline-none ${isLoadingLoggingIn ? 'cursor-not-allowed bg-blue-400' : 'bg-blue-600'}`}
        >
          {isLoadingLoggingIn ? (
            <Spinner className="size-6" />
          ) : (
            <span>Login</span>
          )}
        </Button>

        {errorLogin && (
          <div className="mt-2 text-red-600">
            {isAxiosError(errorLogin) && errorLogin.response?.data?.message
              ? errorLogin.response.data.message
              : 'An error occurred while logging in, please try again.'}
          </div>
        )}
      </form>
    </Form>
  );
};

export default FormLogin;
