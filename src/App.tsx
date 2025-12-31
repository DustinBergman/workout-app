import { FC } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Navigation } from './components/ui';
import {
  Home,
  ExerciseLibrary,
  WorkoutTemplates,
  ActiveWorkout,
  History,
  Assistant,
  Settings,
} from './pages';

const App: FC = () => {
  return (
    <BrowserRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 h-14">
              <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                Workout
              </Link>
              <Link
                to="/settings"
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className="pb-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/exercises" element={<ExerciseLibrary />} />
              <Route path="/templates" element={<WorkoutTemplates />} />
              <Route path="/workout" element={<ActiveWorkout />} />
              <Route path="/history" element={<History />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>

          {/* Bottom Navigation */}
          <Navigation />
        </div>
    </BrowserRouter>
  );
}

export default App;
