import { FC, useState } from 'react';
import { Button, Card } from '../ui';
import {
  hasLocalStorageData,
  getMigrationSummary,
  migrateLocalStorageToSupabase,
  markMigrationComplete,
  MigrationResult,
} from '../../services/supabase/migration';

interface MigrationPromptProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const MigrationPrompt: FC<MigrationPromptProps> = ({ onComplete, onSkip }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const summary = getMigrationSummary();
  const hasData = hasLocalStorageData();

  if (!hasData) {
    // No data to migrate, skip automatically
    onSkip();
    return null;
  }

  const handleMigrate = async () => {
    setIsLoading(true);
    setError(null);

    const migrationResult = await migrateLocalStorageToSupabase();

    if (migrationResult.success) {
      markMigrationComplete();
      setResult(migrationResult);
    } else {
      setError(migrationResult.error || 'Migration failed');
    }

    setIsLoading(false);
  };

  if (result?.success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="max-w-md w-full p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground">Migration Complete!</h2>
            <p className="text-muted-foreground">
              Your data has been synced to the cloud.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {result.migratedCounts.templates > 0 && (
                <li>{result.migratedCounts.templates} workout plans</li>
              )}
              {result.migratedCounts.sessions > 0 && (
                <li>{result.migratedCounts.sessions} workout sessions</li>
              )}
              {result.migratedCounts.customExercises > 0 && (
                <li>{result.migratedCounts.customExercises} custom exercises</li>
              )}
              {result.migratedCounts.weightEntries > 0 && (
                <li>{result.migratedCounts.weightEntries} weight entries</li>
              )}
            </ul>
            <Button onClick={onComplete} className="w-full">
              Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full p-6">
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground">Import Your Data</h2>
            <p className="text-muted-foreground mt-2">
              We found existing workout data on this device. Would you like to sync it to your account?
            </p>
          </div>

          {summary && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-2">Found:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {summary.templates > 0 && <li>• {summary.templates} workout plans</li>}
                {summary.sessions > 0 && <li>• {summary.sessions} workout sessions</li>}
                {summary.customExercises > 0 && <li>• {summary.customExercises} custom exercises</li>}
                {summary.weightEntries > 0 && <li>• {summary.weightEntries} weight entries</li>}
              </ul>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onSkip}
              disabled={isLoading}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleMigrate}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Importing...' : 'Import Data'}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Your local data will be preserved for offline use
          </p>
        </div>
      </Card>
    </div>
  );
};
