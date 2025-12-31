import { useState, FC } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card, Button, Input } from '../components/ui';
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Settings
      </h1>

      {/* Preferences */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Preferences
        </h2>

        <Card className="space-y-4">
          {/* Weight Unit */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Weight Unit</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred unit</p>
            </div>
            <select
              value={preferences.weightUnit}
              onChange={(e) => updatePreferences({ weightUnit: e.target.value as 'lbs' | 'kg' })}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="lbs">Pounds (lbs)</option>
              <option value="kg">Kilograms (kg)</option>
            </select>
          </div>

          {/* Default Rest Time */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Default Rest Time</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Rest timer duration (seconds)</p>
            </div>
            <select
              value={preferences.defaultRestSeconds}
              onChange={(e) => updatePreferences({ defaultRestSeconds: parseInt(e.target.value) })}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="30">30 sec</option>
              <option value="60">60 sec</option>
              <option value="90">90 sec</option>
              <option value="120">2 min</option>
              <option value="180">3 min</option>
              <option value="300">5 min</option>
            </select>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark theme</p>
            </div>
            <button
              onClick={() => updatePreferences({ darkMode: !preferences.darkMode })}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.darkMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  preferences.darkMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </Card>
      </section>

      {/* AI Assistant */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          AI Assistant
        </h2>

        <Card>
          <div className="mb-4">
            <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">OpenAI API Key</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Required for AI-powered progressive overload recommendations.
              Get your key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Data Management
        </h2>

        <Card className="space-y-4">
          {/* Export */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Export Data</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Download all your workout data</p>
            </div>
            <Button variant="secondary" onClick={handleExport}>
              Export
            </Button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Import Data</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {importSuccess ? (
                  <span className="text-green-500">Import successful! Reloading...</span>
                ) : importError ? (
                  <span className="text-red-500">{importError}</span>
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
              <span className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Import
              </span>
            </label>
          </div>

          {/* Clear Data */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">Clear All Data</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          About
        </h2>
        <Card>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Workout Tracker v1.0.0
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            A simple, privacy-focused workout tracking app with AI-powered progressive overload recommendations.
            All data is stored locally on your device.
          </p>
        </Card>
      </section>
    </div>
  );
}
