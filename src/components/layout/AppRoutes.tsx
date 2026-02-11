import { FC } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  Home,
  ExerciseLibrary,
  WorkoutPlans,
  AIWorkoutCreator,
  ActiveWorkout,
  History,
  You,
  Settings,
  Auth,
  Feed,
  Friends,
  WorkoutDetail,
} from '../../pages';

export const AppRoutes: FC = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/exercises" element={<ExerciseLibrary />} />
    <Route path="/plans" element={<WorkoutPlans />} />
    <Route path="/plans/create-with-ai" element={<AIWorkoutCreator />} />
    <Route path="/workout" element={<ActiveWorkout />} />
    <Route path="/history" element={<History />} />
    <Route path="/you" element={<You />} />
    <Route path="/feed" element={<Feed />} />
    <Route path="/feed/workout/:workoutId" element={<WorkoutDetail />} />
    <Route path="/friends" element={<Friends />} />
    <Route path="/settings" element={<Settings />} />
  </Routes>
);
