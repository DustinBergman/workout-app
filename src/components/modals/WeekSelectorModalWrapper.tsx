import { FC } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../ui';
import { ProgressiveOverloadWeek, getWeekConfigForGoal, WORKOUT_GOALS } from '../../types';

export const WeekSelectorModalWrapper: FC = () => {
  const { closeModal } = useModal();
  const currentWeek = useAppStore((state) => state.currentWeek);
  const workoutGoal = useAppStore((state) => state.workoutGoal);
  const setCurrentWeek = useAppStore((state) => state.setCurrentWeek);
  const cycleConfig = useAppStore((state) => state.cycleConfig);
  const cycleState = useAppStore((state) => state.cycleState);

  const weekConfig = getWeekConfigForGoal(workoutGoal);
  const goalInfo = WORKOUT_GOALS[workoutGoal];

  const handleSelectWeek = (week: ProgressiveOverloadWeek) => {
    setCurrentWeek(week);
    closeModal();
  };

  // If using new cycle system, show phase-based view
  if (cycleConfig && cycleState) {
    // Calculate total weeks elapsed and week within each phase
    let weekCounter = 0;
    const phaseWeeks: { phaseIndex: number; weekInPhase: number; globalWeek: number }[] = [];

    for (let i = 0; i < cycleConfig.phases.length; i++) {
      const phase = cycleConfig.phases[i];
      for (let w = 1; w <= phase.durationWeeks; w++) {
        phaseWeeks.push({
          phaseIndex: i,
          weekInPhase: w,
          globalWeek: weekCounter + 1,
        });
        weekCounter++;
      }
    }

    const currentGlobalWeek =
      phaseWeeks.findIndex(
        (pw) =>
          pw.phaseIndex === cycleState.currentPhaseIndex &&
          pw.weekInPhase === cycleState.currentWeekInPhase
      ) + 1;

    return (
      <Modal
        isOpen={true}
        onClose={closeModal}
        title={`${cycleConfig.name}`}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Your current position in the training cycle. Phases advance automatically each week.
          </p>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {cycleConfig.phases.map((phase, phaseIndex) => {
              const isCurrentPhase = phaseIndex === cycleState.currentPhaseIndex;
              const isPastPhase = phaseIndex < cycleState.currentPhaseIndex;

              return (
                <div
                  key={phaseIndex}
                  className={`p-4 rounded-xl border ${
                    isCurrentPhase
                      ? 'border-primary bg-primary/10'
                      : isPastPhase
                      ? 'border-border bg-muted/30 opacity-60'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground">
                      {phase.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {phase.durationWeeks} week{phase.durationWeeks > 1 ? 's' : ''}
                      </span>
                      {isCurrentPhase && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          Week {cycleState.currentWeekInPhase}/{phase.durationWeeks}
                        </span>
                      )}
                      {isPastPhase && (
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {phase.intensityDescription}
                  </p>
                  {'repRangeMin' in phase && 'repRangeMax' in phase && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Rep range: {phase.repRangeMin}-{phase.repRangeMax}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Week {currentGlobalWeek} of {cycleConfig.totalWeeks} total
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  // Legacy system - show week selection
  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title={`Select ${goalInfo.cycleName} Week`}
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          Choose your current training week. AI suggestions will be adjusted accordingly.
        </p>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {([0, 1, 2, 3, 4] as ProgressiveOverloadWeek[]).map((week) => {
            const weekInfo = weekConfig[week];
            const isSelected = week === currentWeek;
            return (
              <button
                key={week}
                onClick={() => handleSelectWeek(week)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">
                    Week {week + 1}: {weekInfo.name}
                  </span>
                  {isSelected && (
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {weekInfo.description}
                </p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Weight: {weekInfo.weightAdjustment}</span>
                  <span>Reps: {weekInfo.repRange}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
