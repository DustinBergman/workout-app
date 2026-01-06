import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm, SignUpForm, ForgotPasswordForm } from '../components/auth';
import { Card } from '../components/ui';
import { FloatingOrbsBackground } from '../components/home';

type AuthView = 'login' | 'signup' | 'forgot-password';

export const Auth: FC = () => {
  const [view, setView] = useState<AuthView>('login');
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative">
      <FloatingOrbsBackground />
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">overload.ai</h1>
          <p className="text-muted-foreground mt-2">Your AI-powered fitness companion</p>
        </div>

        {/* Auth Card */}
        <Card className="p-6">
          {view === 'login' && (
            <LoginForm
              onSwitchToSignUp={() => setView('signup')}
              onSwitchToForgotPassword={() => setView('forgot-password')}
              onSuccess={handleSuccess}
            />
          )}

          {view === 'signup' && (
            <SignUpForm
              onSwitchToLogin={() => setView('login')}
            />
          )}

          {view === 'forgot-password' && (
            <ForgotPasswordForm
              onSwitchToLogin={() => setView('login')}
            />
          )}
        </Card>

      </div>
    </div>
  );
};
