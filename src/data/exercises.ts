import { Exercise } from '../types';

export const exercises: Exercise[] = [
  // CHEST
  {
    id: 'bench-press',
    name: 'Barbell Bench Press',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'barbell',
    instructions: 'Lie on a flat bench, grip the bar slightly wider than shoulder-width, lower to chest, press up.',
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Barbell Bench Press',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    equipment: 'barbell',
    instructions: 'Set bench to 30-45 degrees, grip bar wider than shoulders, lower to upper chest, press up.',
  },
  {
    id: 'decline-bench-press',
    name: 'Decline Barbell Bench Press',
    muscleGroups: ['chest', 'triceps'],
    equipment: 'barbell',
    instructions: 'Lie on a decline bench, grip the bar slightly wider than shoulder-width, lower to lower chest, press up.',
  },
  {
    id: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'dumbbell',
    instructions: 'Lie on flat bench with dumbbells at chest level, press up and together, lower with control.',
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    equipment: 'dumbbell',
    instructions: 'Set bench to 30-45 degrees, press dumbbells up from shoulder level.',
  },
  {
    id: 'dumbbell-fly',
    name: 'Dumbbell Fly',
    muscleGroups: ['chest'],
    equipment: 'dumbbell',
    instructions: 'Lie on flat bench, extend arms above chest with slight bend, lower in arc motion, squeeze together.',
  },
  {
    id: 'cable-crossover',
    name: 'Cable Crossover',
    muscleGroups: ['chest'],
    equipment: 'cable',
    instructions: 'Stand between cable towers, pull handles down and together in an arc, squeeze chest at bottom.',
  },
  {
    id: 'chest-dip',
    name: 'Chest Dip',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'bodyweight',
    instructions: 'Lean forward on dip bars, lower body by bending elbows, push back up.',
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'bodyweight',
    instructions: 'Hands shoulder-width apart, lower chest to ground, push back up keeping body straight.',
  },
  {
    id: 'machine-chest-press',
    name: 'Machine Chest Press',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'machine',
    instructions: 'Sit with back against pad, grip handles at chest level, push forward, return with control.',
  },

  // BACK
  {
    id: 'deadlift',
    name: 'Conventional Deadlift',
    muscleGroups: ['back', 'hamstrings', 'glutes', 'traps'],
    equipment: 'barbell',
    instructions: 'Stand with feet hip-width, grip bar outside legs, drive through heels, extend hips and knees.',
  },
  {
    id: 'sumo-deadlift',
    name: 'Sumo Deadlift',
    muscleGroups: ['back', 'glutes', 'hamstrings', 'quadriceps'],
    equipment: 'barbell',
    instructions: 'Wide stance with toes pointed out, grip bar inside legs, drive through heels.',
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    muscleGroups: ['hamstrings', 'glutes', 'back'],
    equipment: 'barbell',
    instructions: 'Hold bar at hip level, hinge at hips with slight knee bend, lower bar along legs.',
  },
  {
    id: 'barbell-row',
    name: 'Barbell Bent Over Row',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: 'barbell',
    instructions: 'Hinge forward, grip bar wider than shoulders, pull to lower chest, squeeze back.',
  },
  {
    id: 'pendlay-row',
    name: 'Pendlay Row',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: 'barbell',
    instructions: 'Torso parallel to ground, explosively row bar from floor to lower chest, return to floor.',
  },
  {
    id: 'dumbbell-row',
    name: 'Dumbbell Row',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: 'dumbbell',
    instructions: 'One hand on bench, pull dumbbell to hip, squeeze back at top.',
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    muscleGroups: ['lats', 'biceps', 'back'],
    equipment: 'cable',
    instructions: 'Grip bar wider than shoulders, pull down to upper chest, control the return.',
  },
  {
    id: 'pull-up',
    name: 'Pull-Up',
    muscleGroups: ['lats', 'biceps', 'back'],
    equipment: 'bodyweight',
    instructions: 'Grip bar wider than shoulders, pull chin over bar, lower with control.',
  },
  {
    id: 'chin-up',
    name: 'Chin-Up',
    muscleGroups: ['lats', 'biceps', 'back'],
    equipment: 'bodyweight',
    instructions: 'Underhand grip shoulder-width apart, pull chin over bar, lower with control.',
  },
  {
    id: 'cable-row',
    name: 'Seated Cable Row',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: 'cable',
    instructions: 'Sit with feet on platform, pull handle to lower chest, squeeze shoulder blades.',
  },
  {
    id: 't-bar-row',
    name: 'T-Bar Row',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: 'barbell',
    instructions: 'Straddle the bar, grip handles, pull to chest while maintaining flat back.',
  },
  {
    id: 'machine-row',
    name: 'Machine Row',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: 'machine',
    instructions: 'Chest against pad, pull handles to torso, squeeze shoulder blades together.',
  },

  // SHOULDERS
  {
    id: 'overhead-press',
    name: 'Barbell Overhead Press',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: 'barbell',
    instructions: 'Grip bar at shoulder width, press overhead, lower to chin level.',
  },
  {
    id: 'seated-dumbbell-press',
    name: 'Seated Dumbbell Press',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: 'dumbbell',
    instructions: 'Sit with back support, press dumbbells from shoulder level overhead.',
  },
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: 'dumbbell',
    instructions: 'Start with palms facing you, rotate and press overhead, reverse on the way down.',
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    muscleGroups: ['shoulders'],
    equipment: 'dumbbell',
    instructions: 'Stand with dumbbells at sides, raise arms to shoulder height with slight elbow bend.',
  },
  {
    id: 'front-raise',
    name: 'Front Raise',
    muscleGroups: ['shoulders'],
    equipment: 'dumbbell',
    instructions: 'Hold dumbbells in front of thighs, raise to shoulder height, lower with control.',
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear Delt Fly',
    muscleGroups: ['shoulders', 'back'],
    equipment: 'dumbbell',
    instructions: 'Bend forward at hips, raise dumbbells out to sides, squeeze rear delts.',
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    muscleGroups: ['shoulders', 'back', 'traps'],
    equipment: 'cable',
    instructions: 'Pull rope attachment to face, externally rotate at the end, squeeze rear delts.',
  },
  {
    id: 'upright-row',
    name: 'Upright Row',
    muscleGroups: ['shoulders', 'traps'],
    equipment: 'barbell',
    instructions: 'Grip bar narrow, pull to chin leading with elbows, lower with control.',
  },
  {
    id: 'shrug',
    name: 'Barbell Shrug',
    muscleGroups: ['traps'],
    equipment: 'barbell',
    instructions: 'Hold bar at thighs, shrug shoulders straight up toward ears, hold briefly.',
  },
  {
    id: 'dumbbell-shrug',
    name: 'Dumbbell Shrug',
    muscleGroups: ['traps'],
    equipment: 'dumbbell',
    instructions: 'Hold dumbbells at sides, shrug shoulders up toward ears, hold briefly.',
  },

  // LEGS - QUADRICEPS
  {
    id: 'squat',
    name: 'Barbell Back Squat',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: 'barbell',
    instructions: 'Bar on upper back, feet shoulder-width, descend until thighs parallel, drive up.',
  },
  {
    id: 'front-squat',
    name: 'Front Squat',
    muscleGroups: ['quadriceps', 'glutes', 'core'],
    equipment: 'barbell',
    instructions: 'Bar on front shoulders, elbows high, descend keeping torso upright.',
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: 'machine',
    instructions: 'Feet shoulder-width on platform, lower until knees at 90 degrees, press up.',
  },
  {
    id: 'hack-squat',
    name: 'Hack Squat',
    muscleGroups: ['quadriceps', 'glutes'],
    equipment: 'machine',
    instructions: 'Shoulders under pads, feet forward on platform, descend and drive up.',
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    muscleGroups: ['quadriceps'],
    equipment: 'machine',
    instructions: 'Sit with pad on lower shins, extend legs fully, squeeze quads at top.',
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    muscleGroups: ['quadriceps', 'glutes'],
    equipment: 'dumbbell',
    instructions: 'Hold dumbbell at chest, squat down keeping torso upright, drive up.',
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: 'dumbbell',
    instructions: 'Rear foot elevated, lower until front thigh parallel, drive up through front heel.',
  },
  {
    id: 'lunge',
    name: 'Walking Lunge',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: 'dumbbell',
    instructions: 'Step forward, lower until both knees at 90 degrees, step through to next rep.',
  },

  // LEGS - HAMSTRINGS & GLUTES
  {
    id: 'leg-curl',
    name: 'Lying Leg Curl',
    muscleGroups: ['hamstrings'],
    equipment: 'machine',
    instructions: 'Lie face down, pad behind ankles, curl weight toward glutes.',
  },
  {
    id: 'seated-leg-curl',
    name: 'Seated Leg Curl',
    muscleGroups: ['hamstrings'],
    equipment: 'machine',
    instructions: 'Sit with pad on back of lower legs, curl weight down and back.',
  },
  {
    id: 'stiff-leg-deadlift',
    name: 'Stiff Leg Deadlift',
    muscleGroups: ['hamstrings', 'glutes', 'back'],
    equipment: 'barbell',
    instructions: 'Keep legs nearly straight, hinge at hips, lower bar along legs.',
  },
  {
    id: 'hip-thrust',
    name: 'Barbell Hip Thrust',
    muscleGroups: ['glutes', 'hamstrings'],
    equipment: 'barbell',
    instructions: 'Upper back on bench, bar on hips, drive hips up squeezing glutes at top.',
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    muscleGroups: ['glutes', 'hamstrings'],
    equipment: 'bodyweight',
    instructions: 'Lie on back, feet flat, drive hips up squeezing glutes, lower with control.',
  },
  {
    id: 'cable-pull-through',
    name: 'Cable Pull Through',
    muscleGroups: ['glutes', 'hamstrings'],
    equipment: 'cable',
    instructions: 'Face away from cable, hinge at hips, squeeze glutes to stand.',
  },

  // LEGS - CALVES
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    muscleGroups: ['calves'],
    equipment: 'machine',
    instructions: 'Shoulders under pads, rise onto toes, hold at top, lower with stretch.',
  },
  {
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise',
    muscleGroups: ['calves'],
    equipment: 'machine',
    instructions: 'Sit with pad on knees, rise onto toes, hold at top, lower with stretch.',
  },

  // BICEPS
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    muscleGroups: ['biceps'],
    equipment: 'barbell',
    instructions: 'Grip bar shoulder-width, curl to shoulders keeping elbows stationary.',
  },
  {
    id: 'ez-bar-curl',
    name: 'EZ Bar Curl',
    muscleGroups: ['biceps'],
    equipment: 'ez-bar',
    instructions: 'Grip EZ bar on angled portions, curl to shoulders keeping elbows stationary.',
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Curl',
    muscleGroups: ['biceps'],
    equipment: 'dumbbell',
    instructions: 'Curl dumbbells to shoulders, can alternate or do simultaneously.',
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    muscleGroups: ['biceps', 'forearms'],
    equipment: 'dumbbell',
    instructions: 'Neutral grip (palms facing in), curl to shoulders.',
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    muscleGroups: ['biceps'],
    equipment: 'ez-bar',
    instructions: 'Arms on preacher bench, curl weight up, lower with control.',
  },
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Curl',
    muscleGroups: ['biceps'],
    equipment: 'dumbbell',
    instructions: 'Sit on incline bench, let arms hang, curl dumbbells up.',
  },
  {
    id: 'cable-curl',
    name: 'Cable Curl',
    muscleGroups: ['biceps'],
    equipment: 'cable',
    instructions: 'Face cable machine, curl handle up keeping elbows stationary.',
  },
  {
    id: 'concentration-curl',
    name: 'Concentration Curl',
    muscleGroups: ['biceps'],
    equipment: 'dumbbell',
    instructions: 'Sit, elbow against inner thigh, curl dumbbell focusing on contraction.',
  },

  // TRICEPS
  {
    id: 'close-grip-bench',
    name: 'Close Grip Bench Press',
    muscleGroups: ['triceps', 'chest'],
    equipment: 'barbell',
    instructions: 'Hands shoulder-width or closer, lower to chest, press up.',
  },
  {
    id: 'skull-crusher',
    name: 'Skull Crusher',
    muscleGroups: ['triceps'],
    equipment: 'ez-bar',
    instructions: 'Lie on bench, lower bar to forehead by bending elbows, extend back up.',
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    muscleGroups: ['triceps'],
    equipment: 'cable',
    instructions: 'Face cable machine, push handle down by extending elbows, squeeze at bottom.',
  },
  {
    id: 'rope-pushdown',
    name: 'Rope Pushdown',
    muscleGroups: ['triceps'],
    equipment: 'cable',
    instructions: 'Use rope attachment, push down and spread rope at bottom.',
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Overhead Tricep Extension',
    muscleGroups: ['triceps'],
    equipment: 'dumbbell',
    instructions: 'Hold dumbbell overhead with both hands, lower behind head, extend up.',
  },
  {
    id: 'tricep-dip',
    name: 'Tricep Dip',
    muscleGroups: ['triceps', 'chest', 'shoulders'],
    equipment: 'bodyweight',
    instructions: 'Keep body upright on dip bars, lower by bending elbows, push back up.',
  },
  {
    id: 'tricep-kickback',
    name: 'Tricep Kickback',
    muscleGroups: ['triceps'],
    equipment: 'dumbbell',
    instructions: 'Bend forward, upper arm parallel to ground, extend forearm back.',
  },

  // CORE
  {
    id: 'plank',
    name: 'Plank',
    muscleGroups: ['core'],
    equipment: 'bodyweight',
    instructions: 'Forearms on ground, body straight, hold position engaging core.',
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    muscleGroups: ['core'],
    equipment: 'bodyweight',
    instructions: 'Hang from bar, raise legs to parallel or higher, lower with control.',
  },
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    muscleGroups: ['core'],
    equipment: 'cable',
    instructions: 'Kneel facing cable, pull rope down by crunching abs, return with control.',
  },
  {
    id: 'ab-wheel-rollout',
    name: 'Ab Wheel Rollout',
    muscleGroups: ['core'],
    equipment: 'other',
    instructions: 'Kneel with wheel in front, roll forward keeping core tight, roll back.',
  },
  {
    id: 'russian-twist',
    name: 'Russian Twist',
    muscleGroups: ['core'],
    equipment: 'bodyweight',
    instructions: 'Sit with torso at 45 degrees, rotate side to side touching ground.',
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    muscleGroups: ['core'],
    equipment: 'bodyweight',
    instructions: 'Lie on back, arms up, lower opposite arm and leg while keeping back flat.',
  },
  {
    id: 'mountain-climber',
    name: 'Mountain Climber',
    muscleGroups: ['core', 'shoulders'],
    equipment: 'bodyweight',
    instructions: 'In push-up position, alternate driving knees toward chest rapidly.',
  },
];

// Helper functions
export function getExerciseById(id: string, customExercises: Exercise[] = []): Exercise | undefined {
  // Check custom exercises first
  const custom = customExercises.find((e) => e.id === id);
  if (custom) return custom;
  return exercises.find((e) => e.id === id);
}

export function getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
  return exercises.filter((e) => e.muscleGroups.includes(muscleGroup as Exercise['muscleGroups'][number]));
}

export function getExercisesByEquipment(equipment: string): Exercise[] {
  return exercises.filter((e) => e.equipment === equipment);
}

export function searchExercises(query: string, customExercises: Exercise[] = []): Exercise[] {
  const lowerQuery = query.toLowerCase();
  const allExercises = [...exercises, ...customExercises];
  return allExercises.filter(
    (e) =>
      e.name.toLowerCase().includes(lowerQuery) ||
      e.muscleGroups.some((m) => m.toLowerCase().includes(lowerQuery)) ||
      e.equipment.toLowerCase().includes(lowerQuery)
  );
}

export function getAllExercises(customExercises: Exercise[] = []): Exercise[] {
  return [...exercises, ...customExercises];
}
