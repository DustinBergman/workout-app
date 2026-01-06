import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../hooks/useAuth';

describe('LoginForm', () => {
  const mockSignIn = vi.fn();
  const mockOnSwitchToSignUp = vi.fn();
  const mockOnSwitchToForgotPassword = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      signIn: mockSignIn,
    } as never);
  });

  const renderLoginForm = () => {
    return render(
      <LoginForm
        onSwitchToSignUp={mockOnSwitchToSignUp}
        onSwitchToForgotPassword={mockOnSwitchToForgotPassword}
        onSuccess={mockOnSuccess}
      />
    );
  };

  it('should render login form with all elements', () => {
    renderLoginForm();

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  it('should update email input value', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should update password input value', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');

    expect(passwordInput).toHaveValue('password123');
  });

  it('should call signIn on form submit', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ error: null });

    renderLoginForm();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should call onSuccess after successful login', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ error: null });

    renderLoginForm();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should display error message on login failure', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({
      error: { message: 'Invalid credentials' },
    });

    renderLoginForm();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should not call onSuccess on login failure', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({
      error: { message: 'Invalid credentials' },
    });

    renderLoginForm();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should show loading state while signing in', async () => {
    const user = userEvent.setup();
    mockSignIn.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    renderLoginForm();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });

  it('should call onSwitchToSignUp when sign up link is clicked', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.click(screen.getByText(/sign up/i));

    expect(mockOnSwitchToSignUp).toHaveBeenCalled();
  });

  it('should call onSwitchToForgotPassword when forgot password is clicked', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.click(screen.getByText(/forgot password/i));

    expect(mockOnSwitchToForgotPassword).toHaveBeenCalled();
  });

  it('should have correct input types', () => {
    renderLoginForm();

    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
  });

  it('should have required attribute on inputs', () => {
    renderLoginForm();

    expect(screen.getByLabelText(/email/i)).toBeRequired();
    expect(screen.getByLabelText(/password/i)).toBeRequired();
  });
});
