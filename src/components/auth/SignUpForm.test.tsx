import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignUpForm } from './SignUpForm';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock resendConfirmation
vi.mock('../../services/supabase/auth', () => ({
  resendConfirmation: vi.fn(),
}));

import { useAuth } from '../../hooks/useAuth';
import { resendConfirmation } from '../../services/supabase/auth';

describe('SignUpForm', () => {
  const mockSignUp = vi.fn();
  const mockOnSwitchToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      signUp: mockSignUp,
    } as never);
    vi.mocked(resendConfirmation).mockResolvedValue({ error: null });
  });

  const renderSignUpForm = () => {
    return render(
      <SignUpForm
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );
  };

  it('should render signup form with all elements', () => {
    renderSignUpForm();

    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByText('Start your fitness journey')).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should have disabled submit button initially', () => {
    renderSignUpForm();

    expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled();
  });

  it('should enable submit button when all required fields are valid', async () => {
    const user = userEvent.setup();
    renderSignUpForm();

    await user.type(screen.getByLabelText(/^email$/i), 'john@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled();
    });
  });

  it('should show error when email is invalid', async () => {
    const user = userEvent.setup();
    renderSignUpForm();

    const emailInput = screen.getByLabelText(/^email$/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Blur the field

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('should show error when password is too short', async () => {
    const user = userEvent.setup();
    renderSignUpForm();

    await user.type(screen.getByLabelText(/^password$/i), 'abc1');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('should show error when password has no number', async () => {
    const user = userEvent.setup();
    renderSignUpForm();

    await user.type(screen.getByLabelText(/^password$/i), 'abcdefgh');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one number/i)).toBeInTheDocument();
    });
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderSignUpForm();

    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'differentpassword');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should call signUp with correct parameters', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ error: null });

    renderSignUpForm();

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/^email$/i), 'john@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('john@example.com', 'password123', {
        firstName: 'John',
        lastName: 'Doe',
      });
    });
  });

  it('should show confirmation screen after successful signup', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ error: null });

    renderSignUpForm();

    await user.type(screen.getByLabelText(/^email$/i), 'john@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });

    expect(screen.getByText(/john@example.com/)).toBeInTheDocument();
  });

  it('should display error message on signup failure', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({
      error: { message: 'Email already registered' },
    });

    renderSignUpForm();

    await user.type(screen.getByLabelText(/^email$/i), 'john@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });

  it('should show loading state while signing up', async () => {
    const user = userEvent.setup();
    mockSignUp.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    renderSignUpForm();

    await user.type(screen.getByLabelText(/^email$/i), 'john@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText('Creating Account...')).toBeInTheDocument();
  });

  it('should call onSwitchToLogin when sign in link is clicked', async () => {
    const user = userEvent.setup();
    renderSignUpForm();

    await user.click(screen.getByText(/sign in/i));

    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });

  describe('Confirmation screen', () => {
    const setupConfirmationScreen = async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ error: null });

      renderSignUpForm();

      await user.type(screen.getByLabelText(/^email$/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled();
      });

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      });

      return user;
    };

    it('should show resend email button', async () => {
      await setupConfirmationScreen();

      expect(screen.getByText(/didn't receive an email\? resend/i)).toBeInTheDocument();
    });

    it('should call resendConfirmation when resend button is clicked', async () => {
      const user = await setupConfirmationScreen();

      await user.click(screen.getByText(/didn't receive an email\? resend/i));

      await waitFor(() => {
        expect(resendConfirmation).toHaveBeenCalledWith('john@example.com');
      });
    });

    it('should show success message after resending email', async () => {
      const user = await setupConfirmationScreen();

      await user.click(screen.getByText(/didn't receive an email\? resend/i));

      await waitFor(() => {
        expect(screen.getByText(/email sent! check your inbox/i)).toBeInTheDocument();
      });
    });

    it('should show error message when resend fails', async () => {
      vi.mocked(resendConfirmation).mockResolvedValue({
        error: { message: 'Too many requests' } as never,
      });

      const user = await setupConfirmationScreen();

      await user.click(screen.getByText(/didn't receive an email\? resend/i));

      await waitFor(() => {
        expect(screen.getByText(/failed to resend/i)).toBeInTheDocument();
      });
    });

    it('should call onSwitchToLogin from confirmation screen', async () => {
      const user = await setupConfirmationScreen();

      await user.click(screen.getByRole('button', { name: /back to login/i }));

      expect(mockOnSwitchToLogin).toHaveBeenCalled();
    });
  });
});
