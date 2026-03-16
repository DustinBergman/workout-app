import { FC, useState, useEffect } from 'react';
import { Modal } from '../ui';

interface LoadingModalProps {
  isOpen: boolean;
}

const STATUS_MESSAGES = [
  'Analyzing your workout history...',
  'Calculating progressive overload...',
  'Personalizing recommendations...',
  'Dialing in your weights...',
];

export const LoadingModal: FC<LoadingModalProps> = ({ isOpen }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="Preparing Your Workout">
      <div className="flex flex-col items-center py-10 gap-8">
        {/* Orbital animation */}
        <div className="relative w-32 h-32">
          {/* Pulse rings */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-interactive/30"
              style={{
                animation: `ai-pulse-ring 2.4s ease-out ${i * 0.8}s infinite`,
              }}
            />
          ))}

          {/* Outer orbit track */}
          <div className="absolute inset-2 rounded-full border border-border-2/40" />
          {/* Inner orbit track */}
          <div className="absolute inset-5 rounded-full border border-border-2/30" />

          {/* Orbiting dots - outer ring */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={`outer-${i}`}
              className="absolute top-1/2 left-1/2 w-0 h-0"
              style={{
                animation: `ai-orbit 3s linear ${i * 0.75}s infinite`,
              }}
            >
              <div
                className="w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full bg-interactive shadow-[0_0_8px_2px] shadow-interactive/50"
              />
            </div>
          ))}

          {/* Orbiting dots - inner ring (reverse) */}
          {[0, 1, 2].map((i) => (
            <div
              key={`inner-${i}`}
              className="absolute top-1/2 left-1/2 w-0 h-0"
              style={{
                animation: `ai-orbit-reverse 2.4s linear ${i * 0.8}s infinite`,
              }}
            >
              <div
                className="w-2 h-2 -ml-1 -mt-1 rounded-full bg-interactive/70 shadow-[0_0_6px_2px] shadow-interactive/30"
              />
            </div>
          ))}

          {/* Core */}
          <div
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-gradient-to-br from-interactive to-interactive/60 flex items-center justify-center shadow-[0_0_24px_4px] shadow-interactive/30"
            style={{ animation: 'ai-core-pulse 2s ease-in-out infinite' }}
          >
            {/* Brain / AI icon */}
            <svg className="w-7 h-7 text-interactive-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
        </div>

        {/* Audio-bar style equalizer */}
        <div className="flex items-end gap-1 h-6">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="w-1 bg-interactive/60 rounded-full origin-bottom"
              style={{
                height: '100%',
                animation: `ai-bar 1.2s ease-in-out ${i * 0.1}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Status message with shimmer */}
        <p
          className="text-sm font-medium text-fg-2 transition-opacity duration-300"
          key={messageIndex}
          style={{
            animation: 'ai-shimmer 2s linear infinite',
            backgroundImage: 'linear-gradient(90deg, var(--fg-2) 30%, var(--interactive) 50%, var(--fg-2) 70%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {STATUS_MESSAGES[messageIndex]}
        </p>
      </div>
    </Modal>
  );
};
