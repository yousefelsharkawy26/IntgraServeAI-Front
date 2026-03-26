import { FieldErrors, SubmitHandler, useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { LoginFormT, loginSchema } from '@/schema/loginSchema';
import {
  Form,
  FormControl,
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
import { AlertCircle, ArrowRight, KeyRound, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    login(data, {
      onSuccess: () => {
        toast.success('Login successful!');
      },
      onError: (data) => {
        if (isAxiosError(data) && data.response?.data?.message) {
          toast.error(data.response.data.message);
        } else {
          toast.error('An error occurred, but no message was provided');
        }
      },
    });
  };

  const onError: SubmitHandler<FieldErrors> = (errors) => {
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
        className="flex flex-col gap-5!"
      >
        {/* Email field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm! font-medium!">Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4! w-4! -translate-y-1/2" />
                  <Input
                    className={cn(
                      'h-10! pl-10!',
                      fieldState.error && 'border-destructive focus-visible:ring-destructive/30',
                      classNames.inputClassName,
                    )}
                    placeholder="you@company.com"
                    type="email"
                    autoComplete="email webauthn"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-xs!" />
            </FormItem>
          )}
        />

        {/* Password field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm! font-medium!">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <KeyRound className="text-muted-foreground absolute top-1/2 left-3 h-4! w-4! -translate-y-1/2" />
                  <InputPassword
                    field={field}
                    isShow={false}
                    autoComplete="current-password webauthn"
                    className={cn(
                      'h-10! pl-10!',
                      fieldState.error && 'border-destructive focus-visible:ring-destructive/30',
                      classNames.inputClassName,
                    )}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Forgot password */}
        <div className="flex justify-end -mt-2!">
          <Link
            to="/forgot-password"
            className="text-primary text-xs hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* API error banner */}
        {errorLogin && (
          <div className="flex items-start gap-2.5! rounded-lg border border-destructive/30 bg-destructive/8 px-3.5! py-3! text-sm! text-destructive">
            <AlertCircle className="mt-0.5! h-4! w-4! shrink-0!" />
            <span>
              {isAxiosError(errorLogin) && errorLogin.response?.data?.message
                ? errorLogin.response.data.message
                : 'Login failed, please try again.'}
            </span>
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isLoadingLoggingIn}
          className="mt-1! h-10! w-full! cursor-pointer font-semibold"
        >
          {isLoadingLoggingIn ? (
            <Spinner className="size-5!" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="ml-1.5! h-4! w-4!" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default FormLogin;
