import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPasswordForm } from './ForgotPasswordForm';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../hooks/useAuth';

describe('ForgotPasswordForm', () => {
  const mockResetPassword = vi.fn();
  const mockOnSwitchToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      resetPassword: mockResetPassword,
    } as never);
  });

  const renderForgotPasswordForm = () => {
    return render(
      <ForgotPasswordForm onSwitchToLogin={mockOnSwitchToLogin} />
    );
  };

  it('should render forgot password form with all elements', () => {
    renderForgotPasswordForm();

    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  it('should update email input value', async () => {
    const user = userEvent.setup();
    renderForgotPasswordForm();

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should call resetPassword on form submit', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue({ error: null });

    renderForgotPasswordForm();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('should show success screen after email is sent', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue({ error: null });

    renderForgotPasswordForm();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });

    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument();
  });

  it('should display error message on reset failure', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue({
      error: { message: 'User not found' },
    });

    renderForgotPasswordForm();

    await user.type(screen.getByLabelText(/email/i), 'nonexistent@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('should not show success screen on failure', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue({
      error: { message: 'User not found' },
    });

    renderForgotPasswordForm();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });

    expect(screen.queryByText('Check Your Email')).not.toBeInTheDocument();
  });

  it('should show loading state while sending', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    renderForgotPasswordForm();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(screen.getByText('Sending...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
  });

  it('should call onSwitchToLogin when back to login is clicked', async () => {
    const user = userEvent.setup();
    renderForgotPasswordForm();

    await user.click(screen.getByText(/back to login/i));

    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });

  it('should call onSwitchToLogin from success screen', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue({ error: null });

    renderForgotPasswordForm();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /back to login/i }));

    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });

  it('should have correct input type for email', () => {
    renderForgotPasswordForm();

    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
  });

  it('should have required attribute on email input', () => {
    renderForgotPasswordForm();

    expect(screen.getByLabelText(/email/i)).toBeRequired();
  });

  it('should clear error when resubmitting', async () => {
    const user = userEvent.setup();
    mockResetPassword
      .mockResolvedValueOnce({ error: { message: 'User not found' } })
      .mockResolvedValueOnce({ error: null });

    renderForgotPasswordForm();

    // First submission - fails
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });

    // Second submission - succeeds
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });

    expect(screen.queryByText('User not found')).not.toBeInTheDocument();
  });
});
