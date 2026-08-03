import { Component, ErrorInfo, FC, ReactNode, useEffect } from 'react';
import { ToastContainer } from '../components/ui/ToastContainer';
import { Button } from '../components/ui/Button';
import { enqueueErrorToast } from '../services/errorToast';

interface ErrorToastProviderProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<
  ErrorToastProviderProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[App] Unhandled render error:', error, errorInfo);
    enqueueErrorToast(error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-sm text-center space-y-4">
            <h1 className="text-xl font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground">
              Reload the app to recover. Your locally saved workout data is preserved.
            </p>
            <Button
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorToastProvider: FC<ErrorToastProviderProps> = ({ children }) => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      enqueueErrorToast(event.error ?? event.message);
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      enqueueErrorToast(event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <>
      <AppErrorBoundary>{children}</AppErrorBoundary>
      <ToastContainer />
    </>
  );
};
