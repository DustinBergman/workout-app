import { Exercise, StrengthExercise, CardioExercise } from '../types';

// Base URL for exercise images from free-exercise-db (public domain)
const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

// Strength exercises
export const strengthExercises: StrengthExercise[] = [
  // CHEST
  {
    id: 'bench-press',
    type: 'strength',
    name: 'Barbell Bench Press',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'barbell',
    instructions: 'Lie on a flat bench, grip the bar slightly wider than shoulder-width, lower to chest, press up.',
    imageUrl: `${IMG_BASE}/Barbell_Bench_Press_-_Medium_Grip/0.jpg`,
  },
  {
    id: 'incline-bench-press',
    type: 'strength',
    name: 'Incline Barbell Bench Press',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    equipment: 'barbell',
    instructions: 'Set bench to 30-45 degrees, grip bar wider than shoulders, lower to upper chest, press up.',
    imageUrl: `${IMG_BASE}/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg`,
  },
  {
    id: 'decline-bench-press',
    type: 'strength',
    name: 'Decline Barbell Bench Press',
    muscleGroups: ['chest', 'triceps'],
    equipment: 'barbell',
    instructions: 'Lie on a decline bench, grip the bar slightly wider than shoulder-width, lower to lower chest, press up.',
    imageUrl: `${IMG_BASE}/Decline_Barbell_Bench_Press/0.jpg`,
  },
  {
    id: 'dumbbell-bench-press',
    type: 'strength',
    name: 'Dumbbell Bench Press',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'dumbbell',
    instructions: 'Lie on flat bench with dumbbells at chest level, press up and together, lower with control.',
    imageUrl: `${IMG_BASE}/Dumbbell_Bench_Press/0.jpg`,
  },
  {
    id: 'incline-dumbbell-press',
    type: 'strength',
    name: 'Incline Dumbbell Press',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    equipment: 'dumbbell',
    instructions: 'Set bench to 30-45 degrees, press dumbbells up from shoulder level.',
    imageUrl: `${IMG_BASE}/Incline_Dumbbell_Press/0.jpg`,
  },
  {
    id: 'dumbbell-fly',
    type: 'strength',
    name: 'Dumbbell Fly',
    muscleGroups: ['chest'],
    equipment: 'dumbbell',
    instructions: 'Lie on flat bench, extend arms above chest with slight bend, lower in arc motion, squeeze together.',
    imageUrl: `${IMG_BASE}/Dumbbell_Flyes/0.jpg`,
  },
  {
    id: 'cable-crossover',
    type: 'strength',
    name: 'Cable Crossover',
    muscleGroups: ['chest'],
    equipment: 'cable',
    instructions: 'Stand between cable towers, pull handles down and together in an arc, squeeze chest at bottom.',
    imageUrl: `${IMG_BASE}/Cable_Crossover/0.jpg`,
  },
  {
    id: 'chest-dip',
    type: 'strength',
    name: 'Chest Dip',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'bodyweight',
    instructions: 'Lean forward on dip bars, lower body by bending elbows, push back up.',
    imageUrl: `${IMG_BASE}/Dips_-_Chest_Version/0.jpg`,
  },
  {
    id: 'push-up',
    type: 'strength',
    name: 'Push-Up',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'bodyweight',
    instructions: 'Hands shoulder-width apart, lower chest to ground, push back up keeping body straight.',
    imageUrl: `${IMG_BASE}/Pushups/0.jpg`,
  },
  {
    id: 'machine-chest-press',
    type: 'strength',
    name: 'Machine Chest Press',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'machine',
    instructions: 'Sit with back against pad, grip handles at chest level, push forward, return with control.',
    imageUrl: `${IMG_BASE}/Machine_Bench_Press/0.jpg`,
  },

  // BACK
  {
    id: 'deadlift',
    type: 'strength',
    name: 'Conventional Deadlift',
    muscleGroups: ['back', 'hamstrings', 'glutes', 'traps'],
    equipment: 'barbell',
    instructions: 'Stand with feet hip-width, grip bar outside legs, drive through heels, extend hips and knees.',
    imageUrl: `${IMG_BASE}/Barbell_Deadlift/0.jpg`,
  },
  {
    id: 'sumo-deadlift',
    type: 'strength',
    name: 'Sumo Deadlift',
    muscleGroups: ['back', 'glutes', 'hamstrings', 'quadriceps'],
    equipment: 'barbell',
    instructions: 'Wide stance with toes pointed out, grip bar inside legs, drive through heels.',
    imageUrl: `${IMG_BASE}/Sumo_Deadlift/0.jpg`,
  },
  {
    id: 'romanian-deadlift',
    type: 'strength',
    name: 'Romanian Deadlift',
    muscleGroups: ['hamstrings', 'glutes', 'back'],
    equipment: 'barbell',
    instructions: 'Hold bar at hip level, hinge at hips with slight knee bend, lower bar along legs.',
    imageUrl: `${IMG_BASE}/Romanian_Deadlift/0.jpg`,
  },
  {
    id: 'barbell-row',
    type: 'strength',
    name: 'Barbell Bent Over Row',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: 'barbell',
    instructions: 'Hinge forward, grip bar wider than shoulders, pull to lower chest, squeeze back.',
    imageUrl: `${IMG_BASE}/Bent_Over_Barbell_Row/0.jpg`,
  },
  {
    id: 'pendlay-row',
    type: 'strength',
    name: 'Pendlay Row',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: 'barbell',
    instructions: 'Torso parallel to ground, explosively row bar from floor to lower chest, return to floor.',
    imageUrl: `${IMG_BASE}/Pendlay_Row/0.jpg`,
  },
  {
    id: 'dumbbell-row',
    type: 'strength',
    name: 'Dumbbell Row',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: 'dumbbell',
    instructions: 'One hand on bench, pull dumbbell to hip, squeeze back at top.',
    imageUrl: `${IMG_BASE}/One-Arm_Dumbbell_Row/0.jpg`,
  },
  {
    id: 'lat-pulldown',
    type: 'strength',
    name: 'Lat Pulldown',
    muscleGroups: ['lats', 'biceps', 'back'],
    equipment: 'cable',
    instructions: 'Grip bar wider than shoulders, pull down to upper chest, control the return.',
    imageUrl: `${IMG_BASE}/Wide-Grip_Lat_Pulldown/0.jpg`,
  },
  {
    id: 'pull-up',
    type: 'strength',
    name: 'Pull-Up',
    muscleGroups: ['lats', 'biceps', 'back'],
    equipment: 'bodyweight',
    instructions: 'Grip bar wider than shoulders, pull chin over bar, lower with control.',
    imageUrl: `${IMG_BASE}/Pullups/0.jpg`,
  },
  {
    id: 'chin-up',
    type: 'strength',
    name: 'Chin-Up',
    muscleGroups: ['lats', 'biceps', 'back'],
    equipment: 'bodyweight',
    instructions: 'Underhand grip shoulder-width apart, pull chin over bar, lower with control.',
    imageUrl: `${IMG_BASE}/Chin-Up/0.jpg`,
  },
  {
    id: 'cable-row',
    type: 'strength',
    name: 'Seated Cable Row',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: 'cable',
    instructions: 'Sit with feet on platform, pull handle to lower chest, squeeze shoulder blades.',
    imageUrl: `${IMG_BASE}/Seated_Cable_Rows/0.jpg`,
  },
  {
    id: 't-bar-row',
    type: 'strength',
    name: 'T-Bar Row',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: 'barbell',
    instructions: 'Straddle the bar, grip handles, pull to chest while maintaining flat back.',
    imageUrl: `${IMG_BASE}/T-Bar_Row_with_Handle/0.jpg`,
  },
  {
    id: 'machine-row',
    type: 'strength',
    name: 'Machine Row',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: 'machine',
    instructions: 'Chest against pad, pull handles to torso, squeeze shoulder blades together.',
    imageUrl: `${IMG_BASE}/Leverage_Iso_Row/0.jpg`,
  },

  // SHOULDERS
  {
    id: 'overhead-press',
    type: 'strength',
    name: 'Barbell Overhead Press',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: 'barbell',
    instructions: 'Grip bar at shoulder width, press overhead, lower to chin level.',
    imageUrl: `${IMG_BASE}/Barbell_Shoulder_Press/0.jpg`,
  },
  {
    id: 'seated-dumbbell-press',
    type: 'strength',
    name: 'Seated Dumbbell Press',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: 'dumbbell',
    instructions: 'Sit with back support, press dumbbells from shoulder level overhead.',
    imageUrl: `${IMG_BASE}/Dumbbell_Shoulder_Press/0.jpg`,
  },
  {
    id: 'arnold-press',
    type: 'strength',
    name: 'Arnold Press',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: 'dumbbell',
    instructions: 'Start with palms facing you, rotate and press overhead, reverse on the way down.',
    imageUrl: `${IMG_BASE}/Arnold_Dumbbell_Press/0.jpg`,
  },
  {
    id: 'lateral-raise',
    type: 'strength',
    name: 'Lateral Raise',
    muscleGroups: ['shoulders'],
    equipment: 'dumbbell',
    instructions: 'Stand with dumbbells at sides, raise arms to shoulder height with slight elbow bend.',
    imageUrl: `${IMG_BASE}/Side_Lateral_Raise/0.jpg`,
  },
  {
    id: 'front-raise',
    type: 'strength',
    name: 'Front Raise',
    muscleGroups: ['shoulders'],
    equipment: 'dumbbell',
    instructions: 'Hold dumbbells in front of thighs, raise to shoulder height, lower with control.',
    imageUrl: `${IMG_BASE}/Front_Dumbbell_Raise/0.jpg`,
  },
  {
    id: 'rear-delt-fly',
    type: 'strength',
    name: 'Rear Delt Fly',
    muscleGroups: ['shoulders', 'back'],
    equipment: 'dumbbell',
    instructions: 'Bend forward at hips, raise dumbbells out to sides, squeeze rear delts.',
    imageUrl: `${IMG_BASE}/Seated_Bent-Over_Rear_Delt_Raise/0.jpg`,
  },
  {
    id: 'face-pull',
    type: 'strength',
    name: 'Face Pull',
    muscleGroups: ['shoulders', 'back', 'traps'],
    equipment: 'cable',
    instructions: 'Pull rope attachment to face, externally rotate at the end, squeeze rear delts.',
    imageUrl: `${IMG_BASE}/Face_Pull/0.jpg`,
  },
  {
    id: 'upright-row',
    type: 'strength',
    name: 'Upright Row',
    muscleGroups: ['shoulders', 'traps'],
    equipment: 'barbell',
    instructions: 'Grip bar narrow, pull to chin leading with elbows, lower with control.',
    imageUrl: `${IMG_BASE}/Upright_Barbell_Row/0.jpg`,
  },
  {
    id: 'shrug',
    type: 'strength',
    name: 'Barbell Shrug',
    muscleGroups: ['traps'],
    equipment: 'barbell',
    instructions: 'Hold bar at thighs, shrug shoulders straight up toward ears, hold briefly.',
    imageUrl: `${IMG_BASE}/Barbell_Shrug/0.jpg`,
  },
  {
    id: 'dumbbell-shrug',
    type: 'strength',
    name: 'Dumbbell Shrug',
    muscleGroups: ['traps'],
    equipment: 'dumbbell',
    instructions: 'Hold dumbbells at sides, shrug shoulders up toward ears, hold briefly.',
    imageUrl: `${IMG_BASE}/Dumbbell_Shrug/0.jpg`,
  },

  // LEGS - QUADRICEPS
  {
    id: 'squat',
    type: 'strength',
    name: 'Barbell Back Squat',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: 'barbell',
    instructions: 'Bar on upper back, feet shoulder-width, descend until thighs parallel, drive up.',
    imageUrl: `${IMG_BASE}/Barbell_Full_Squat/0.jpg`,
  },
  {
    id: 'front-squat',
    type: 'strength',
    name: 'Front Squat',
    muscleGroups: ['quadriceps', 'glutes', 'core'],
    equipment: 'barbell',
    instructions: 'Bar on front shoulders, elbows high, descend keeping torso upright.',
    imageUrl: `${IMG_BASE}/Front_Barbell_Squat/0.jpg`,
  },
  {
    id: 'leg-press',
    type: 'strength',
    name: 'Leg Press',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: 'machine',
    instructions: 'Feet shoulder-width on platform, lower until knees at 90 degrees, press up.',
    imageUrl: `${IMG_BASE}/Leg_Press/0.jpg`,
  },
  {
    id: 'hack-squat',
    type: 'strength',
    name: 'Hack Squat',
    muscleGroups: ['quadriceps', 'glutes'],
    equipment: 'machine',
    instructions: 'Shoulders under pads, feet forward on platform, descend and drive up.',
    imageUrl: `${IMG_BASE}/Barbell_Hack_Squat/0.jpg`,
  },
  {
    id: 'leg-extension',
    type: 'strength',
    name: 'Leg Extension',
    muscleGroups: ['quadriceps'],
    equipment: 'machine',
    instructions: 'Sit with pad on lower shins, extend legs fully, squeeze quads at top.',
    imageUrl: `${IMG_BASE}/Leg_Extensions/0.jpg`,
  },
  {
    id: 'goblet-squat',
    type: 'strength',
    name: 'Goblet Squat',
    muscleGroups: ['quadriceps', 'glutes'],
    equipment: 'dumbbell',
    instructions: 'Hold dumbbell at chest, squat down keeping torso upright, drive up.',
    imageUrl: `${IMG_BASE}/Goblet_Squat/0.jpg`,
  },
  {
    id: 'bulgarian-split-squat',
    type: 'strength',
    name: 'Bulgarian Split Squat',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: 'dumbbell',
    instructions: 'Rear foot elevated, lower until front thigh parallel, drive up through front heel.',
    imageUrl: `${IMG_BASE}/Single_Leg_Squat/0.jpg`,
  },
  {
    id: 'lunge',
    type: 'strength',
    name: 'Walking Lunge',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: 'dumbbell',
    instructions: 'Step forward, lower until both knees at 90 degrees, step through to next rep.',
    imageUrl: `${IMG_BASE}/Dumbbell_Lunges/0.jpg`,
  },

  // LEGS - HAMSTRINGS & GLUTES
  {
    id: 'leg-curl',
    type: 'strength',
    name: 'Lying Leg Curl',
    muscleGroups: ['hamstrings'],
    equipment: 'machine',
    instructions: 'Lie face down, pad behind ankles, curl weight toward glutes.',
    imageUrl: `${IMG_BASE}/Lying_Leg_Curls/0.jpg`,
  },
  {
    id: 'seated-leg-curl',
    type: 'strength',
    name: 'Seated Leg Curl',
    muscleGroups: ['hamstrings'],
    equipment: 'machine',
    instructions: 'Sit with pad on back of lower legs, curl weight down and back.',
    imageUrl: `${IMG_BASE}/Seated_Leg_Curl/0.jpg`,
  },
  {
    id: 'stiff-leg-deadlift',
    type: 'strength',
    name: 'Stiff Leg Deadlift',
    muscleGroups: ['hamstrings', 'glutes', 'back'],
    equipment: 'barbell',
    instructions: 'Keep legs nearly straight, hinge at hips, lower bar along legs.',
    imageUrl: `${IMG_BASE}/Stiff-Legged_Barbell_Deadlift/0.jpg`,
  },
  {
    id: 'hip-thrust',
    type: 'strength',
    name: 'Barbell Hip Thrust',
    muscleGroups: ['glutes', 'hamstrings'],
    equipment: 'barbell',
    instructions: 'Upper back on bench, bar on hips, drive hips up squeezing glutes at top.',
    imageUrl: `${IMG_BASE}/Barbell_Hip_Thrust/0.jpg`,
  },
  {
    id: 'glute-bridge',
    type: 'strength',
    name: 'Glute Bridge',
    muscleGroups: ['glutes', 'hamstrings'],
    equipment: 'bodyweight',
    instructions: 'Lie on back, feet flat, drive hips up squeezing glutes, lower with control.',
    imageUrl: `${IMG_BASE}/Glute_Bridge/0.jpg`,
  },
  {
    id: 'cable-pull-through',
    type: 'strength',
    name: 'Cable Pull Through',
    muscleGroups: ['glutes', 'hamstrings'],
    equipment: 'cable',
    instructions: 'Face away from cable, hinge at hips, squeeze glutes to stand.',
    imageUrl: `${IMG_BASE}/Pull_Through/0.jpg`,
  },

  // LEGS - CALVES
  {
    id: 'standing-calf-raise',
    type: 'strength',
    name: 'Standing Calf Raise',
    muscleGroups: ['calves'],
    equipment: 'machine',
    instructions: 'Shoulders under pads, rise onto toes, hold at top, lower with stretch.',
    imageUrl: `${IMG_BASE}/Standing_Calf_Raises/0.jpg`,
  },
  {
    id: 'seated-calf-raise',
    type: 'strength',
    name: 'Seated Calf Raise',
    muscleGroups: ['calves'],
    equipment: 'machine',
    instructions: 'Sit with pad on knees, rise onto toes, hold at top, lower with stretch.',
    imageUrl: `${IMG_BASE}/Seated_Calf_Raise/0.jpg`,
  },

  // BICEPS
  {
    id: 'barbell-curl',
    type: 'strength',
    name: 'Barbell Curl',
    muscleGroups: ['biceps'],
    equipment: 'barbell',
    instructions: 'Grip bar shoulder-width, curl to shoulders keeping elbows stationary.',
    imageUrl: `${IMG_BASE}/Barbell_Curl/0.jpg`,
  },
  {
    id: 'ez-bar-curl',
    type: 'strength',
    name: 'EZ Bar Curl',
    muscleGroups: ['biceps'],
    equipment: 'ez-bar',
    instructions: 'Grip EZ bar on angled portions, curl to shoulders keeping elbows stationary.',
    imageUrl: `${IMG_BASE}/EZ-Bar_Curl/0.jpg`,
  },
  {
    id: 'dumbbell-curl',
    type: 'strength',
    name: 'Dumbbell Curl',
    muscleGroups: ['biceps'],
    equipment: 'dumbbell',
    instructions: 'Curl dumbbells to shoulders, can alternate or do simultaneously.',
    imageUrl: `${IMG_BASE}/Dumbbell_Bicep_Curl/0.jpg`,
  },
  {
    id: 'hammer-curl',
    type: 'strength',
    name: 'Hammer Curl',
    muscleGroups: ['biceps', 'forearms'],
    equipment: 'dumbbell',
    instructions: 'Neutral grip (palms facing in), curl to shoulders.',
    imageUrl: `${IMG_BASE}/Hammer_Curls/0.jpg`,
  },
  {
    id: 'preacher-curl',
    type: 'strength',
    name: 'Preacher Curl',
    muscleGroups: ['biceps'],
    equipment: 'ez-bar',
    instructions: 'Arms on preacher bench, curl weight up, lower with control.',
    imageUrl: `${IMG_BASE}/Preacher_Curl/0.jpg`,
  },
  {
    id: 'incline-dumbbell-curl',
    type: 'strength',
    name: 'Incline Dumbbell Curl',
    muscleGroups: ['biceps'],
    equipment: 'dumbbell',
    instructions: 'Sit on incline bench, let arms hang, curl dumbbells up.',
    imageUrl: `${IMG_BASE}/Incline_Dumbbell_Curl/0.jpg`,
  },
  {
    id: 'cable-curl',
    type: 'strength',
    name: 'Cable Curl',
    muscleGroups: ['biceps'],
    equipment: 'cable',
    instructions: 'Face cable machine, curl handle up keeping elbows stationary.',
    imageUrl: `${IMG_BASE}/Cable_Curl/0.jpg`,
  },
  {
    id: 'concentration-curl',
    type: 'strength',
    name: 'Concentration Curl',
    muscleGroups: ['biceps'],
    equipment: 'dumbbell',
    instructions: 'Sit, elbow against inner thigh, curl dumbbell focusing on contraction.',
    imageUrl: `${IMG_BASE}/Concentration_Curls/0.jpg`,
  },

  // TRICEPS
  {
    id: 'close-grip-bench',
    type: 'strength',
    name: 'Close Grip Bench Press',
    muscleGroups: ['triceps', 'chest'],
    equipment: 'barbell',
    instructions: 'Hands shoulder-width or closer, lower to chest, press up.',
    imageUrl: `${IMG_BASE}/Close-Grip_Barbell_Bench_Press/0.jpg`,
  },
  {
    id: 'skull-crusher',
    type: 'strength',
    name: 'Skull Crusher',
    muscleGroups: ['triceps'],
    equipment: 'ez-bar',
    instructions: 'Lie on bench, lower bar to forehead by bending elbows, extend back up.',
    imageUrl: `${IMG_BASE}/EZ-Bar_Skullcrusher/0.jpg`,
  },
  {
    id: 'tricep-pushdown',
    type: 'strength',
    name: 'Tricep Pushdown',
    muscleGroups: ['triceps'],
    equipment: 'cable',
    instructions: 'Face cable machine, push handle down by extending elbows, squeeze at bottom.',
    imageUrl: `${IMG_BASE}/Triceps_Pushdown/0.jpg`,
  },
  {
    id: 'rope-pushdown',
    type: 'strength',
    name: 'Rope Pushdown',
    muscleGroups: ['triceps'],
    equipment: 'cable',
    instructions: 'Use rope attachment, push down and spread rope at bottom.',
    imageUrl: `${IMG_BASE}/Triceps_Pushdown_-_Rope_Attachment/0.jpg`,
  },
  {
    id: 'overhead-tricep-extension',
    type: 'strength',
    name: 'Overhead Tricep Extension',
    muscleGroups: ['triceps'],
    equipment: 'dumbbell',
    instructions: 'Hold dumbbell overhead with both hands, lower behind head, extend up.',
    imageUrl: `${IMG_BASE}/Dumbbell_One-Arm_Triceps_Extension/0.jpg`,
  },
  {
    id: 'tricep-dip',
    type: 'strength',
    name: 'Tricep Dip',
    muscleGroups: ['triceps', 'chest', 'shoulders'],
    equipment: 'bodyweight',
    instructions: 'Keep body upright on dip bars, lower by bending elbows, push back up.',
    imageUrl: `${IMG_BASE}/Dips_-_Triceps_Version/0.jpg`,
  },
  {
    id: 'tricep-kickback',
    type: 'strength',
    name: 'Tricep Kickback',
    muscleGroups: ['triceps'],
    equipment: 'dumbbell',
    instructions: 'Bend forward, upper arm parallel to ground, extend forearm back.',
    imageUrl: `${IMG_BASE}/Tricep_Dumbbell_Kickback/0.jpg`,
  },

  // CORE
  {
    id: 'plank',
    type: 'strength',
    name: 'Plank',
    muscleGroups: ['core'],
    equipment: 'bodyweight',
    instructions: 'Forearms on ground, body straight, hold position engaging core.',
    imageUrl: `${IMG_BASE}/Plank/0.jpg`,
  },
  {
    id: 'hanging-leg-raise',
    type: 'strength',
    name: 'Hanging Leg Raise',
    muscleGroups: ['core'],
    equipment: 'bodyweight',
    instructions: 'Hang from bar, raise legs to parallel or higher, lower with control.',
    imageUrl: `${IMG_BASE}/Hanging_Leg_Raise/0.jpg`,
  },
  {
    id: 'cable-crunch',
    type: 'strength',
    name: 'Cable Crunch',
    muscleGroups: ['core'],
    equipment: 'cable',
    instructions: 'Kneel facing cable, pull rope down by crunching abs, return with control.',
    imageUrl: `${IMG_BASE}/Cable_Crunch/0.jpg`,
  },
  {
    id: 'ab-wheel-rollout',
    type: 'strength',
    name: 'Ab Wheel Rollout',
    muscleGroups: ['core'],
    equipment: 'other',
    instructions: 'Kneel with wheel in front, roll forward keeping core tight, roll back.',
    imageUrl: `${IMG_BASE}/Ab_Roller/0.jpg`,
  },
  {
    id: 'russian-twist',
    type: 'strength',
    name: 'Russian Twist',
    muscleGroups: ['core'],
    equipment: 'bodyweight',
    instructions: 'Sit with torso at 45 degrees, rotate side to side touching ground.',
    imageUrl: `${IMG_BASE}/Russian_Twist/0.jpg`,
  },
  {
    id: 'dead-bug',
    type: 'strength',
    name: 'Dead Bug',
    muscleGroups: ['core'],
    equipment: 'bodyweight',
    instructions: 'Lie on back, arms up, lower opposite arm and leg while keeping back flat.',
    imageUrl: `${IMG_BASE}/Dead_Bug/0.jpg`,
  },
  {
    id: 'mountain-climber',
    type: 'strength',
    name: 'Mountain Climber',
    muscleGroups: ['core', 'shoulders'],
    equipment: 'bodyweight',
    instructions: 'In push-up position, alternate driving knees toward chest rapidly.',
    imageUrl: `${IMG_BASE}/Mountain_Climbers/0.jpg`,
  },
];

// Cardio exercises
export const cardioExercises: CardioExercise[] = [
  {
    id: 'outdoor-run',
    type: 'cardio',
    name: 'Outdoor Run',
    cardioType: 'running',
    instructions: 'Run outdoors at your desired pace. Track your distance and time.',
  },
  {
    id: 'treadmill-run',
    type: 'cardio',
    name: 'Treadmill Run',
    cardioType: 'running',
    instructions: 'Run on a treadmill. Adjust speed and incline as desired.',
  },
  {
    id: 'brisk-walk',
    type: 'cardio',
    name: 'Brisk Walk',
    cardioType: 'walking',
    instructions: 'Walk at a brisk pace, faster than a casual stroll.',
  },
  {
    id: 'incline-walk',
    type: 'cardio',
    name: 'Incline Treadmill Walk',
    cardioType: 'walking',
    instructions: 'Walk on a treadmill with elevated incline for increased intensity.',
  },
  {
    id: 'outdoor-cycling',
    type: 'cardio',
    name: 'Outdoor Cycling',
    cardioType: 'cycling',
    instructions: 'Cycle outdoors on roads or trails.',
  },
  {
    id: 'stationary-bike',
    type: 'cardio',
    name: 'Stationary Bike',
    cardioType: 'cycling',
    instructions: 'Cycle on a stationary bike. Adjust resistance as needed.',
  },
  {
    id: 'rowing-machine',
    type: 'cardio',
    name: 'Rowing Machine',
    cardioType: 'rowing',
    instructions: 'Use proper form: legs, back, arms on the pull; arms, back, legs on the return.',
  },
  {
    id: 'elliptical',
    type: 'cardio',
    name: 'Elliptical Trainer',
    cardioType: 'elliptical',
    instructions: 'Use the elliptical machine with smooth, continuous motion.',
  },
  {
    id: 'stair-climber',
    type: 'cardio',
    name: 'Stair Climber',
    cardioType: 'stair-climber',
    instructions: 'Climb stairs continuously. Avoid leaning on handrails.',
  },
  {
    id: 'lap-swimming',
    type: 'cardio',
    name: 'Lap Swimming',
    cardioType: 'swimming',
    instructions: 'Swim laps using your preferred stroke.',
  },
  {
    id: 'hiking',
    type: 'cardio',
    name: 'Hiking',
    cardioType: 'hiking',
    instructions: 'Hike on trails or terrain. Track distance covered.',
  },
  {
    id: 'hiit',
    type: 'cardio',
    name: 'HIIT',
    cardioType: 'hiit',
    instructions: 'High-intensity interval training. Alternate between intense bursts and rest periods.',
  },
  {
    id: 'boxing',
    type: 'cardio',
    name: 'Boxing',
    cardioType: 'boxing',
    instructions: 'Boxing workout including bag work, shadow boxing, or sparring.',
  },
];

// Combined exercises array
export const exercises: Exercise[] = [...strengthExercises, ...cardioExercises];

// Helper functions
export const getExerciseById = (id: string, customExercises: Exercise[] = []): Exercise | undefined => {
  // Check custom exercises first
  const custom = customExercises.find((e) => e.id === id);
  if (custom) return custom;
  return exercises.find((e) => e.id === id);
};

export const getExercisesByMuscleGroup = (muscleGroup: string): StrengthExercise[] => {
  return strengthExercises.filter((e) => e.muscleGroups.includes(muscleGroup as StrengthExercise['muscleGroups'][number]));
};

export const getExercisesByEquipment = (equipment: string): StrengthExercise[] => {
  return strengthExercises.filter((e) => e.equipment === equipment);
};

export const getCardioExercisesByType = (cardioType: string): CardioExercise[] => {
  return cardioExercises.filter((e) => e.cardioType === cardioType);
};

export const searchExercises = (query: string, customExercises: Exercise[] = []): Exercise[] => {
  const lowerQuery = query.toLowerCase();
  const allExercises = [...exercises, ...customExercises];
  return allExercises.filter((e) => {
    // Search by name (all exercises)
    if (e.name.toLowerCase().includes(lowerQuery)) return true;

    // Search by muscle group and equipment (strength only)
    if (e.type === 'strength') {
      if (e.muscleGroups.some((m) => m.toLowerCase().includes(lowerQuery))) return true;
      if (e.equipment.toLowerCase().includes(lowerQuery)) return true;
    }

    // Search by cardio type (cardio only)
    if (e.type === 'cardio') {
      if (e.cardioType.toLowerCase().includes(lowerQuery)) return true;
    }

    return false;
  });
};

export const getAllExercises = (customExercises: Exercise[] = []): Exercise[] => {
  return [...exercises, ...customExercises];
};
