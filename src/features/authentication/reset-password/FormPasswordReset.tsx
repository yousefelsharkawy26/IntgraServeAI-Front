import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import InputPassword from '@/components/InputPassword';
import { ResetPasswordFormT, resetPasswordSchema } from '@/schema/shared/authSchema';
import { useResetPassword } from './usePasswordResetByToken';

interface IProps {
  token: string;
}

const FormPasswordReset = ({ token }: IProps) => {
  const navigate = useNavigate();
  const { submitResetPassword, isResettingPassword, isPasswordReset, resetError } =
    useResetPassword();

  const form = useForm<ResetPasswordFormT>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { new_password: '', confirm_password: '' },
  });

  const onSubmit: SubmitHandler<ResetPasswordFormT> = ({ new_password }) => {
    submitResetPassword({ token, new_password });
  };

  // Redirect to login after success
  useEffect(() => {
    if (isPasswordReset) {
      toast.success('Password reset! Please sign in with your new password.');
      setTimeout(() => navigate('/log-in'), 2000);
    }
  }, [isPasswordReset, navigate]);

  // ─── Success State ────────────────────────────────────────────────────────
  if (isPasswordReset) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 ring-1 ring-green-200 dark:bg-green-900/30 dark:ring-green-700">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">Password updated!</p>
          <p className="text-muted-foreground text-sm">Redirecting you to sign in…</p>
        </div>
        <Spinner className="text-primary size-5" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="flex flex-col gap-5!" onSubmit={form.handleSubmit(onSubmit)}>
        {/* New password */}
        <FormField
          control={form.control}
          name="new_password"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm! font-medium!">New password</FormLabel>
              <FormControl>
                <div className="relative">
                  <KeyRound className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <InputPassword
                    field={field}
                    isShow={false}
                    className={`h-10! pl-10! ${
                      fieldState.error
                        ? 'border-destructive focus-visible:ring-destructive/30'
                        : ''
                    }`}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-xs!" />
            </FormItem>
          )}
        />

        {/* Confirm password */}
        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm! font-medium!">Confirm password</FormLabel>
              <FormControl>
                <div className="relative">
                  <KeyRound className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <InputPassword
                    field={field}
                    isShow={false}
                    className={`h-10! pl-10! ${
                      fieldState.error
                        ? 'border-destructive focus-visible:ring-destructive/30'
                        : ''
                    }`}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-xs!" />
            </FormItem>
          )}
        />

        {/* API error */}
        {resetError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/8 px-3.5 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{(resetError as Error).message || 'Reset failed. Link may be expired.'}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isResettingPassword}
          className="mt-1 h-10 w-full cursor-pointer font-semibold"
        >
          {isResettingPassword ? (
            <Spinner className="size-5!" />
          ) : (
            <>
              <span>Set New Password</span>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </>
          )}
        </Button>

        <Link
          to="/log-in"
          className="text-muted-foreground hover:text-foreground text-center text-sm transition-colors hover:underline"
        >
          ← Back to sign in
        </Link>
      </form>
    </Form>
  );
};

export default FormPasswordReset;
