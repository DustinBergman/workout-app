import { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { resendConfirmation } from '../../services/supabase/auth';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const SignUpForm: FC<SignUpFormProps> = ({
  onSwitchToLogin,
}) => {
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<SignUpFormData>({
    mode: 'onTouched', // Show errors after field is touched (blurred), then validate on change
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: SignUpFormData) => {
    setError(null);
    setIsLoading(true);

    const { error: authError } = await signUp(data.email, data.password, {
      firstName: data.firstName || undefined,
      lastName: data.lastName || undefined,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    setConfirmedEmail(data.email);
    setIsLoading(false);
    setShowConfirmation(true);
  };

  const handleResendEmail = async () => {
    setResendStatus('sending');
    const { error } = await resendConfirmation(confirmedEmail);

    if (error) {
      setResendStatus('error');
      return;
    }

    setResendStatus('sent');
  };

  if (showConfirmation) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Check Your Email</h2>
        <p className="text-muted-foreground">
          We've sent a confirmation link to <strong>{confirmedEmail}</strong>. Click the link to activate your account.
        </p>

        <div className="pt-2">
          {resendStatus === 'sent' ? (
            <p className="text-sm text-green-500">Email sent! Check your inbox.</p>
          ) : resendStatus === 'error' ? (
            <p className="text-sm text-destructive">Failed to resend. Please try again.</p>
          ) : (
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resendStatus === 'sending'}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              {resendStatus === 'sending' ? 'Sending...' : "Didn't receive an email? Resend"}
            </button>
          )}
        </div>

        <Button variant="outline" onClick={onSwitchToLogin} className="w-full">
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
        <p className="text-muted-foreground mt-1">Start your fitness journey</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First Name"
          type="text"
          placeholder="John"
          autoComplete="given-name"
          {...register('firstName')}
        />

        <Input
          label="Last Name"
          type="text"
          placeholder="Doe"
          autoComplete="family-name"
          {...register('lastName')}
        />
      </div>

      <div>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
        />
      </div>

      <div>
        <Input
          label="Password"
          type="password"
          placeholder="At least 6 characters with a number"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            validate: (value) => {
              if (value.length < 6) {
                return 'Password must be at least 6 characters';
              }
              if (!/\d/.test(value)) {
                return 'Password must contain at least one number';
              }
              return true;
            },
          })}
        />
      </div>

      <div>
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) =>
              value === password || 'Passwords do not match',
          })}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!isValid || isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-primary hover:underline font-medium"
        >
          Sign in
        </button>
      </p>
    </form>
  );
};
