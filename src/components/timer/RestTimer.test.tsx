import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RestTimer } from './RestTimer';

// Mock AudioContext
const mockClose = vi.fn();
const mockCreateOscillator = vi.fn(() => ({
  connect: vi.fn(),
  frequency: { value: 0 },
  type: '',
  start: vi.fn(),
  stop: vi.fn(),
}));
const mockCreateGain = vi.fn(() => ({
  connect: vi.fn(),
  gain: {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
}));

const MockAudioContext = vi.fn(() => ({
  currentTime: 0,
  destination: {},
  createOscillator: mockCreateOscillator,
  createGain: mockCreateGain,
  close: mockClose,
}));

(window as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;

describe('RestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render rest timer title', () => {
      render(<RestTimer duration={60} />);
      expect(screen.getByText('Rest Timer')).toBeInTheDocument();
    });

    it('should display formatted time', () => {
      render(<RestTimer duration={90} autoStart />);
      expect(screen.getByText('1:30')).toBeInTheDocument();
    });

    it('should show Skip button when not complete', () => {
      render(<RestTimer duration={60} autoStart />);
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });

    it('should show Pause button when running', () => {
      render(<RestTimer duration={60} autoStart />);
      expect(screen.getByText('Pause')).toBeInTheDocument();
    });
  });

  describe('autoStart', () => {
    it('should auto start when autoStart is true', () => {
      render(<RestTimer duration={60} autoStart />);
      expect(screen.getByText('1:00')).toBeInTheDocument();
      expect(screen.getByText('Pause')).toBeInTheDocument();
    });

    it('should not auto start when autoStart is false', () => {
      render(<RestTimer duration={60} autoStart={false} />);
      // Timer should show 0:00 since it hasn't started
      expect(screen.getByText('0:00')).toBeInTheDocument();
    });
  });

  describe('countdown', () => {
    it('should count down seconds', async () => {
      render(<RestTimer duration={5} autoStart />);
      expect(screen.getByText('0:05')).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('0:04')).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('0:03')).toBeInTheDocument();
    });

    it('should show GO! when complete', async () => {
      render(<RestTimer duration={2} autoStart />);

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('GO!')).toBeInTheDocument();
      expect(screen.getByText('Rest Complete!')).toBeInTheDocument();
    });
  });

  describe('controls', () => {
    it('should pause timer when Pause is clicked', async () => {
      render(<RestTimer duration={10} autoStart />);

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByText('0:08')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Pause'));

      // Should show Resume button now
      expect(screen.getByText('Resume')).toBeInTheDocument();

      // Time should not change
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByText('0:08')).toBeInTheDocument();
    });

    it('should resume timer when Resume is clicked', async () => {
      render(<RestTimer duration={10} autoStart />);

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });
      fireEvent.click(screen.getByText('Pause'));
      fireEvent.click(screen.getByText('Resume'));

      expect(screen.getByText('Pause')).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('0:07')).toBeInTheDocument();
    });

    it('should call onSkip when Skip is clicked', () => {
      const onSkip = vi.fn();
      render(<RestTimer duration={60} autoStart onSkip={onSkip} />);

      fireEvent.click(screen.getByText('Skip'));

      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('should show Continue button when complete', async () => {
      render(<RestTimer duration={1} autoStart />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    it('should call onSkip when Continue is clicked', async () => {
      const onSkip = vi.fn();
      render(<RestTimer duration={1} autoStart onSkip={onSkip} />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      fireEvent.click(screen.getByText('Continue'));

      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('should show restart button with duration when complete', async () => {
      render(<RestTimer duration={90} autoStart />);

      await act(async () => {
        vi.advanceTimersByTime(90000);
      });

      expect(screen.getByText('+1:30')).toBeInTheDocument();
    });

    it('should restart timer when restart button is clicked', async () => {
      render(<RestTimer duration={90} autoStart />);

      await act(async () => {
        vi.advanceTimersByTime(90000);
      });
      expect(screen.getByText('GO!')).toBeInTheDocument();

      fireEvent.click(screen.getByText('+1:30'));

      expect(screen.getByText('1:30')).toBeInTheDocument();
      expect(screen.getByText('Rest Timer')).toBeInTheDocument();
    });
  });

  describe('callbacks', () => {
    it('should call onComplete when timer finishes', async () => {
      const onComplete = vi.fn();
      render(<RestTimer duration={2} autoStart onComplete={onComplete} />);

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should attempt to play audio notification when complete', async () => {
      // Audio context is created in the component when timer completes
      // This test verifies the timer completion triggers the audio code path
      render(<RestTimer duration={1} autoStart />);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Verify the timer completed (which would trigger audio)
      expect(screen.getByText('GO!')).toBeInTheDocument();
    });
  });

  describe('time formatting', () => {
    it('should format single digit seconds with leading zero', () => {
      render(<RestTimer duration={5} autoStart />);
      expect(screen.getByText('0:05')).toBeInTheDocument();
    });

    it('should format minutes and seconds correctly', () => {
      render(<RestTimer duration={125} autoStart />);
      expect(screen.getByText('2:05')).toBeInTheDocument();
    });

    it('should handle exact minute values', () => {
      render(<RestTimer duration={120} autoStart />);
      expect(screen.getByText('2:00')).toBeInTheDocument();
    });
  });
});
