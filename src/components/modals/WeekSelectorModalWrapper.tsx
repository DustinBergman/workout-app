import { FC } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../ui';
import { isStrengthPhase, StrengthPhaseConfig } from '../../types/cycles';

export const WeekSelectorModalWrapper: FC = () => {
  const { closeModal } = useModal();
  const cycleConfig = useAppStore((state) => state.cycleConfig);
  const cycleState = useAppStore((state) => state.cycleState);
  const setCurrentPhase = useAppStore((state) => state.setCurrentPhase);

  const handleSelectPhase = (phaseIndex: number) => {
    setCurrentPhase(phaseIndex);
    closeModal();
  };

  // Check if all phases are single-week (e.g. the 5-week goal cycles)
  const allSingleWeek = cycleConfig.phases.every(p => p.durationWeeks === 1);

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title={cycleConfig.name}
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          Tap a phase to jump to it.
        </p>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {cycleConfig.phases.map((phase, phaseIndex) => {
            const isCurrentPhase = phaseIndex === cycleState.currentPhaseIndex;
            const isPastPhase = phaseIndex < cycleState.currentPhaseIndex;
            const weightAdjustment = isStrengthPhase(phase)
              ? (phase as StrengthPhaseConfig).weightAdjustment
              : undefined;
            const hasRepRange = 'repRangeMin' in phase && 'repRangeMax' in phase;

            return (
              <button
                key={phaseIndex}
                onClick={() => handleSelectPhase(phaseIndex)}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  isCurrentPhase
                    ? 'border-primary bg-primary/10'
                    : isPastPhase
                    ? 'border-border bg-muted/30 opacity-60 hover:opacity-100 hover:border-primary/50'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Phase number pill */}
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      isCurrentPhase
                        ? 'bg-primary text-primary-foreground'
                        : isPastPhase
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {isPastPhase ? (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        phaseIndex + 1
                      )}
                    </span>
                    <div className="min-w-0">
                      <span className="font-semibold text-foreground text-sm">
                        {phase.name}
                      </span>
                      {/* Compact details inline */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {hasRepRange && (
                          <span>{phase.repRangeMin}-{phase.repRangeMax} reps</span>
                        )}
                        {hasRepRange && weightAdjustment && (
                          <span className="text-muted-foreground/40">|</span>
                        )}
                        {weightAdjustment && (
                          <span>{weightAdjustment}</span>
                        )}
                        {!hasRepRange && !weightAdjustment && (
                          <span>{phase.intensityDescription}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: current badge or multi-week info */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!allSingleWeek && (
                      <span className="text-xs text-muted-foreground">
                        {phase.durationWeeks}w
                      </span>
                    )}
                    {isCurrentPhase && !allSingleWeek && phase.durationWeeks > 1 && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Wk {cycleState.currentWeekInPhase}/{phase.durationWeeks}
                      </span>
                    )}
                    {isCurrentPhase && (allSingleWeek || phase.durationWeeks === 1) && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Phase {cycleState.currentPhaseIndex + 1} of {cycleConfig.phases.length}
          </p>
        </div>
      </div>
    </Modal>
  );
};
