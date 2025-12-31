import { FC } from 'react';

export const FloatingOrbsBackground: FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Top right orb - blue to purple */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-300 dark:from-blue-400 dark:to-purple-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-1" />
      {/* Bottom left orb - purple to pink */}
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-200 to-pink-300 dark:from-purple-400 dark:to-pink-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-2" />
      {/* Center accent orb - cyan */}
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-200 to-blue-300 dark:from-cyan-400 dark:to-blue-500 rounded-full blur-3xl opacity-15 dark:opacity-10 animate-float-3" />
      {/* Top left orb - teal to emerald */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-br from-teal-200 to-emerald-300 dark:from-teal-400 dark:to-emerald-500 rounded-full blur-3xl opacity-25 dark:opacity-15 animate-float-4" />
      {/* Bottom right orb - indigo to violet */}
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-tl from-indigo-200 to-violet-300 dark:from-indigo-400 dark:to-violet-500 rounded-full blur-3xl opacity-25 dark:opacity-15 animate-float-5" />
      {/* Middle right orb - rose to orange */}
      <div className="absolute top-1/3 -right-10 w-56 h-56 bg-gradient-to-bl from-rose-200 to-orange-300 dark:from-rose-400 dark:to-orange-400 rounded-full blur-3xl opacity-20 dark:opacity-10 animate-float-6" />
    </div>
  );
};
