import { useState, FC } from 'react';
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
} from '../components/ui';
import { exportAllData, importAllData, clearAllData } from '../services/storage';

export const Settings: FC = () => {
  const preferences = useAppStore((state) => state.preferences);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(preferences.openaiApiKey || '');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

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

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Settings
      </h1>

      {/* Preferences */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Preferences
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

          {/* Default Rest Time */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium text-foreground">Default Rest Time</Label>
              <p className="text-sm text-muted-foreground">Rest timer duration (seconds)</p>
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

          {/* Dark Mode */}
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

      {/* AI Assistant */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          AI Assistant
        </h2>

        <Card>
          <div className="mb-4">
            <Label className="font-medium text-foreground mb-1 block">OpenAI API Key</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Required for AI-powered progressive overload recommendations.
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
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                </button>
              </div>
              <Button onClick={saveApiKey}>
                {apiKeySaved ? 'Saved!' : 'Save'}
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Data Management */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">
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
        <h2 className="text-lg font-semibold text-foreground mb-4">
          About
        </h2>
        <Card>
          <p className="text-muted-foreground text-sm">
            Workout Tracker v1.0.0
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            A simple, privacy-focused workout tracking app with AI-powered progressive overload recommendations.
            All data is stored locally on your device.
          </p>
        </Card>
      </section>
    </div>
  );
}
