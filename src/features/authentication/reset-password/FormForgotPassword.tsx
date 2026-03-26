import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router';
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
import {
  ForgotPasswordFormT,
  forgotPasswordSchema,
} from '@/schema/shared/authSchema';
import { useForgotPassword } from './useForgotPassword';

const FormForgotPassword = () => {
  const { sendForgotPassword, isSendingForgotPassword, isForgotPasswordSent } =
    useForgotPassword();

  const form = useForm<ForgotPasswordFormT>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { email: '' },
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormT> = ({ email }) => {
    sendForgotPassword(email, {
      onError: () => toast.error('Failed to send reset link. Please try again.'),
    });
  };

  // ─── Success State ────────────────────────────────────────────────────────
  if (isForgotPasswordSent) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 ring-1 ring-green-200 dark:bg-green-900/30 dark:ring-green-700">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">Check your inbox</p>
          <p className="text-muted-foreground text-sm">
            We sent a password reset link to{' '}
            <span className="text-foreground font-medium">{form.getValues('email')}</span>.
            The link expires in 1 hour.
          </p>
        </div>
        <Link
          to="/log-in"
          className="text-primary text-sm font-medium hover:underline"
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  // ─── Form State ───────────────────────────────────────────────────────────
  return (
    <Form {...form}>
      <form className="flex flex-col gap-5!" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm! font-medium!">Email address</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    className={`h-10! pl-10! ${
                      fieldState.error
                        ? 'border-destructive focus-visible:ring-destructive/30'
                        : ''
                    }`}
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-xs!" />
            </FormItem>
          )}
        />

        {/* Info note */}
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/60 px-3.5 py-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>We'll send a secure link to this email if an account exists.</span>
        </div>

        <Button
          type="submit"
          disabled={isSendingForgotPassword}
          className="mt-1 h-10 w-full cursor-pointer font-semibold"
        >
          {isSendingForgotPassword ? (
            <Spinner className="size-5!" />
          ) : (
            <>
              <span>Send Reset Link</span>
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

export default FormForgotPassword;
