import { useState, useEffect, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  Card,
  Button,
  Input,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
  Modal,
} from '../components/ui';
import { exportAllData, importAllData, clearAllData } from '../services/storage';
import {
  WorkoutGoal,
  WORKOUT_GOALS,
  ExperienceLevel,
  PREDEFINED_CYCLES,
  TrainingCycleConfig,
  GOAL_DEFAULT_CYCLES,
} from '../types';
import { useAuth } from '../hooks/useAuth';
import { getProfile, updateUsername, checkUsernameAvailability } from '../services/supabase/profiles';
import { getCycleRecommendation, CycleRecommendation } from '../services/openai';
import { toast } from '../store/toastStore';

type SettingsTab = 'training' | 'preferences' | 'account';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'training', label: 'Training' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'account', label: 'Account' },
];

export const Settings: FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const preferences = useAppStore((state) => state.preferences);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const workoutGoal = useAppStore((state) => state.workoutGoal);
  const setWorkoutGoal = useAppStore((state) => state.setWorkoutGoal);
  const cycleConfig = useAppStore((state) => state.cycleConfig);
  const cycleState = useAppStore((state) => state.cycleState);
  const setCycleConfig = useAppStore((state) => state.setCycleConfig);
  const sessions = useAppStore((state) => state.sessions);
  const customExercises = useAppStore((state) => state.customExercises);

  const [activeTab, setActiveTab] = useState<SettingsTab>('training');
  const [showApiKey, setShowApiKey] = useState(false);
  const [cycleRecommendation, setCycleRecommendation] = useState<CycleRecommendation | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(preferences.openaiApiKey || '');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [showGoalConfirm, setShowGoalConfirm] = useState(false);
  const [pendingGoal, setPendingGoal] = useState<WorkoutGoal | null>(null);
  const [showCycleConfirm, setShowCycleConfirm] = useState(false);
  const [pendingCycle, setPendingCycle] = useState<TrainingCycleConfig | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);

  // Load current username on mount
  useEffect(() => {
    const loadUsername = async () => {
      if (!isAuthenticated) return;
      const { profile } = await getProfile();
      if (profile?.username) {
        setUsername(profile.username);
        setUsernameInput(profile.username);
      }
    };
    loadUsername();
  }, [isAuthenticated]);

  const handleSaveUsername = async () => {
    const trimmed = usernameInput.trim().toLowerCase();

    if (trimmed === username) {
      return;
    }

    setUsernameError('');
    setUsernameSaving(true);

    // Check availability
    const { available, error: checkError } = await checkUsernameAvailability(trimmed);
    if (checkError) {
      setUsernameError(checkError.message);
      setUsernameSaving(false);
      return;
    }
    if (!available) {
      setUsernameError('Username is already taken');
      setUsernameSaving(false);
      return;
    }

    // Update username
    const { error: updateError } = await updateUsername(trimmed);
    if (updateError) {
      setUsernameError(updateError.message);
      setUsernameSaving(false);
      return;
    }

    setUsername(trimmed);
    setUsernameInput(trimmed);
    setUsernameSaving(false);
    setUsernameSaved(true);
    setTimeout(() => setUsernameSaved(false), 2000);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importAllData(content);
      if (success) {
        setImportSuccess(true);
        setImportError('');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setImportError('Invalid file format');
        setImportSuccess(false);
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (confirm('Are you sure? This will delete all your workout data permanently.')) {
      if (confirm('This cannot be undone. Are you really sure?')) {
        clearAllData();
        window.location.reload();
      }
    }
  };

  const saveApiKey = () => {
    const trimmedKey = apiKeyInput.trim();
    updatePreferences({ openaiApiKey: trimmedKey });
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  };

  const handleGoalClick = (goal: WorkoutGoal) => {
    if (goal === workoutGoal) return;
    setPendingGoal(goal);
    setShowGoalConfirm(true);
  };

  const confirmGoalChange = () => {
    if (pendingGoal) {
      setWorkoutGoal(pendingGoal);
    }
    setShowGoalConfirm(false);
    setPendingGoal(null);
  };

  const cancelGoalChange = () => {
    setShowGoalConfirm(false);
    setPendingGoal(null);
  };

  const handleCycleClick = (cycle: TrainingCycleConfig) => {
    if (cycle.id === cycleConfig?.id) return;
    setPendingCycle(cycle);
    setShowCycleConfirm(true);
  };

  const confirmCycleChange = () => {
    if (pendingCycle) {
      setCycleConfig(pendingCycle);
    }
    setShowCycleConfirm(false);
    setPendingCycle(null);
  };

  const cancelCycleChange = () => {
    setShowCycleConfirm(false);
    setPendingCycle(null);
  };

  const getRecommendation = async () => {
    if (!preferences.openaiApiKey) return;

    setLoadingRecommendation(true);
    setCycleRecommendation(null);

    try {
      const recommendation = await getCycleRecommendation(
        preferences.openaiApiKey,
        sessions,
        preferences.experienceLevel || 'intermediate',
        workoutGoal,
        customExercises,
        cycleConfig?.id
      );
      setCycleRecommendation(recommendation);
    } catch (error) {
      console.error('Failed to get cycle recommendation:', error);
      toast.error('Failed to get AI recommendation');
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const applyRecommendedCycle = () => {
    if (!cycleRecommendation) return;
    const cycle = PREDEFINED_CYCLES.find(c => c.id === cycleRecommendation.recommendedCycleId);
    if (cycle) {
      handleCycleClick(cycle);
    }
  };

  // Filter cycles: show all cycles, but put the default for the current goal first
  const defaultCycleId = GOAL_DEFAULT_CYCLES[workoutGoal];
  const relevantCycles = PREDEFINED_CYCLES
    .filter(cycle => cycle.cycleType === 'strength' || cycle.cycleType === 'cardio')
    .sort((a, b) => {
      if (a.id === defaultCycleId) return -1;
      if (b.id === defaultCycleId) return 1;
      const aRecommended = a.recommendedForGoals.includes(workoutGoal);
      const bRecommended = b.recommendedForGoals.includes(workoutGoal);
      if (aRecommended && !bRecommended) return -1;
      if (!aRecommended && bRecommended) return 1;
      return 0;
    });

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-foreground mb-4">
        Settings
      </h1>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 bg-muted/50 p-1 rounded-xl">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================ */}
      {/* TRAINING TAB */}
      {/* ============================================ */}
      {activeTab === 'training' && (
        <>
          {/* Goal Toggle */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Training Goal
            </h2>
            <div className="flex gap-2">
              {(Object.keys(WORKOUT_GOALS) as WorkoutGoal[]).map((goal) => {
                const goalInfo = WORKOUT_GOALS[goal];
                const isSelected = goal === workoutGoal;
                return (
                  <Button
                    key={goal}
                    variant={isSelected ? 'primary' : 'outline'}
                    onClick={() => handleGoalClick(goal)}
                    className="flex-1"
                  >
                    {goalInfo.name}
                  </Button>
                );
              })}
            </div>
          </section>

          {/* Current cycle status */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Current Cycle
            </h2>
            <Card className="bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cycle</p>
                  <p className="font-semibold text-foreground">{cycleConfig.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Phase</p>
                  <p className="font-semibold text-primary">
                    {cycleConfig.phases[cycleState.currentPhaseIndex]?.name ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Week {cycleState.currentWeekInPhase} of {cycleConfig.phases[cycleState.currentPhaseIndex]?.durationWeeks ?? '?'}
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Experience Level */}
          <section className="mb-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-foreground">Experience Level</Label>
                  <p className="text-sm text-muted-foreground">Affects progression recommendations</p>
                </div>
                <Select
                  value={preferences.experienceLevel || 'intermediate'}
                  onValueChange={(value) => updatePreferences({ experienceLevel: value as ExperienceLevel })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </section>

          {/* AI Recommendation */}
          {preferences.openaiApiKey && (
            <section className="mb-6">
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-foreground">AI Recommendation</p>
                    <p className="text-xs text-muted-foreground">
                      Personalized cycle based on your history
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={getRecommendation}
                    disabled={loadingRecommendation}
                  >
                    {loadingRecommendation ? 'Analyzing...' : 'Get Recommendation'}
                  </Button>
                </div>

                {cycleRecommendation && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {PREDEFINED_CYCLES.find(c => c.id === cycleRecommendation.recommendedCycleId)?.name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {cycleRecommendation.reasoning}
                        </p>
                        {cycleRecommendation.alternativeId && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Alternative: {PREDEFINED_CYCLES.find(c => c.id === cycleRecommendation.alternativeId)?.name}
                            {cycleRecommendation.alternativeReason && ` - ${cycleRecommendation.alternativeReason}`}
                          </p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={applyRecommendedCycle}>
                            Apply This Cycle
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCycleRecommendation(null)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </section>
          )}

          {/* Cycle Selection */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Choose Cycle
            </h2>
            <div className="space-y-3">
              {relevantCycles.map((cycle) => {
                const isSelected = cycle.id === cycleConfig?.id;
                const isDefault = cycle.id === defaultCycleId;
                const phaseNames = cycle.phases.map(p => p.name).join(' \u2192 ');
                return (
                  <Button
                    key={cycle.id}
                    variant="ghost"
                    onClick={() => handleCycleClick(cycle)}
                    className={`w-full h-auto p-4 rounded-xl border text-left justify-start transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-foreground">
                          {cycle.name}
                          {isDefault && <span className="text-xs text-muted-foreground font-normal ml-2">(Default)</span>}
                        </span>
                        {isSelected && (
                          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-normal whitespace-normal">
                        {cycle.description}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground font-normal">
                        <span>{cycle.totalWeeks} weeks</span>
                        <span className="text-primary">{cycle.cycleType === 'cardio' ? 'Cardio' : 'Strength'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-normal whitespace-normal">
                        {phaseNames}
                      </p>
                    </div>
                  </Button>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* ============================================ */}
      {/* PREFERENCES TAB */}
      {/* ============================================ */}
      {activeTab === 'preferences' && (
        <>
          {/* Units & Workout Settings */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Units & Workout
            </h2>
            <Card className="space-y-4">
              {/* Weight Unit */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-foreground">Weight Unit</Label>
                  <p className="text-sm text-muted-foreground">Choose your preferred unit</p>
                </div>
                <Select
                  value={preferences.weightUnit}
                  onValueChange={(value) => updatePreferences({ weightUnit: value as 'lbs' | 'kg' })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Distance Unit */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-foreground">Distance Unit</Label>
                  <p className="text-sm text-muted-foreground">For cardio tracking</p>
                </div>
                <Select
                  value={preferences.distanceUnit}
                  onValueChange={(value) => updatePreferences({ distanceUnit: value as 'mi' | 'km' })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mi">Miles (mi)</SelectItem>
                    <SelectItem value="km">Kilometers (km)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Weekly Workout Goal */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-foreground">Weekly Workout Goal</Label>
                  <p className="text-sm text-muted-foreground">Your consistency streak is based on this</p>
                </div>
                <Select
                  value={String(preferences.weeklyWorkoutGoal ?? 4)}
                  onValueChange={(value) => updatePreferences({ weeklyWorkoutGoal: parseInt(value) })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 days/week</SelectItem>
                    <SelectItem value="3">3 days/week</SelectItem>
                    <SelectItem value="4">4 days/week</SelectItem>
                    <SelectItem value="5">5 days/week</SelectItem>
                    <SelectItem value="6">6 days/week</SelectItem>
                    <SelectItem value="7">7 days/week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Default Rest Time */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-foreground">Default Rest Time</Label>
                  <p className="text-sm text-muted-foreground">Rest timer duration</p>
                </div>
                <Select
                  value={String(preferences.defaultRestSeconds)}
                  onValueChange={(value) => updatePreferences({ defaultRestSeconds: parseInt(value) })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 sec</SelectItem>
                    <SelectItem value="60">60 sec</SelectItem>
                    <SelectItem value="90">90 sec</SelectItem>
                    <SelectItem value="120">2 min</SelectItem>
                    <SelectItem value="180">3 min</SelectItem>
                    <SelectItem value="300">5 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </section>

          {/* Appearance */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Appearance
            </h2>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-foreground">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Toggle dark theme</p>
                </div>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => updatePreferences({ darkMode: checked })}
                />
              </div>
            </Card>
          </section>

          {/* Notifications */}
          {isAuthenticated && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">
                Notifications
              </h2>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-foreground">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Likes, comments & friend requests</p>
                  </div>
                  <Switch
                    checked={preferences.emailNotificationsEnabled ?? true}
                    onCheckedChange={(checked) => updatePreferences({ emailNotificationsEnabled: checked })}
                  />
                </div>
              </Card>
            </section>
          )}

          {/* AI Assistant */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              AI Assistant
            </h2>
            <Card>
              <Label className="font-medium text-foreground mb-1 block">OpenAI API Key</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Required for AI-powered recommendations.
                Get your key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  OpenAI
                </a>
              </p>
              {preferences.openaiApiKey ? (
                <p className="text-sm text-green-600 dark:text-green-400 mb-3 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  API key configured
                </p>
              ) : (
                <p className="text-sm text-orange-500 dark:text-orange-400 mb-3">
                  No API key configured - AI features disabled
                </p>
              )}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="sk-..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8"
                  >
                    {showApiKey ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </Button>
                </div>
                <Button onClick={saveApiKey}>
                  {apiKeySaved ? 'Saved!' : 'Save'}
                </Button>
              </div>
            </Card>
          </section>
        </>
      )}

      {/* ============================================ */}
      {/* ACCOUNT TAB */}
      {/* ============================================ */}
      {activeTab === 'account' && (
        <>
          {/* Account */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Account
            </h2>
            <Card className="space-y-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{user?.email}</p>
                      <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Synced to cloud
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                    >
                      {isSigningOut ? 'Signing out...' : 'Sign Out'}
                    </Button>
                  </div>

                  {/* Nickname/Username */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-foreground">Nickname</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end">
                          <Input
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                            placeholder="Enter nickname"
                            className="w-40"
                          />
                          {usernameError && (
                            <p className="text-xs text-destructive mt-1">{usernameError}</p>
                          )}
                        </div>
                        <Button
                          onClick={handleSaveUsername}
                          disabled={usernameSaving || usernameInput === username}
                        >
                          {usernameSaving ? 'Saving...' : usernameSaved ? 'Saved!' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Not signed in</p>
                    <p className="text-sm text-muted-foreground">
                      Sign in to sync your data across devices
                    </p>
                  </div>
                  <Button onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                </div>
              )}
            </Card>
          </section>

          {/* Data Management */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Data Management
            </h2>
            <Card className="space-y-4">
              {/* Export */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-foreground">Export Data</Label>
                  <p className="text-sm text-muted-foreground">Download all your workout data</p>
                </div>
                <Button variant="secondary" onClick={handleExport}>
                  Export
                </Button>
              </div>

              {/* Import */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-foreground">Import Data</Label>
                  <p className="text-sm text-muted-foreground">
                    {importSuccess ? (
                      <span className="text-green-500">Import successful! Reloading...</span>
                    ) : importError ? (
                      <span className="text-destructive">{importError}</span>
                    ) : (
                      'Restore from a backup file'
                    )}
                  </p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <Button variant="secondary" asChild>
                    <span>Import</span>
                  </Button>
                </label>
              </div>

              {/* Clear Data */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <Label className="font-medium text-destructive">Clear All Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete all workout data
                  </p>
                </div>
                <Button variant="danger" onClick={handleClearData}>
                  Clear
                </Button>
              </div>
            </Card>
          </section>

          {/* About */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              About
            </h2>
            <Card>
              <p className="text-muted-foreground text-sm">
                overload.ai v1.0.0
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                A simple, privacy-focused workout tracking app with AI-powered progressive overload recommendations.
                {isAuthenticated
                  ? ' Your data is securely synced to the cloud and available on all your devices.'
                  : ' All data is stored locally on your device.'}
              </p>
              <p className="text-muted-foreground text-sm mt-4">
                Created by{' '}
                <a
                  href="https://github.com/DustinBergman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Dustin Bergman
                </a>
              </p>
            </Card>
          </section>
        </>
      )}

      {/* Goal Change Confirmation Modal */}
      <Modal
        isOpen={showGoalConfirm}
        onClose={cancelGoalChange}
        title="Change Training Goal"
        footer={
          <>
            <Button variant="secondary" onClick={cancelGoalChange}>
              Cancel
            </Button>
            <Button onClick={confirmGoalChange}>
              Continue
            </Button>
          </>
        }
      >
        <p className="text-foreground">
          Are you sure you want to change your training goal?
        </p>
        <p className="text-muted-foreground mt-2">
          You will start at Phase 1 of the matching default training cycle.
        </p>
        {pendingGoal && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">New goal:</p>
            <p className="font-semibold text-foreground">{WORKOUT_GOALS[pendingGoal].name}</p>
            <p className="text-sm text-primary">{WORKOUT_GOALS[pendingGoal].cycleName} cycle</p>
          </div>
        )}
      </Modal>

      {/* Cycle Change Confirmation Modal */}
      <Modal
        isOpen={showCycleConfirm}
        onClose={cancelCycleChange}
        title="Change Training Cycle"
        footer={
          <>
            <Button variant="secondary" onClick={cancelCycleChange}>
              Cancel
            </Button>
            <Button onClick={confirmCycleChange}>
              Continue
            </Button>
          </>
        }
      >
        <p className="text-foreground">
          Are you sure you want to change your training cycle?
        </p>
        <p className="text-muted-foreground mt-2">
          You will start at Week 1, Phase 1 of the new cycle.
        </p>
        {pendingCycle && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">New cycle:</p>
            <p className="font-semibold text-foreground">{pendingCycle.name}</p>
            <p className="text-sm text-primary">{pendingCycle.totalWeeks} weeks total</p>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingCycle.phases.map(p => p.name).join(' \u2192 ')}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
