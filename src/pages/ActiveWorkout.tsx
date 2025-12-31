import { useState, useEffect, useMemo, FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Button, Card, Input, Modal } from '../components/ui';
import { RestTimer } from '../components/timer/RestTimer';
import { ExerciseAccordion } from '../components/workout/ExerciseAccordion';
import { CardioAccordion } from '../components/workout/CardioAccordion';
import { ExerciseHistorySheet } from '../components/workout/ExerciseHistorySheet';
import { getAllExercises, searchExercises, getExerciseById } from '../data/exercises';
import {
  SessionExercise,
  StrengthSessionExercise,
  StrengthCompletedSet,
  CardioCompletedSet,
  ExerciseSuggestion,
  WorkoutScoreResult,
  StrengthExercise,
  CardioExercise,
  MuscleGroup,
  Equipment,
  DistanceUnit,
} from '../types';
import { getWorkoutScore } from '../services/openai';
import { formatDuration, hasSessionDeviatedFromTemplate, isCardioExercise } from '../utils/workoutUtils';

const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'traps', 'lats'];
const EQUIPMENT_OPTIONS: Equipment[] = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'ez-bar', 'smith-machine', 'resistance-band', 'other'];

export const ActiveWorkout: FC = () => {
  const activeSession = useAppStore((state) => state.activeSession);
  const sessions = useAppStore((state) => state.sessions);
  const templates = useAppStore((state) => state.templates);
  const preferences = useAppStore((state) => state.preferences);
  const customExercises = useAppStore((state) => state.customExercises);
  const setActiveSession = useAppStore((state) => state.setActiveSession);
  const addSession = useAppStore((state) => state.addSession);
  const addCustomExercise = useAppStore((state) => state.addCustomExercise);
  const updateTemplate = useAppStore((state) => state.updateTemplate);
  const navigate = useNavigate();
  const location = useLocation();

  // Get suggestions passed from Home/Templates page
  const suggestions: ExerciseSuggestion[] = location.state?.suggestions || [];

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showTimer, setShowTimer] = useState(false);

  // Custom exercise creation state
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscles, setNewExerciseMuscles] = useState<MuscleGroup[]>([]);
  const [newExerciseEquipment, setNewExerciseEquipment] = useState<Equipment>('other');
  const [timerDuration, setTimerDuration] = useState(90);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  // Scoring state
  const [isScoring, setIsScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<WorkoutScoreResult | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Exercise history sheet state
  const [historyExerciseId, setHistoryExerciseId] = useState<string | null>(null);
  const [historyExerciseName, setHistoryExerciseName] = useState<string>('');

  // Update plan checkbox state
  const [updatePlan, setUpdatePlan] = useState(false);

  const session = activeSession;

  // Redirect if no active session
  useEffect(() => {
    if (!session) {
      navigate('/');
    }
  }, [session, navigate]);

  // Auto-expand first incomplete exercise on mount
  useEffect(() => {
    if (session && expandedIndex === null) {
      const firstIncomplete = session.exercises.findIndex(
        (ex) => ex.type === 'cardio'
          ? ex.sets.length === 0
          : ex.sets.length < (ex.targetSets || 3)
      );
      setExpandedIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
    }
  }, [session, expandedIndex]);

  // Workout duration timer
  useEffect(() => {
    if (!session) return;

    const start = new Date(session.startedAt).getTime();
    setElapsedSeconds(Math.floor((Date.now() - start) / 1000));

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.startedAt]);

  // Detect if workout has deviated from template
  const hasDeviated = useMemo(
    () => session ? hasSessionDeviatedFromTemplate(session, templates) : false,
    [session, templates]
  );

  if (!session) return null;

  const getSuggestionForExercise = (exerciseId: string): ExerciseSuggestion | undefined => {
    return suggestions.find((s) => s.exerciseId === exerciseId);
  };

  const logSetForExercise = (exerciseIndex: number, reps: number, weight: number) => {
    const exercise = session.exercises[exerciseIndex];
    if (exercise.type !== 'strength') return;

    const newSet: StrengthCompletedSet = {
      type: 'strength',
      reps,
      weight,
      unit: preferences.weightUnit,
      completedAt: new Date().toISOString(),
    };

    const updatedExercises = [...session.exercises];
    updatedExercises[exerciseIndex] = {
      ...exercise,
      sets: [...exercise.sets, newSet],
    };

    const updatedSession = {
      ...session,
      exercises: updatedExercises,
    };

    setActiveSession(updatedSession);

    // Check if exercise is now complete - auto-collapse and expand next
    const updatedExercise = updatedExercises[exerciseIndex] as StrengthSessionExercise;
    if (updatedExercise.sets.length >= (updatedExercise.targetSets || 3)) {
      // Find next incomplete exercise
      const nextIncomplete = updatedExercises.findIndex(
        (ex, idx) => idx > exerciseIndex && ex.type === 'strength' && ex.sets.length < (ex.targetSets || 3)
      );
      if (nextIncomplete >= 0) {
        setExpandedIndex(nextIncomplete);
      } else {
        // All done, collapse current
        setExpandedIndex(null);
      }
    }
  };

  const logCardioForExercise = (exerciseIndex: number, distance: number, distanceUnit: DistanceUnit, durationSeconds: number) => {
    const exercise = session.exercises[exerciseIndex];
    if (exercise.type !== 'cardio') return;

    const newSet: CardioCompletedSet = {
      type: 'cardio',
      distance,
      distanceUnit,
      durationSeconds,
      completedAt: new Date().toISOString(),
    };

    const updatedExercises = [...session.exercises];
    updatedExercises[exerciseIndex] = {
      ...exercise,
      sets: [...exercise.sets, newSet],
    };

    const updatedSession = {
      ...session,
      exercises: updatedExercises,
    };

    setActiveSession(updatedSession);
  };

  const removeLastSetForExercise = (exerciseIndex: number) => {
    const exercise = session.exercises[exerciseIndex];
    if (exercise.sets.length === 0) return;

    const updatedExercises = [...session.exercises];
    updatedExercises[exerciseIndex] = {
      ...exercise,
      sets: exercise.sets.slice(0, -1),
    };

    setActiveSession({
      ...session,
      exercises: updatedExercises,
    });
  };

  const addExerciseToSession = (exerciseId: string) => {
    const exerciseInfo = getExerciseById(exerciseId, customExercises);
    const isCardio = exerciseInfo && isCardioExercise(exerciseInfo);

    let newExercise: SessionExercise;
    if (isCardio) {
      newExercise = {
        type: 'cardio',
        exerciseId,
        restSeconds: preferences.defaultRestSeconds,
        sets: [],
      };
    } else {
      newExercise = {
        type: 'strength',
        exerciseId,
        targetSets: 3,
        targetReps: 10,
        restSeconds: preferences.defaultRestSeconds,
        sets: [],
      };
    }

    const newIndex = session.exercises.length;

    setActiveSession({
      ...session,
      exercises: [...session.exercises, newExercise],
    });

    setShowExercisePicker(false);
    setExerciseSearch('');
    setExpandedIndex(newIndex);
  };

  const removeExercise = (index: number) => {
    const updatedExercises = session.exercises.filter((_, i) => i !== index);
    setActiveSession({
      ...session,
      exercises: updatedExercises,
    });

    // Adjust expanded index if needed
    if (expandedIndex !== null) {
      if (expandedIndex === index) {
        // Find next incomplete strength exercise or stay null
        const nextIncomplete = updatedExercises.findIndex(
          (ex) => ex.type === 'strength' && ex.sets.length < (ex.targetSets || 3)
        );
        setExpandedIndex(nextIncomplete >= 0 ? nextIncomplete : null);
      } else if (expandedIndex > index) {
        setExpandedIndex(expandedIndex - 1);
      }
    }
  };

  const handleStartTimer = (duration: number) => {
    setTimerDuration(duration);
    setShowTimer(true);
  };

  const updateTargetSets = (exerciseId: string, delta: number) => {
    const newExercises = session.exercises.map(ex => {
      if (ex.exerciseId === exerciseId && ex.type === 'strength') {
        return { ...ex, targetSets: Math.max(1, ex.targetSets + delta) };
      }
      return ex;
    });
    setActiveSession({ ...session, exercises: newExercises });
  };

  const handleShowHistory = (exerciseId: string) => {
    const exercise = getExerciseById(exerciseId, customExercises);
    setHistoryExerciseId(exerciseId);
    setHistoryExerciseName(exercise?.name || 'Exercise');
  };

  const finishWorkout = async () => {
    const completedSession = {
      ...session,
      completedAt: new Date().toISOString(),
    };

    // Update template if user opted to
    if (updatePlan && session.templateId && hasDeviated) {
      const existingTemplate = templates.find(t => t.id === session.templateId);
      if (existingTemplate) {
        const updatedTemplate = {
          ...existingTemplate,
          exercises: session.exercises.map(ex => {
            if (ex.type === 'cardio') {
              return {
                type: 'cardio' as const,
                exerciseId: ex.exerciseId,
                restSeconds: ex.restSeconds,
              };
            }
            return {
              type: 'strength' as const,
              exerciseId: ex.exerciseId,
              targetSets: ex.targetSets,
              targetReps: ex.targetReps,
              restSeconds: ex.restSeconds,
            };
          }),
        };
        updateTemplate(updatedTemplate);
      }
    }

    // Save to history immediately
    addSession(completedSession);
    setActiveSession(null);

    // If API key exists and is not empty, get score
    const apiKey = preferences.openaiApiKey?.trim();
    if (apiKey) {
      setIsScoring(true);
      setScoreError(null);
      setShowFinishConfirm(false);

      try {
        const score = await getWorkoutScore(
          apiKey,
          completedSession,
          sessions,
          preferences.weightUnit
        );
        setScoreResult(score);
      } catch (err) {
        console.error('Scoring error:', err);
        setScoreError(err instanceof Error ? err.message : 'Failed to get score');
        // Navigate to history on error after brief delay
        setTimeout(() => navigate('/history'), 2000);
      } finally {
        setIsScoring(false);
      }
    } else {
      // No API key, go directly to history
      navigate('/history');
    }
  };

  const cancelWorkout = () => {
    setActiveSession(null);
    navigate('/');
  };

  const allExercises = getAllExercises(customExercises);

  const filteredExercises = exerciseSearch
    ? searchExercises(exerciseSearch, customExercises)
    : allExercises;

  const resetNewExerciseForm = () => {
    setNewExerciseName('');
    setNewExerciseMuscles([]);
    setNewExerciseEquipment('other');
    setIsCreatingExercise(false);
  };

  const handleCreateExercise = () => {
    if (!newExerciseName.trim()) return;

    const newExercise: StrengthExercise = {
      id: `custom-${Date.now()}`,
      type: 'strength',
      name: newExerciseName.trim(),
      muscleGroups: newExerciseMuscles.length > 0 ? newExerciseMuscles : ['core'],
      equipment: newExerciseEquipment,
    };

    addCustomExercise(newExercise);
    addExerciseToSession(newExercise.id);
    resetNewExerciseForm();
  };

  const toggleMuscleGroup = (muscle: MuscleGroup) => {
    setNewExerciseMuscles(prev =>
      prev.includes(muscle)
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  // Calculate total stats
  const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const totalVolume = session.exercises.reduce((acc, ex) => {
    return acc + ex.sets.reduce((setAcc, set) => {
      if (set.type === 'strength' || !('type' in set)) {
        const strengthSet = set as { weight: number; reps: number };
        return setAcc + strengthSet.weight * strengthSet.reps;
      }
      return setAcc;
    }, 0);
  }, 0);
  const totalCardioDistance = session.exercises.reduce((acc, ex) => {
    return acc + ex.sets.reduce((setAcc, set) => {
      if (set.type === 'cardio') {
        return setAcc + set.distance;
      }
      return setAcc;
    }, 0);
  }, 0);

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {session.name}
            </h1>
            <span className="text-lg font-mono text-primary">
              {formatDuration(elapsedSeconds)}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalSets} sets
            {totalVolume > 0 && ` | ${totalVolume.toLocaleString()} ${preferences.weightUnit}`}
            {totalCardioDistance > 0 && ` | ${totalCardioDistance.toFixed(2)} ${preferences.distanceUnit}`}
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setShowFinishConfirm(true)}>
          Finish
        </Button>
      </div>

      {/* Scrollable Exercise Accordions */}
      {session.exercises.length > 0 ? (
        <div className="space-y-3">
          {session.exercises.map((exercise, index) => {
            const exerciseInfo = getExerciseById(exercise.exerciseId, customExercises);

            if (exercise.type === 'cardio') {
              return (
                <CardioAccordion
                  key={index}
                  exercise={exercise}
                  exerciseInfo={exerciseInfo as CardioExercise | undefined}
                  isExpanded={expandedIndex === index}
                  onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  onLogCardio={(distance, distanceUnit, durationSeconds) =>
                    logCardioForExercise(index, distance, distanceUnit, durationSeconds)
                  }
                  onRemoveLastSet={() => removeLastSetForExercise(index)}
                  onRemoveExercise={() => removeExercise(index)}
                  onShowHistory={() => handleShowHistory(exercise.exerciseId)}
                  distanceUnit={preferences.distanceUnit}
                />
              );
            }

            return (
              <ExerciseAccordion
                key={index}
                exercise={exercise}
                exerciseInfo={exerciseInfo as StrengthExercise | undefined}
                isExpanded={expandedIndex === index}
                onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                onLogSet={(reps, weight) => logSetForExercise(index, reps, weight)}
                onRemoveLastSet={() => removeLastSetForExercise(index)}
                onRemoveExercise={() => removeExercise(index)}
                onStartTimer={handleStartTimer}
                onUpdateTargetSets={(delta) => updateTargetSets(exercise.exerciseId, delta)}
                onShowHistory={() => handleShowHistory(exercise.exerciseId)}
                weightUnit={preferences.weightUnit}
                suggestion={getSuggestionForExercise(exercise.exerciseId)}
              />
            );
          })}

          {/* Add Exercise Button */}
          <button
            onClick={() => setShowExercisePicker(true)}
            className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            + Add Exercise
          </button>
        </div>
      ) : (
        <Card className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No exercises in this workout yet
          </p>
          <Button onClick={() => setShowExercisePicker(true)}>
            Add Exercise
          </Button>
        </Card>
      )}

      {/* Rest Timer */}
      {showTimer && (
        <RestTimer
          duration={timerDuration}
          autoStart={true}
          onComplete={() => {}}
          onSkip={() => setShowTimer(false)}
        />
      )}

      {/* Exercise Picker Modal */}
      <Modal
        isOpen={showExercisePicker}
        onClose={() => {
          setShowExercisePicker(false);
          setExerciseSearch('');
          resetNewExerciseForm();
        }}
        title={isCreatingExercise ? "Create New Exercise" : "Add Exercise"}
      >
        {isCreatingExercise ? (
          <div className="space-y-4">
            <Input
              label="Exercise Name"
              placeholder="e.g., Cable Lateral Raise"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
            />

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Muscle Groups
              </label>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUPS.map((muscle) => (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => toggleMuscleGroup(muscle)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      newExerciseMuscles.includes(muscle)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {muscle}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Equipment
              </label>
              <select
                value={newExerciseEquipment}
                onChange={(e) => setNewExerciseEquipment(e.target.value as Equipment)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {EQUIPMENT_OPTIONS.map((equip) => (
                  <option key={equip} value={equip}>
                    {equip.charAt(0).toUpperCase() + equip.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={resetNewExerciseForm} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateExercise} disabled={!newExerciseName.trim()} className="flex-1">
                Create & Add
              </Button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => setIsCreatingExercise(true)}
              className="w-full mb-4 p-3 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Exercise
            </button>

            <Input
              placeholder="Search exercises..."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              className="mb-4"
            />
            <div className="max-h-80 overflow-y-auto space-y-2">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => addExerciseToSession(exercise.id)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {exercise.name}
                    </p>
                    {exercise.type === 'cardio' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        Cardio
                      </span>
                    )}
                    {exercise.id.startsWith('custom-') && (
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {exercise.type === 'cardio'
                      ? exercise.cardioType
                      : exercise.muscleGroups.join(', ')}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </Modal>

      {/* Finish Confirm Modal */}
      <Modal
        isOpen={showFinishConfirm}
        onClose={() => setShowFinishConfirm(false)}
        title="Finish Workout?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowFinishConfirm(false)}>
              Keep Going
            </Button>
            <Button variant="danger" onClick={cancelWorkout}>
              Discard
            </Button>
            <Button onClick={finishWorkout}>
              Save & Finish
            </Button>
          </>
        }
      >
        <div className="text-center py-4">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Great workout! Here's your summary:
          </p>
          <div className="flex justify-center gap-8 flex-wrap">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalSets}</p>
              <p className="text-sm text-gray-500">Total Sets</p>
            </div>
            {totalVolume > 0 && (
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {totalVolume.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Total {preferences.weightUnit}</p>
              </div>
            )}
            {totalCardioDistance > 0 && (
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {totalCardioDistance.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Total {preferences.distanceUnit}</p>
              </div>
            )}
          </div>
          {hasDeviated && session.templateId && (
            <label className="flex items-center justify-center gap-2 mt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={updatePlan}
                onChange={(e) => setUpdatePlan(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Update saved plan with these changes
              </span>
            </label>
          )}
        </div>
      </Modal>

      {/* Scoring Loading Modal */}
      <Modal
        isOpen={isScoring}
        onClose={() => {}}
        title="Analyzing Your Workout"
      >
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            AI is analyzing your performance...
          </p>
        </div>
      </Modal>

      {/* Score Result Modal */}
      <Modal
        isOpen={!!scoreResult}
        onClose={() => {
          setScoreResult(null);
          navigate('/history');
        }}
        title="Workout Score"
        footer={
          <Button onClick={() => {
            setScoreResult(null);
            navigate('/history');
          }}>
            Done
          </Button>
        }
      >
        {scoreResult && (
          <div className="py-4">
            {/* Score Circle */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-2">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {scoreResult.grade}
                </span>
              </div>
              <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                {scoreResult.score}/100
              </p>
            </div>

            {/* Summary */}
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {scoreResult.summary}
            </p>

            {/* Highlights */}
            {scoreResult.highlights.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                  What went well
                </h4>
                <ul className="space-y-1">
                  {scoreResult.highlights.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-green-500">+</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {scoreResult.improvements.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                  Areas to improve
                </h4>
                <ul className="space-y-1">
                  {scoreResult.improvements.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-orange-500">-</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Score Error Toast */}
      {scoreError && (
        <div className="fixed bottom-20 left-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
          <p className="text-sm">Failed to get score: {scoreError}</p>
          <p className="text-xs mt-1">Redirecting to history...</p>
        </div>
      )}

      {/* Exercise History Sheet */}
      <ExerciseHistorySheet
        isOpen={historyExerciseId !== null}
        onClose={() => setHistoryExerciseId(null)}
        exerciseId={historyExerciseId || ''}
        exerciseName={historyExerciseName}
        sessions={sessions}
        weightUnit={preferences.weightUnit}
      />
    </div>
  );
}
