// 3D geometry definitions for anatomical muscle groups
// Built with Three.js primitives to create a recognizable human anatomy

import * as THREE from 'three';

export interface MuscleGroupConfig {
  id: string;
  name: string;
  geometries: {
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    type: 'capsule' | 'sphere' | 'box' | 'cylinder';
    args: number[];
  }[];
}

// Muscle group definitions with positions relative to body center
export const muscleGroups: MuscleGroupConfig[] = [
  // === FRONT-FACING MUSCLES ===
  {
    id: 'chest',
    name: 'Chest',
    geometries: [
      // === LEFT PECTORALIS ===
      // Upper pec (clavicular head) - attaches to collarbone
      {
        position: [-0.14, 0.58, 0.09],
        rotation: [0.2, 0.15, 0.3],
        scale: [1.1, 0.7, 0.5],
        type: 'capsule',
        args: [0.045, 0.08, 12, 14],
      },
      // Mid pec (sternal head) - main mass
      {
        position: [-0.18, 0.52, 0.10],
        rotation: [0.25, 0.2, 0.35],
        scale: [1, 0.85, 0.55],
        type: 'sphere',
        args: [0.065, 14, 14],
      },
      // Lower pec - creates the pec line
      {
        position: [-0.16, 0.46, 0.095],
        rotation: [0.15, 0.15, 0.25],
        scale: [1.1, 0.6, 0.5],
        type: 'capsule',
        args: [0.04, 0.07, 12, 14],
      },
      // Outer pec - near armpit (arms by sides)
      {
        position: [-0.24, 0.52, 0.065],
        rotation: [0.2, 0.25, 0.2],
        scale: [0.6, 0.9, 0.5],
        type: 'capsule',
        args: [0.035, 0.07, 10, 12],
      },
      // Inner pec - near sternum
      {
        position: [-0.06, 0.52, 0.095],
        rotation: [0.15, 0.05, 0.1],
        scale: [0.7, 0.9, 0.45],
        type: 'capsule',
        args: [0.03, 0.06, 10, 12],
      },

      // === RIGHT PECTORALIS ===
      // Upper pec (clavicular head)
      {
        position: [0.14, 0.58, 0.09],
        rotation: [0.2, -0.15, -0.3],
        scale: [1.1, 0.7, 0.5],
        type: 'capsule',
        args: [0.045, 0.08, 12, 14],
      },
      // Mid pec (sternal head) - main mass
      {
        position: [0.18, 0.52, 0.10],
        rotation: [0.25, -0.2, -0.35],
        scale: [1, 0.85, 0.55],
        type: 'sphere',
        args: [0.065, 14, 14],
      },
      // Lower pec
      {
        position: [0.16, 0.46, 0.095],
        rotation: [0.15, -0.15, -0.25],
        scale: [1.1, 0.6, 0.5],
        type: 'capsule',
        args: [0.04, 0.07, 12, 14],
      },
      // Outer pec - near armpit (arms by sides)
      {
        position: [0.24, 0.52, 0.065],
        rotation: [0.2, -0.25, -0.2],
        scale: [0.6, 0.9, 0.5],
        type: 'capsule',
        args: [0.035, 0.07, 10, 12],
      },
      // Inner pec - near sternum
      {
        position: [0.06, 0.52, 0.095],
        rotation: [0.15, -0.05, -0.1],
        scale: [0.7, 0.9, 0.45],
        type: 'capsule',
        args: [0.03, 0.06, 10, 12],
      },

      // === STERNUM AREA ===
      {
        position: [0, 0.52, 0.085],
        rotation: [0.1, 0, 0],
        scale: [0.25, 1, 0.3],
        type: 'capsule',
        args: [0.015, 0.08, 8, 10],
      },
    ],
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    geometries: [
      // === LEFT DELTOID (arms by sides) ===
      // Anterior delt (front) - visible from front
      {
        position: [-0.28, 0.60, 0.05],
        rotation: [0.15, 0.15, 0.15],
        scale: [0.75, 0.9, 0.7],
        type: 'sphere',
        args: [0.05, 12, 12],
      },
      // Anterior delt lower
      {
        position: [-0.30, 0.54, 0.04],
        rotation: [0.1, 0.15, 0.12],
        scale: [0.6, 0.8, 0.6],
        type: 'capsule',
        args: [0.03, 0.04, 10, 12],
      },
      // Lateral delt (side) - creates shoulder width
      {
        position: [-0.34, 0.60, 0],
        rotation: [0, 0.08, 0.15],
        scale: [0.8, 1, 0.75],
        type: 'sphere',
        args: [0.055, 12, 12],
      },
      // Lateral delt lower - continues down arm
      {
        position: [-0.35, 0.52, 0],
        rotation: [0, 0.08, 0.12],
        scale: [0.65, 0.9, 0.6],
        type: 'capsule',
        args: [0.035, 0.05, 10, 12],
      },
      // Posterior delt (rear) - visible from back
      {
        position: [-0.30, 0.60, -0.045],
        rotation: [0.1, -0.1, 0.15],
        scale: [0.7, 0.85, 0.65],
        type: 'sphere',
        args: [0.045, 12, 12],
      },
      // Posterior delt lower
      {
        position: [-0.32, 0.53, -0.04],
        rotation: [0.05, -0.12, 0.12],
        scale: [0.55, 0.75, 0.55],
        type: 'capsule',
        args: [0.028, 0.04, 10, 12],
      },
      // Delt cap - top of shoulder
      {
        position: [-0.32, 0.65, 0],
        rotation: [0.1, 0, 0.1],
        scale: [0.9, 0.6, 0.8],
        type: 'sphere',
        args: [0.04, 10, 10],
      },

      // === RIGHT DELTOID (arms by sides) ===
      // Anterior delt (front)
      {
        position: [0.28, 0.60, 0.05],
        rotation: [0.15, -0.15, -0.15],
        scale: [0.75, 0.9, 0.7],
        type: 'sphere',
        args: [0.05, 12, 12],
      },
      // Anterior delt lower
      {
        position: [0.30, 0.54, 0.04],
        rotation: [0.1, -0.15, -0.12],
        scale: [0.6, 0.8, 0.6],
        type: 'capsule',
        args: [0.03, 0.04, 10, 12],
      },
      // Lateral delt (side)
      {
        position: [0.34, 0.60, 0],
        rotation: [0, -0.08, -0.15],
        scale: [0.8, 1, 0.75],
        type: 'sphere',
        args: [0.055, 12, 12],
      },
      // Lateral delt lower
      {
        position: [0.35, 0.52, 0],
        rotation: [0, -0.08, -0.12],
        scale: [0.65, 0.9, 0.6],
        type: 'capsule',
        args: [0.035, 0.05, 10, 12],
      },
      // Posterior delt (rear)
      {
        position: [0.30, 0.60, -0.045],
        rotation: [0.1, 0.1, -0.15],
        scale: [0.7, 0.85, 0.65],
        type: 'sphere',
        args: [0.045, 12, 12],
      },
      // Posterior delt lower
      {
        position: [0.32, 0.53, -0.04],
        rotation: [0.05, 0.12, -0.12],
        scale: [0.55, 0.75, 0.55],
        type: 'capsule',
        args: [0.028, 0.04, 10, 12],
      },
      // Delt cap - top of shoulder
      {
        position: [0.32, 0.65, 0],
        rotation: [0.1, 0, -0.1],
        scale: [0.9, 0.6, 0.8],
        type: 'sphere',
        args: [0.04, 10, 10],
      },
    ],
  },
  {
    id: 'biceps',
    name: 'Biceps',
    geometries: [
      // === LEFT BICEPS (arms by sides) ===
      // Biceps long head (outer) - creates the peak
      {
        position: [-0.32, 0.42, 0.045],
        rotation: [0.05, 0.08, 0.05],
        scale: [0.7, 1, 0.8],
        type: 'capsule',
        args: [0.035, 0.08, 10, 14],
      },
      // Biceps short head (inner)
      {
        position: [-0.28, 0.42, 0.04],
        rotation: [0.05, -0.05, 0.03],
        scale: [0.65, 1, 0.75],
        type: 'capsule',
        args: [0.032, 0.08, 10, 14],
      },
      // Biceps peak / belly
      {
        position: [-0.30, 0.40, 0.055],
        rotation: [0.08, 0.03, 0.04],
        scale: [0.85, 0.75, 0.8],
        type: 'sphere',
        args: [0.038, 12, 12],
      },
      // Brachialis (underneath bicep, adds arm width)
      {
        position: [-0.34, 0.40, 0.02],
        rotation: [0, 0.1, 0.05],
        scale: [0.6, 1, 0.6],
        type: 'capsule',
        args: [0.03, 0.07, 10, 12],
      },
      // Lower bicep near elbow
      {
        position: [-0.31, 0.34, 0.04],
        rotation: [0.05, 0.05, 0.04],
        scale: [0.7, 0.7, 0.65],
        type: 'capsule',
        args: [0.028, 0.04, 10, 12],
      },
      // Bicep tendon
      {
        position: [-0.31, 0.30, 0.035],
        rotation: [0, 0.03, 0.03],
        scale: [0.4, 0.6, 0.4],
        type: 'capsule',
        args: [0.015, 0.03, 8, 10],
      },

      // === RIGHT BICEPS (arms by sides) ===
      // Biceps long head (outer)
      {
        position: [0.32, 0.42, 0.045],
        rotation: [0.05, -0.08, -0.05],
        scale: [0.7, 1, 0.8],
        type: 'capsule',
        args: [0.035, 0.08, 10, 14],
      },
      // Biceps short head (inner)
      {
        position: [0.28, 0.42, 0.04],
        rotation: [0.05, 0.05, -0.03],
        scale: [0.65, 1, 0.75],
        type: 'capsule',
        args: [0.032, 0.08, 10, 14],
      },
      // Biceps peak / belly
      {
        position: [0.30, 0.40, 0.055],
        rotation: [0.08, -0.03, -0.04],
        scale: [0.85, 0.75, 0.8],
        type: 'sphere',
        args: [0.038, 12, 12],
      },
      // Brachialis
      {
        position: [0.34, 0.40, 0.02],
        rotation: [0, -0.1, -0.05],
        scale: [0.6, 1, 0.6],
        type: 'capsule',
        args: [0.03, 0.07, 10, 12],
      },
      // Lower bicep near elbow
      {
        position: [0.31, 0.34, 0.04],
        rotation: [0.05, -0.05, -0.04],
        scale: [0.7, 0.7, 0.65],
        type: 'capsule',
        args: [0.028, 0.04, 10, 12],
      },
      // Bicep tendon
      {
        position: [0.31, 0.30, 0.035],
        rotation: [0, -0.03, -0.03],
        scale: [0.4, 0.6, 0.4],
        type: 'capsule',
        args: [0.015, 0.03, 8, 10],
      },
    ],
  },
  {
    id: 'triceps',
    name: 'Triceps',
    geometries: [
      // === LEFT TRICEPS (arms by sides) ===
      // Long head - largest, inner back of arm
      {
        position: [-0.29, 0.44, -0.04],
        rotation: [0.05, -0.05, 0.05],
        scale: [0.7, 1, 0.75],
        type: 'capsule',
        args: [0.038, 0.09, 10, 14],
      },
      // Lateral head - outer, creates horseshoe shape
      {
        position: [-0.33, 0.42, -0.03],
        rotation: [0, 0.08, 0.05],
        scale: [0.65, 1, 0.7],
        type: 'capsule',
        args: [0.032, 0.08, 10, 14],
      },
      // Medial head - lower, near elbow
      {
        position: [-0.31, 0.34, -0.035],
        rotation: [0.03, 0.03, 0.04],
        scale: [0.7, 0.85, 0.65],
        type: 'capsule',
        args: [0.028, 0.06, 10, 12],
      },
      // Triceps horseshoe shape - outer
      {
        position: [-0.34, 0.38, -0.025],
        rotation: [0, 0.1, 0.06],
        scale: [0.55, 0.8, 0.55],
        type: 'sphere',
        args: [0.03, 10, 10],
      },
      // Triceps tendon - toward elbow
      {
        position: [-0.31, 0.30, -0.03],
        rotation: [0, 0.05, 0.04],
        scale: [0.5, 0.6, 0.45],
        type: 'capsule',
        args: [0.018, 0.035, 8, 10],
      },

      // === RIGHT TRICEPS (arms by sides) ===
      // Long head
      {
        position: [0.29, 0.44, -0.04],
        rotation: [0.05, 0.05, -0.05],
        scale: [0.7, 1, 0.75],
        type: 'capsule',
        args: [0.038, 0.09, 10, 14],
      },
      // Lateral head
      {
        position: [0.33, 0.42, -0.03],
        rotation: [0, -0.08, -0.05],
        scale: [0.65, 1, 0.7],
        type: 'capsule',
        args: [0.032, 0.08, 10, 14],
      },
      // Medial head
      {
        position: [0.31, 0.34, -0.035],
        rotation: [0.03, -0.03, -0.04],
        scale: [0.7, 0.85, 0.65],
        type: 'capsule',
        args: [0.028, 0.06, 10, 12],
      },
      // Triceps horseshoe shape
      {
        position: [0.34, 0.38, -0.025],
        rotation: [0, -0.1, -0.06],
        scale: [0.55, 0.8, 0.55],
        type: 'sphere',
        args: [0.03, 10, 10],
      },
      // Triceps tendon
      {
        position: [0.31, 0.30, -0.03],
        rotation: [0, -0.05, -0.04],
        scale: [0.5, 0.6, 0.45],
        type: 'capsule',
        args: [0.018, 0.035, 8, 10],
      },
    ],
  },
  {
    id: 'forearms',
    name: 'Forearms',
    geometries: [
      // === LEFT FOREARM (arms by sides) ===
      // Brachioradialis - top of forearm, largest
      {
        position: [-0.32, 0.24, 0.025],
        rotation: [0.05, 0.06, 0.03],
        scale: [0.7, 1, 0.65],
        type: 'capsule',
        args: [0.032, 0.08, 10, 14],
      },
      // Extensor carpi radialis - outer forearm
      {
        position: [-0.34, 0.18, 0.02],
        rotation: [0.03, 0.08, 0.03],
        scale: [0.6, 1, 0.55],
        type: 'capsule',
        args: [0.025, 0.08, 10, 12],
      },
      // Extensor digitorum - back of forearm
      {
        position: [-0.33, 0.16, -0.015],
        rotation: [0.02, 0.05, 0.02],
        scale: [0.65, 1, 0.55],
        type: 'capsule',
        args: [0.025, 0.09, 10, 12],
      },
      // Flexor carpi - inner forearm
      {
        position: [-0.29, 0.18, 0.01],
        rotation: [0.03, -0.03, 0.03],
        scale: [0.6, 1, 0.55],
        type: 'capsule',
        args: [0.025, 0.08, 10, 12],
      },
      // Pronator teres - upper inner forearm
      {
        position: [-0.30, 0.24, 0.01],
        rotation: [0.05, -0.05, 0.04],
        scale: [0.55, 0.8, 0.5],
        type: 'capsule',
        args: [0.022, 0.05, 10, 12],
      },
      // Lower forearm taper toward wrist
      {
        position: [-0.31, 0.08, 0],
        rotation: [0, 0.03, 0.02],
        scale: [0.6, 1, 0.6],
        type: 'cylinder',
        args: [0.022, 0.032, 0.10, 12],
      },
      // Wrist area
      {
        position: [-0.31, 0.00, 0],
        rotation: [0, 0, 0.02],
        scale: [0.55, 0.6, 0.6],
        type: 'sphere',
        args: [0.025, 10, 10],
      },

      // === RIGHT FOREARM (arms by sides) ===
      // Brachioradialis
      {
        position: [0.32, 0.24, 0.025],
        rotation: [0.05, -0.06, -0.03],
        scale: [0.7, 1, 0.65],
        type: 'capsule',
        args: [0.032, 0.08, 10, 14],
      },
      // Extensor carpi radialis
      {
        position: [0.34, 0.18, 0.02],
        rotation: [0.03, -0.08, -0.03],
        scale: [0.6, 1, 0.55],
        type: 'capsule',
        args: [0.025, 0.08, 10, 12],
      },
      // Extensor digitorum
      {
        position: [0.33, 0.16, -0.015],
        rotation: [0.02, -0.05, -0.02],
        scale: [0.65, 1, 0.55],
        type: 'capsule',
        args: [0.025, 0.09, 10, 12],
      },
      // Flexor carpi
      {
        position: [0.29, 0.18, 0.01],
        rotation: [0.03, 0.03, -0.03],
        scale: [0.6, 1, 0.55],
        type: 'capsule',
        args: [0.025, 0.08, 10, 12],
      },
      // Pronator teres
      {
        position: [0.30, 0.24, 0.01],
        rotation: [0.05, 0.05, -0.04],
        scale: [0.55, 0.8, 0.5],
        type: 'capsule',
        args: [0.022, 0.05, 10, 12],
      },
      // Lower forearm taper
      {
        position: [0.31, 0.08, 0],
        rotation: [0, -0.03, -0.02],
        scale: [0.6, 1, 0.6],
        type: 'cylinder',
        args: [0.022, 0.032, 0.10, 12],
      },
      // Wrist area
      {
        position: [0.31, 0.00, 0],
        rotation: [0, 0, -0.02],
        scale: [0.55, 0.6, 0.6],
        type: 'sphere',
        args: [0.025, 10, 10],
      },
    ],
  },
  {
    id: 'core',
    name: 'Core',
    geometries: [
      // === RECTUS ABDOMINIS (Six-pack / Eight-pack) ===
      // Top row - left
      {
        position: [-0.045, 0.38, 0.105],
        rotation: [0.15, 0, 0.05],
        scale: [1, 0.9, 0.5],
        type: 'sphere',
        args: [0.038, 10, 10],
      },
      // Top row - right
      {
        position: [0.045, 0.38, 0.105],
        rotation: [0.15, 0, -0.05],
        scale: [1, 0.9, 0.5],
        type: 'sphere',
        args: [0.038, 10, 10],
      },
      // Second row - left
      {
        position: [-0.045, 0.32, 0.11],
        rotation: [0.08, 0, 0.03],
        scale: [1, 0.95, 0.5],
        type: 'sphere',
        args: [0.04, 10, 10],
      },
      // Second row - right
      {
        position: [0.045, 0.32, 0.11],
        rotation: [0.08, 0, -0.03],
        scale: [1, 0.95, 0.5],
        type: 'sphere',
        args: [0.04, 10, 10],
      },
      // Third row - left
      {
        position: [-0.045, 0.26, 0.11],
        rotation: [0, 0, 0.02],
        scale: [1, 0.95, 0.5],
        type: 'sphere',
        args: [0.04, 10, 10],
      },
      // Third row - right
      {
        position: [0.045, 0.26, 0.11],
        rotation: [0, 0, -0.02],
        scale: [1, 0.95, 0.5],
        type: 'sphere',
        args: [0.04, 10, 10],
      },
      // Fourth row (lower abs) - left
      {
        position: [-0.042, 0.20, 0.105],
        rotation: [-0.1, 0, 0.02],
        scale: [0.95, 0.9, 0.45],
        type: 'sphere',
        args: [0.038, 10, 10],
      },
      // Fourth row (lower abs) - right
      {
        position: [0.042, 0.20, 0.105],
        rotation: [-0.1, 0, -0.02],
        scale: [0.95, 0.9, 0.45],
        type: 'sphere',
        args: [0.038, 10, 10],
      },
      // Lower abdominal area (below belly button)
      {
        position: [0, 0.14, 0.095],
        rotation: [-0.15, 0, 0],
        scale: [1.3, 0.8, 0.4],
        type: 'sphere',
        args: [0.05, 10, 10],
      },

      // === EXTERNAL OBLIQUES ===
      // Left oblique - upper portion
      {
        position: [-0.14, 0.32, 0.06],
        rotation: [0.1, 0.2, 0.25],
        scale: [0.55, 1, 0.5],
        type: 'capsule',
        args: [0.035, 0.1, 10, 12],
      },
      // Left oblique - middle portion
      {
        position: [-0.15, 0.24, 0.07],
        rotation: [0, 0.15, 0.2],
        scale: [0.6, 1, 0.5],
        type: 'capsule',
        args: [0.035, 0.1, 10, 12],
      },
      // Left oblique - lower portion (V-line)
      {
        position: [-0.12, 0.15, 0.075],
        rotation: [-0.1, 0.1, 0.35],
        scale: [0.5, 1, 0.45],
        type: 'capsule',
        args: [0.03, 0.08, 10, 12],
      },
      // Right oblique - upper portion
      {
        position: [0.14, 0.32, 0.06],
        rotation: [0.1, -0.2, -0.25],
        scale: [0.55, 1, 0.5],
        type: 'capsule',
        args: [0.035, 0.1, 10, 12],
      },
      // Right oblique - middle portion
      {
        position: [0.15, 0.24, 0.07],
        rotation: [0, -0.15, -0.2],
        scale: [0.6, 1, 0.5],
        type: 'capsule',
        args: [0.035, 0.1, 10, 12],
      },
      // Right oblique - lower portion (V-line)
      {
        position: [0.12, 0.15, 0.075],
        rotation: [-0.1, -0.1, -0.35],
        scale: [0.5, 1, 0.45],
        type: 'capsule',
        args: [0.03, 0.08, 10, 12],
      },

      // === SERRATUS ANTERIOR (finger-like muscles on ribs) ===
      // Left serratus - top
      {
        position: [-0.18, 0.42, 0.04],
        rotation: [0.2, 0.4, 0.6],
        scale: [0.4, 0.7, 0.35],
        type: 'capsule',
        args: [0.018, 0.035, 8, 10],
      },
      // Left serratus - second
      {
        position: [-0.19, 0.39, 0.05],
        rotation: [0.15, 0.35, 0.5],
        scale: [0.4, 0.75, 0.35],
        type: 'capsule',
        args: [0.02, 0.04, 8, 10],
      },
      // Left serratus - third
      {
        position: [-0.195, 0.355, 0.055],
        rotation: [0.1, 0.3, 0.45],
        scale: [0.45, 0.8, 0.35],
        type: 'capsule',
        args: [0.022, 0.045, 8, 10],
      },
      // Left serratus - fourth
      {
        position: [-0.19, 0.32, 0.055],
        rotation: [0.05, 0.25, 0.35],
        scale: [0.45, 0.8, 0.35],
        type: 'capsule',
        args: [0.02, 0.04, 8, 10],
      },
      // Right serratus - top
      {
        position: [0.18, 0.42, 0.04],
        rotation: [0.2, -0.4, -0.6],
        scale: [0.4, 0.7, 0.35],
        type: 'capsule',
        args: [0.018, 0.035, 8, 10],
      },
      // Right serratus - second
      {
        position: [0.19, 0.39, 0.05],
        rotation: [0.15, -0.35, -0.5],
        scale: [0.4, 0.75, 0.35],
        type: 'capsule',
        args: [0.02, 0.04, 8, 10],
      },
      // Right serratus - third
      {
        position: [0.195, 0.355, 0.055],
        rotation: [0.1, -0.3, -0.45],
        scale: [0.45, 0.8, 0.35],
        type: 'capsule',
        args: [0.022, 0.045, 8, 10],
      },
      // Right serratus - fourth
      {
        position: [0.19, 0.32, 0.055],
        rotation: [0.05, -0.25, -0.35],
        scale: [0.45, 0.8, 0.35],
        type: 'capsule',
        args: [0.02, 0.04, 8, 10],
      },

      // === INTERCOSTALS (between ribs, visible on lean physiques) ===
      // Left side
      {
        position: [-0.16, 0.44, 0.035],
        rotation: [0.1, 0.3, 0.4],
        scale: [0.3, 0.5, 0.25],
        type: 'capsule',
        args: [0.012, 0.025, 6, 8],
      },
      // Right side
      {
        position: [0.16, 0.44, 0.035],
        rotation: [0.1, -0.3, -0.4],
        scale: [0.3, 0.5, 0.25],
        type: 'capsule',
        args: [0.012, 0.025, 6, 8],
      },
    ],
  },
  {
    id: 'quadriceps',
    name: 'Quadriceps',
    geometries: [
      // === LEFT QUADRICEPS (spans y: -0.06 to -0.36) ===
      // Rectus femoris - central muscle, runs full length
      {
        position: [-0.14, -0.20, 0.07],
        rotation: [0.05, 0, 0.02],
        scale: [0.75, 1, 0.85],
        type: 'capsule',
        args: [0.05, 0.13, 12, 16],
      },
      // Vastus lateralis upper - outer thigh sweep
      {
        position: [-0.20, -0.12, 0.03],
        rotation: [0.05, 0.1, 0.15],
        scale: [0.7, 1, 0.7],
        type: 'capsule',
        args: [0.05, 0.10, 12, 16],
      },
      // Vastus lateralis lower - continues the outer sweep to knee
      {
        position: [-0.19, -0.26, 0.04],
        rotation: [0.03, 0.08, 0.08],
        scale: [0.75, 1, 0.65],
        type: 'capsule',
        args: [0.045, 0.09, 12, 16],
      },
      // Vastus medialis upper - inner thigh
      {
        position: [-0.09, -0.14, 0.05],
        rotation: [0.05, -0.08, -0.1],
        scale: [0.65, 1, 0.6],
        type: 'capsule',
        args: [0.04, 0.08, 12, 16],
      },
      // Vastus medialis lower - the "teardrop" near knee
      {
        position: [-0.09, -0.30, 0.055],
        rotation: [0.1, -0.15, -0.1],
        scale: [0.9, 0.75, 0.7],
        type: 'sphere',
        args: [0.045, 12, 12],
      },
      // Vastus intermedius - deep muscle adding bulk
      {
        position: [-0.14, -0.20, 0.04],
        rotation: [0, 0, 0.02],
        scale: [1, 1, 0.5],
        type: 'capsule',
        args: [0.055, 0.12, 8, 12],
      },
      // Quad tendon above patella
      {
        position: [-0.14, -0.35, 0.05],
        rotation: [0.15, 0, 0],
        scale: [0.8, 0.5, 0.5],
        type: 'capsule',
        args: [0.035, 0.025, 8, 12],
      },

      // === RIGHT QUADRICEPS ===
      // Rectus femoris
      {
        position: [0.14, -0.20, 0.07],
        rotation: [0.05, 0, -0.02],
        scale: [0.75, 1, 0.85],
        type: 'capsule',
        args: [0.05, 0.13, 12, 16],
      },
      // Vastus lateralis upper
      {
        position: [0.20, -0.12, 0.03],
        rotation: [0.05, -0.1, -0.15],
        scale: [0.7, 1, 0.7],
        type: 'capsule',
        args: [0.05, 0.10, 12, 16],
      },
      // Vastus lateralis lower
      {
        position: [0.19, -0.26, 0.04],
        rotation: [0.03, -0.08, -0.08],
        scale: [0.75, 1, 0.65],
        type: 'capsule',
        args: [0.045, 0.09, 12, 16],
      },
      // Vastus medialis upper
      {
        position: [0.09, -0.14, 0.05],
        rotation: [0.05, 0.08, 0.1],
        scale: [0.65, 1, 0.6],
        type: 'capsule',
        args: [0.04, 0.08, 12, 16],
      },
      // Vastus medialis lower - teardrop
      {
        position: [0.09, -0.30, 0.055],
        rotation: [0.1, 0.15, 0.1],
        scale: [0.9, 0.75, 0.7],
        type: 'sphere',
        args: [0.045, 12, 12],
      },
      // Vastus intermedius
      {
        position: [0.14, -0.20, 0.04],
        rotation: [0, 0, -0.02],
        scale: [1, 1, 0.5],
        type: 'capsule',
        args: [0.055, 0.12, 8, 12],
      },
      // Quad tendon above patella
      {
        position: [0.14, -0.35, 0.05],
        rotation: [0.15, 0, 0],
        scale: [0.8, 0.5, 0.5],
        type: 'capsule',
        args: [0.035, 0.025, 8, 12],
      },
    ],
  },
  // === BACK-FACING MUSCLES ===
  {
    id: 'traps',
    name: 'Traps',
    geometries: [
      // === LEFT TRAPEZIUS ===
      // Upper trap - neck to shoulder slope
      {
        position: [-0.12, 0.72, -0.04],
        rotation: [0.25, 0.1, 0.55],
        scale: [0.6, 1, 0.4],
        type: 'capsule',
        args: [0.035, 0.10, 10, 14],
      },
      // Upper trap - shoulder insertion
      {
        position: [-0.28, 0.66, -0.05],
        rotation: [0.2, 0.2, 0.7],
        scale: [0.55, 0.8, 0.4],
        type: 'capsule',
        args: [0.03, 0.07, 10, 12],
      },
      // Middle trap - between shoulder blades
      {
        position: [-0.10, 0.56, -0.09],
        rotation: [0.1, 0.15, 0.15],
        scale: [1, 0.8, 0.4],
        type: 'capsule',
        args: [0.035, 0.08, 10, 14],
      },
      // Lower trap - angled down toward spine
      {
        position: [-0.08, 0.46, -0.085],
        rotation: [0.15, 0.1, 0.35],
        scale: [0.7, 1, 0.35],
        type: 'capsule',
        args: [0.028, 0.08, 10, 12],
      },

      // === RIGHT TRAPEZIUS ===
      // Upper trap - neck to shoulder slope
      {
        position: [0.12, 0.72, -0.04],
        rotation: [0.25, -0.1, -0.55],
        scale: [0.6, 1, 0.4],
        type: 'capsule',
        args: [0.035, 0.10, 10, 14],
      },
      // Upper trap - shoulder insertion
      {
        position: [0.28, 0.66, -0.05],
        rotation: [0.2, -0.2, -0.7],
        scale: [0.55, 0.8, 0.4],
        type: 'capsule',
        args: [0.03, 0.07, 10, 12],
      },
      // Middle trap - between shoulder blades
      {
        position: [0.10, 0.56, -0.09],
        rotation: [0.1, -0.15, -0.15],
        scale: [1, 0.8, 0.4],
        type: 'capsule',
        args: [0.035, 0.08, 10, 14],
      },
      // Lower trap - angled down toward spine
      {
        position: [0.08, 0.46, -0.085],
        rotation: [0.15, -0.1, -0.35],
        scale: [0.7, 1, 0.35],
        type: 'capsule',
        args: [0.028, 0.08, 10, 12],
      },

      // === CENTRAL SPINE AREA ===
      // Upper spine / neck base
      {
        position: [0, 0.70, -0.055],
        rotation: [0.2, 0, 0],
        scale: [0.5, 0.6, 0.35],
        type: 'sphere',
        args: [0.035, 10, 10],
      },
    ],
  },
  {
    id: 'back',
    name: 'Back',
    geometries: [
      // === LEFT BACK ===
      // Rhomboid minor - upper, smaller
      {
        position: [-0.08, 0.58, -0.085],
        rotation: [0.1, 0.1, 0.2],
        scale: [0.8, 0.7, 0.4],
        type: 'capsule',
        args: [0.03, 0.05, 10, 12],
      },
      // Rhomboid major - between spine and shoulder blade
      {
        position: [-0.10, 0.50, -0.085],
        rotation: [0.08, 0.12, 0.18],
        scale: [0.9, 1, 0.45],
        type: 'capsule',
        args: [0.035, 0.08, 10, 14],
      },
      // Infraspinatus - on shoulder blade
      {
        position: [-0.18, 0.54, -0.08],
        rotation: [0.15, 0.2, 0.25],
        scale: [1, 0.85, 0.45],
        type: 'sphere',
        args: [0.055, 12, 12],
      },
      // Teres minor - above teres major
      {
        position: [-0.24, 0.52, -0.06],
        rotation: [0.1, 0.25, 0.35],
        scale: [0.5, 0.9, 0.45],
        type: 'capsule',
        args: [0.025, 0.05, 10, 12],
      },
      // Teres major - connects to lat
      {
        position: [-0.26, 0.46, -0.055],
        rotation: [0.15, 0.3, 0.45],
        scale: [0.55, 1, 0.5],
        type: 'capsule',
        args: [0.03, 0.06, 10, 12],
      },
      // Erector spinae - upper
      {
        position: [-0.05, 0.42, -0.08],
        rotation: [0.08, 0.03, 0.05],
        scale: [0.55, 1, 0.45],
        type: 'capsule',
        args: [0.028, 0.10, 10, 14],
      },
      // Erector spinae - mid
      {
        position: [-0.05, 0.28, -0.075],
        rotation: [0.05, 0.02, 0.03],
        scale: [0.6, 1, 0.5],
        type: 'capsule',
        args: [0.03, 0.10, 10, 14],
      },
      // Erector spinae - lower
      {
        position: [-0.05, 0.14, -0.07],
        rotation: [0, 0, 0.02],
        scale: [0.65, 1, 0.5],
        type: 'capsule',
        args: [0.032, 0.08, 10, 14],
      },

      // === RIGHT BACK ===
      // Rhomboid minor
      {
        position: [0.08, 0.58, -0.085],
        rotation: [0.1, -0.1, -0.2],
        scale: [0.8, 0.7, 0.4],
        type: 'capsule',
        args: [0.03, 0.05, 10, 12],
      },
      // Rhomboid major
      {
        position: [0.10, 0.50, -0.085],
        rotation: [0.08, -0.12, -0.18],
        scale: [0.9, 1, 0.45],
        type: 'capsule',
        args: [0.035, 0.08, 10, 14],
      },
      // Infraspinatus
      {
        position: [0.18, 0.54, -0.08],
        rotation: [0.15, -0.2, -0.25],
        scale: [1, 0.85, 0.45],
        type: 'sphere',
        args: [0.055, 12, 12],
      },
      // Teres minor
      {
        position: [0.24, 0.52, -0.06],
        rotation: [0.1, -0.25, -0.35],
        scale: [0.5, 0.9, 0.45],
        type: 'capsule',
        args: [0.025, 0.05, 10, 12],
      },
      // Teres major
      {
        position: [0.26, 0.46, -0.055],
        rotation: [0.15, -0.3, -0.45],
        scale: [0.55, 1, 0.5],
        type: 'capsule',
        args: [0.03, 0.06, 10, 12],
      },
      // Erector spinae - upper
      {
        position: [0.05, 0.42, -0.08],
        rotation: [0.08, -0.03, -0.05],
        scale: [0.55, 1, 0.45],
        type: 'capsule',
        args: [0.028, 0.10, 10, 14],
      },
      // Erector spinae - mid
      {
        position: [0.05, 0.28, -0.075],
        rotation: [0.05, -0.02, -0.03],
        scale: [0.6, 1, 0.5],
        type: 'capsule',
        args: [0.03, 0.10, 10, 14],
      },
      // Erector spinae - lower
      {
        position: [0.05, 0.14, -0.07],
        rotation: [0, 0, -0.02],
        scale: [0.65, 1, 0.5],
        type: 'capsule',
        args: [0.032, 0.08, 10, 14],
      },

      // === SPINAL COLUMN ===
      // Thoracic spine area
      {
        position: [0, 0.45, -0.085],
        rotation: [0.1, 0, 0],
        scale: [0.3, 1, 0.25],
        type: 'capsule',
        args: [0.015, 0.15, 8, 10],
      },
      // Lumbar spine area
      {
        position: [0, 0.22, -0.075],
        rotation: [0.05, 0, 0],
        scale: [0.35, 1, 0.3],
        type: 'capsule',
        args: [0.018, 0.12, 8, 10],
      },
    ],
  },
  {
    id: 'lats',
    name: 'Lats',
    geometries: [
      // === LEFT LAT (arms by sides) ===
      // Upper lat - near armpit
      {
        position: [-0.24, 0.48, -0.04],
        rotation: [0.2, 0.25, 0.2],
        scale: [0.6, 0.9, 0.5],
        type: 'sphere',
        args: [0.055, 12, 12],
      },
      // Mid lat - main mass creating V-taper
      {
        position: [-0.24, 0.38, -0.05],
        rotation: [0.15, 0.25, 0.35],
        scale: [0.8, 1.1, 0.5],
        type: 'capsule',
        args: [0.055, 0.10, 12, 14],
      },
      // Lower lat - sweeps down to lower back
      {
        position: [-0.18, 0.26, -0.055],
        rotation: [0.1, 0.15, 0.2],
        scale: [0.85, 1, 0.45],
        type: 'capsule',
        args: [0.045, 0.09, 12, 14],
      },
      // Lat insertion - near spine/hip
      {
        position: [-0.12, 0.16, -0.06],
        rotation: [0.05, 0.08, 0.12],
        scale: [0.75, 0.9, 0.4],
        type: 'capsule',
        args: [0.035, 0.07, 10, 12],
      },
      // Outer lat edge - creates width (arms by sides)
      {
        position: [-0.26, 0.40, -0.02],
        rotation: [0.1, 0.25, 0.2],
        scale: [0.5, 1, 0.4],
        type: 'capsule',
        args: [0.03, 0.12, 10, 12],
      },

      // === RIGHT LAT (arms by sides) ===
      // Upper lat - near armpit
      {
        position: [0.24, 0.48, -0.04],
        rotation: [0.2, -0.25, -0.2],
        scale: [0.6, 0.9, 0.5],
        type: 'sphere',
        args: [0.055, 12, 12],
      },
      // Mid lat - main mass creating V-taper
      {
        position: [0.24, 0.38, -0.05],
        rotation: [0.15, -0.25, -0.35],
        scale: [0.8, 1.1, 0.5],
        type: 'capsule',
        args: [0.055, 0.10, 12, 14],
      },
      // Lower lat - sweeps down to lower back
      {
        position: [0.18, 0.26, -0.055],
        rotation: [0.1, -0.15, -0.2],
        scale: [0.85, 1, 0.45],
        type: 'capsule',
        args: [0.045, 0.09, 12, 14],
      },
      // Lat insertion - near spine/hip
      {
        position: [0.12, 0.16, -0.06],
        rotation: [0.05, -0.08, -0.12],
        scale: [0.75, 0.9, 0.4],
        type: 'capsule',
        args: [0.035, 0.07, 10, 12],
      },
      // Outer lat edge - creates width (arms by sides)
      {
        position: [0.26, 0.40, -0.02],
        rotation: [0.1, -0.25, -0.2],
        scale: [0.5, 1, 0.4],
        type: 'capsule',
        args: [0.03, 0.12, 10, 12],
      },
    ],
  },
  {
    id: 'glutes',
    name: 'Glutes',
    geometries: [
      // === LEFT GLUTES (spans y: 0.08 to -0.04) ===
      // Gluteus maximus - main mass
      {
        position: [-0.14, 0.0, -0.09],
        rotation: [0.35, 0.08, 0.05],
        scale: [1, 0.8, 0.9],
        type: 'sphere',
        args: [0.09, 14, 14],
      },
      // Gluteus maximus - lower curve
      {
        position: [-0.14, -0.05, -0.07],
        rotation: [0.15, 0.05, 0.05],
        scale: [0.95, 0.6, 0.8],
        type: 'sphere',
        args: [0.07, 14, 14],
      },
      // Gluteus medius - side hip
      {
        position: [-0.20, 0.04, -0.03],
        rotation: [0.2, 0.25, 0.25],
        scale: [0.7, 0.8, 0.55],
        type: 'sphere',
        args: [0.055, 12, 12],
      },
      // Gluteus medius - upper
      {
        position: [-0.18, 0.08, -0.01],
        rotation: [0.15, 0.2, 0.2],
        scale: [0.65, 0.6, 0.5],
        type: 'sphere',
        args: [0.04, 10, 10],
      },
      // Inner glute
      {
        position: [-0.08, 0.0, -0.09],
        rotation: [0.3, -0.08, -0.08],
        scale: [0.55, 0.7, 0.65],
        type: 'sphere',
        args: [0.05, 10, 10],
      },

      // === RIGHT GLUTES ===
      // Gluteus maximus - main mass
      {
        position: [0.14, 0.0, -0.09],
        rotation: [0.35, -0.08, -0.05],
        scale: [1, 0.8, 0.9],
        type: 'sphere',
        args: [0.09, 14, 14],
      },
      // Gluteus maximus - lower curve
      {
        position: [0.14, -0.05, -0.07],
        rotation: [0.15, -0.05, -0.05],
        scale: [0.95, 0.6, 0.8],
        type: 'sphere',
        args: [0.07, 14, 14],
      },
      // Gluteus medius - side hip
      {
        position: [0.20, 0.04, -0.03],
        rotation: [0.2, -0.25, -0.25],
        scale: [0.7, 0.8, 0.55],
        type: 'sphere',
        args: [0.055, 12, 12],
      },
      // Gluteus medius - upper
      {
        position: [0.18, 0.08, -0.01],
        rotation: [0.15, -0.2, -0.2],
        scale: [0.65, 0.6, 0.5],
        type: 'sphere',
        args: [0.04, 10, 10],
      },
      // Inner glute
      {
        position: [0.08, 0.0, -0.09],
        rotation: [0.3, 0.08, 0.08],
        scale: [0.55, 0.7, 0.65],
        type: 'sphere',
        args: [0.05, 10, 10],
      },

      // === SACRAL AREA ===
      {
        position: [0, 0.04, -0.085],
        rotation: [0.25, 0, 0],
        scale: [0.7, 0.45, 0.35],
        type: 'sphere',
        args: [0.035, 8, 8],
      },
    ],
  },
  {
    id: 'hamstrings',
    name: 'Hamstrings',
    geometries: [
      // === LEFT HAMSTRINGS (spans y: -0.06 to -0.36) ===
      // Biceps femoris (long head) - outer back
      {
        position: [-0.18, -0.18, -0.05],
        rotation: [-0.03, -0.08, 0.08],
        scale: [0.7, 1, 0.7],
        type: 'capsule',
        args: [0.04, 0.12, 12, 16],
      },
      // Biceps femoris lower - continues to knee
      {
        position: [-0.18, -0.28, -0.04],
        rotation: [-0.05, -0.06, 0.06],
        scale: [0.65, 1, 0.6],
        type: 'capsule',
        args: [0.035, 0.08, 12, 16],
      },
      // Semitendinosus - inner back, long
      {
        position: [-0.10, -0.18, -0.06],
        rotation: [-0.03, 0.06, -0.05],
        scale: [0.6, 1, 0.6],
        type: 'capsule',
        args: [0.035, 0.12, 12, 16],
      },
      // Semitendinosus lower
      {
        position: [-0.10, -0.30, -0.05],
        rotation: [-0.05, 0.05, -0.04],
        scale: [0.55, 0.9, 0.55],
        type: 'capsule',
        args: [0.028, 0.06, 12, 16],
      },
      // Semimembranosus - wider, deeper
      {
        position: [-0.14, -0.16, -0.065],
        rotation: [-0.05, 0.02, 0],
        scale: [0.8, 1, 0.65],
        type: 'capsule',
        args: [0.042, 0.11, 12, 16],
      },
      // Semimembranosus lower
      {
        position: [-0.13, -0.28, -0.055],
        rotation: [-0.06, 0.03, -0.02],
        scale: [0.75, 0.85, 0.6],
        type: 'sphere',
        args: [0.038, 12, 12],
      },
      // Upper hamstring connection to glutes
      {
        position: [-0.14, -0.07, -0.055],
        rotation: [0.15, 0, 0.03],
        scale: [1.1, 0.55, 0.75],
        type: 'sphere',
        args: [0.05, 12, 12],
      },

      // === RIGHT HAMSTRINGS ===
      // Biceps femoris (long head)
      {
        position: [0.18, -0.18, -0.05],
        rotation: [-0.03, 0.08, -0.08],
        scale: [0.7, 1, 0.7],
        type: 'capsule',
        args: [0.04, 0.12, 12, 16],
      },
      // Biceps femoris lower
      {
        position: [0.18, -0.28, -0.04],
        rotation: [-0.05, 0.06, -0.06],
        scale: [0.65, 1, 0.6],
        type: 'capsule',
        args: [0.035, 0.08, 12, 16],
      },
      // Semitendinosus
      {
        position: [0.10, -0.18, -0.06],
        rotation: [-0.03, -0.06, 0.05],
        scale: [0.6, 1, 0.6],
        type: 'capsule',
        args: [0.035, 0.12, 12, 16],
      },
      // Semitendinosus lower
      {
        position: [0.10, -0.30, -0.05],
        rotation: [-0.05, -0.05, 0.04],
        scale: [0.55, 0.9, 0.55],
        type: 'capsule',
        args: [0.028, 0.06, 12, 16],
      },
      // Semimembranosus
      {
        position: [0.14, -0.16, -0.065],
        rotation: [-0.05, -0.02, 0],
        scale: [0.8, 1, 0.65],
        type: 'capsule',
        args: [0.042, 0.11, 12, 16],
      },
      // Semimembranosus lower
      {
        position: [0.13, -0.28, -0.055],
        rotation: [-0.06, -0.03, 0.02],
        scale: [0.75, 0.85, 0.6],
        type: 'sphere',
        args: [0.038, 12, 12],
      },
      // Upper hamstring connection to glutes
      {
        position: [0.14, -0.07, -0.055],
        rotation: [0.15, 0, -0.03],
        scale: [1.1, 0.55, 0.75],
        type: 'sphere',
        args: [0.05, 12, 12],
      },
    ],
  },
  {
    id: 'calves',
    name: 'Calves',
    geometries: [
      // === LEFT CALF (spans y: -0.42 to -0.70) ===
      // Gastrocnemius medial head - inner calf bulge
      {
        position: [-0.12, -0.46, -0.035],
        rotation: [0.15, -0.05, -0.05],
        scale: [0.7, 0.85, 0.9],
        type: 'sphere',
        args: [0.05, 14, 14],
      },
      // Gastrocnemius lateral head - outer calf bulge
      {
        position: [-0.16, -0.47, -0.03],
        rotation: [0.15, 0.05, 0.05],
        scale: [0.65, 0.8, 0.85],
        type: 'sphere',
        args: [0.045, 14, 14],
      },
      // Soleus - deeper muscle, visible on sides
      {
        position: [-0.14, -0.54, -0.02],
        rotation: [0.05, 0, 0],
        scale: [0.8, 1, 0.65],
        type: 'capsule',
        args: [0.04, 0.06, 12, 14],
      },
      // Lower calf / Achilles area
      {
        position: [-0.14, -0.63, -0.02],
        rotation: [0, 0, 0],
        scale: [0.6, 1, 0.5],
        type: 'capsule',
        args: [0.025, 0.05, 10, 12],
      },
      // Tibialis anterior - front of shin
      {
        position: [-0.12, -0.50, 0.035],
        rotation: [0.08, 0, 0.08],
        scale: [0.55, 1, 0.45],
        type: 'capsule',
        args: [0.025, 0.10, 10, 14],
      },
      // Peroneus muscles - outer lower leg
      {
        position: [-0.17, -0.54, 0.01],
        rotation: [0.05, 0.1, 0.1],
        scale: [0.45, 1, 0.4],
        type: 'capsule',
        args: [0.02, 0.08, 8, 12],
      },

      // === RIGHT CALF ===
      // Gastrocnemius medial head
      {
        position: [0.12, -0.46, -0.035],
        rotation: [0.15, 0.05, 0.05],
        scale: [0.7, 0.85, 0.9],
        type: 'sphere',
        args: [0.05, 14, 14],
      },
      // Gastrocnemius lateral head
      {
        position: [0.16, -0.47, -0.03],
        rotation: [0.15, -0.05, -0.05],
        scale: [0.65, 0.8, 0.85],
        type: 'sphere',
        args: [0.045, 14, 14],
      },
      // Soleus
      {
        position: [0.14, -0.54, -0.02],
        rotation: [0.05, 0, 0],
        scale: [0.8, 1, 0.65],
        type: 'capsule',
        args: [0.04, 0.06, 12, 14],
      },
      // Lower calf / Achilles area
      {
        position: [0.14, -0.63, -0.02],
        rotation: [0, 0, 0],
        scale: [0.6, 1, 0.5],
        type: 'capsule',
        args: [0.025, 0.05, 10, 12],
      },
      // Tibialis anterior
      {
        position: [0.12, -0.50, 0.035],
        rotation: [0.08, 0, -0.08],
        scale: [0.55, 1, 0.45],
        type: 'capsule',
        args: [0.025, 0.10, 10, 14],
      },
      // Peroneus muscles
      {
        position: [0.17, -0.54, 0.01],
        rotation: [0.05, -0.1, -0.1],
        scale: [0.45, 1, 0.4],
        type: 'capsule',
        args: [0.02, 0.08, 8, 12],
      },
    ],
  },
];

// Create geometry based on type
export const createGeometry = (
  type: 'capsule' | 'sphere' | 'box' | 'cylinder',
  args: number[]
): THREE.BufferGeometry => {
  switch (type) {
    case 'capsule':
      return new THREE.CapsuleGeometry(args[0], args[1], args[2], args[3]);
    case 'sphere':
      return new THREE.SphereGeometry(args[0], args[1], args[2]);
    case 'box':
      return new THREE.BoxGeometry(args[0], args[1], args[2]);
    case 'cylinder':
      return new THREE.CylinderGeometry(args[0], args[1], args[2], args[3]);
    default:
      return new THREE.SphereGeometry(0.1);
  }
};

// Body frame geometry for context (skeleton/torso outline)
export const bodyFrameConfig = {
  // === TORSO / RIBCAGE ===
  // Upper chest / ribcage
  upperRibcage: {
    position: [0, 0.56, 0] as [number, number, number],
    scale: [0.28, 0.12, 0.14] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 14, 14],
  },
  // Mid ribcage
  midRibcage: {
    position: [0, 0.46, 0] as [number, number, number],
    scale: [0.26, 0.10, 0.13] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 14, 14],
  },
  // Lower ribcage - tapers inward
  lowerRibcage: {
    position: [0, 0.36, 0] as [number, number, number],
    scale: [0.22, 0.10, 0.12] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 14, 14],
  },
  // Sternum
  sternum: {
    position: [0, 0.50, 0.08] as [number, number, number],
    rotation: [0.15, 0, 0] as [number, number, number],
    scale: [0.025, 0.14, 0.015] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 10],
  },
  // Left clavicle
  leftClavicle: {
    position: [-0.14, 0.64, 0.04] as [number, number, number],
    rotation: [0.1, 0.1, 0.35] as [number, number, number],
    scale: [0.12, 0.015, 0.012] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 10],
  },
  // Right clavicle
  rightClavicle: {
    position: [0.14, 0.64, 0.04] as [number, number, number],
    rotation: [0.1, -0.1, -0.35] as [number, number, number],
    scale: [0.12, 0.015, 0.012] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 10],
  },
  // Left scapula (shoulder blade)
  leftScapula: {
    position: [-0.16, 0.52, -0.07] as [number, number, number],
    rotation: [0.15, 0.15, 0.12] as [number, number, number],
    scale: [0.08, 0.12, 0.02] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 10, 10],
  },
  // Right scapula
  rightScapula: {
    position: [0.16, 0.52, -0.07] as [number, number, number],
    rotation: [0.15, -0.15, -0.12] as [number, number, number],
    scale: [0.08, 0.12, 0.02] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 10, 10],
  },
  // Abdomen
  abdomen: {
    position: [0, 0.26, 0.01] as [number, number, number],
    scale: [0.18, 0.10, 0.10] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 12, 12],
  },
  // Lower abdomen
  lowerAbdomen: {
    position: [0, 0.16, 0.02] as [number, number, number],
    scale: [0.16, 0.08, 0.09] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 12, 12],
  },
  // Pelvis
  pelvis: {
    position: [0, 0.02, 0] as [number, number, number],
    scale: [0.28, 0.10, 0.14] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 16, 16],
  },
  // Left hip bone (iliac crest)
  leftHip: {
    position: [-0.18, 0.06, 0] as [number, number, number],
    rotation: [0.1, 0.2, 0.3] as [number, number, number],
    scale: [0.08, 0.06, 0.06] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 10, 10],
  },
  // Right hip bone
  rightHip: {
    position: [0.18, 0.06, 0] as [number, number, number],
    rotation: [0.1, -0.2, -0.3] as [number, number, number],
    scale: [0.08, 0.06, 0.06] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 10, 10],
  },

  // === HEAD AND NECK ===
  // Skull - main cranium
  skull: {
    position: [0, 0.88, -0.01] as [number, number, number],
    scale: [0.10, 0.11, 0.11] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 16, 16],
  },
  // Face
  face: {
    position: [0, 0.82, 0.04] as [number, number, number],
    scale: [0.08, 0.09, 0.07] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 14, 14],
  },
  // Jaw / chin
  jaw: {
    position: [0, 0.76, 0.05] as [number, number, number],
    scale: [0.06, 0.04, 0.05] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 12, 12],
  },
  // Nose
  nose: {
    position: [0, 0.82, 0.10] as [number, number, number],
    rotation: [0.3, 0, 0] as [number, number, number],
    scale: [0.015, 0.025, 0.02] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  // Left ear
  leftEar: {
    position: [-0.10, 0.84, 0] as [number, number, number],
    scale: [0.015, 0.03, 0.02] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 8, 8],
  },
  // Right ear
  rightEar: {
    position: [0.10, 0.84, 0] as [number, number, number],
    scale: [0.015, 0.03, 0.02] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 8, 8],
  },
  // Neck - cylinder connecting head to shoulders
  neck: {
    position: [0, 0.70, 0] as [number, number, number],
    scale: [0.055, 0.06, 0.05] as [number, number, number],
    type: 'cylinder' as const,
    args: [1, 1, 1, 16],
  },
  // Adam's apple / throat
  throat: {
    position: [0, 0.70, 0.04] as [number, number, number],
    scale: [0.02, 0.025, 0.015] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 8, 8],
  },

  // === ARMS (by sides) ===
  // Left shoulder joint
  leftShoulderJoint: {
    position: [-0.30, 0.60, 0] as [number, number, number],
    scale: [0.04, 0.035, 0.035] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 12, 12],
  },
  // Right shoulder joint
  rightShoulderJoint: {
    position: [0.30, 0.60, 0] as [number, number, number],
    scale: [0.04, 0.035, 0.035] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 12, 12],
  },
  // Left upper arm (hanging by side)
  leftUpperArm: {
    position: [-0.31, 0.44, 0] as [number, number, number],
    rotation: [0, 0, 0.03] as [number, number, number],
    scale: [0.045, 0.15, 0.045] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 8, 16],
  },
  // Right upper arm
  rightUpperArm: {
    position: [0.31, 0.44, 0] as [number, number, number],
    rotation: [0, 0, -0.03] as [number, number, number],
    scale: [0.045, 0.15, 0.045] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 8, 16],
  },
  // Left elbow
  leftElbow: {
    position: [-0.31, 0.30, -0.01] as [number, number, number],
    scale: [0.028, 0.025, 0.025] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 10, 10],
  },
  // Right elbow
  rightElbow: {
    position: [0.31, 0.30, -0.01] as [number, number, number],
    scale: [0.028, 0.025, 0.025] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 10, 10],
  },
  // Left lower arm
  leftLowerArm: {
    position: [-0.31, 0.15, 0] as [number, number, number],
    rotation: [0, 0, 0.02] as [number, number, number],
    scale: [0.035, 0.14, 0.035] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 8, 16],
  },
  // Right lower arm
  rightLowerArm: {
    position: [0.31, 0.15, 0] as [number, number, number],
    rotation: [0, 0, -0.02] as [number, number, number],
    scale: [0.035, 0.14, 0.035] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 8, 16],
  },
  // Left wrist
  leftWrist: {
    position: [-0.31, 0.01, 0] as [number, number, number],
    scale: [0.022, 0.018, 0.015] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 8, 8],
  },
  // Right wrist
  rightWrist: {
    position: [0.31, 0.01, 0] as [number, number, number],
    scale: [0.022, 0.018, 0.015] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 8, 8],
  },

  // === LEFT HAND ===
  leftPalm: {
    position: [-0.31, -0.05, 0.01] as [number, number, number],
    scale: [0.035, 0.04, 0.015] as [number, number, number],
    type: 'box' as const,
    args: [1, 1, 1],
  },
  leftThumb: {
    position: [-0.28, -0.04, 0.02] as [number, number, number],
    rotation: [0.2, 0.5, 0.3] as [number, number, number],
    scale: [0.012, 0.03, 0.01] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  leftIndexFinger: {
    position: [-0.295, -0.10, 0.01] as [number, number, number],
    scale: [0.008, 0.03, 0.008] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  leftMiddleFinger: {
    position: [-0.31, -0.105, 0.01] as [number, number, number],
    scale: [0.008, 0.032, 0.008] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  leftRingFinger: {
    position: [-0.325, -0.10, 0.01] as [number, number, number],
    scale: [0.008, 0.028, 0.008] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  leftPinkyFinger: {
    position: [-0.34, -0.09, 0.01] as [number, number, number],
    scale: [0.007, 0.022, 0.007] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },

  // === RIGHT HAND ===
  rightPalm: {
    position: [0.31, -0.05, 0.01] as [number, number, number],
    scale: [0.035, 0.04, 0.015] as [number, number, number],
    type: 'box' as const,
    args: [1, 1, 1],
  },
  rightThumb: {
    position: [0.28, -0.04, 0.02] as [number, number, number],
    rotation: [0.2, -0.5, -0.3] as [number, number, number],
    scale: [0.012, 0.03, 0.01] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  rightIndexFinger: {
    position: [0.295, -0.10, 0.01] as [number, number, number],
    scale: [0.008, 0.03, 0.008] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  rightMiddleFinger: {
    position: [0.31, -0.105, 0.01] as [number, number, number],
    scale: [0.008, 0.032, 0.008] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  rightRingFinger: {
    position: [0.325, -0.10, 0.01] as [number, number, number],
    scale: [0.008, 0.028, 0.008] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  rightPinkyFinger: {
    position: [0.34, -0.09, 0.01] as [number, number, number],
    scale: [0.007, 0.022, 0.007] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },

  // === LEGS ===
  // Left upper leg (tapered - wider at hip, narrower at knee)
  leftUpperLeg: {
    position: [-0.14, -0.20, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
    type: 'cylinder' as const,
    args: [0.055, 0.09, 0.32, 16],
  },
  // Right upper leg (tapered)
  rightUpperLeg: {
    position: [0.14, -0.20, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
    type: 'cylinder' as const,
    args: [0.055, 0.09, 0.32, 16],
  },
  // Left kneecap (patella)
  leftKneecap: {
    position: [-0.14, -0.38, 0.055] as [number, number, number],
    scale: [0.035, 0.04, 0.025] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 10, 10],
  },
  // Right kneecap (patella)
  rightKneecap: {
    position: [0.14, -0.38, 0.055] as [number, number, number],
    scale: [0.035, 0.04, 0.025] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 10, 10],
  },
  // Left lower leg (tapered - wider at knee, thinner at ankle)
  leftLowerLeg: {
    position: [-0.14, -0.56, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
    type: 'cylinder' as const,
    args: [0.03, 0.055, 0.28, 16],
  },
  // Right lower leg (tapered)
  rightLowerLeg: {
    position: [0.14, -0.56, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
    type: 'cylinder' as const,
    args: [0.03, 0.055, 0.28, 16],
  },
  // === LEFT FOOT ===
  // Heel (calcaneus) - prominent rounded back
  leftHeel: {
    position: [-0.14, -0.73, -0.04] as [number, number, number],
    scale: [0.04, 0.035, 0.045] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 12, 12],
  },
  // Mid-foot (navicular/cuboid area) - creates the arch
  leftMidfoot: {
    position: [-0.14, -0.71, 0.02] as [number, number, number],
    rotation: [-0.2, 0, 0] as [number, number, number],
    scale: [0.04, 0.025, 0.05] as [number, number, number],
    type: 'box' as const,
    args: [1, 1, 1],
  },
  // Ball of foot (metatarsal heads) - wider, weight-bearing
  leftBallOfFoot: {
    position: [-0.14, -0.735, 0.07] as [number, number, number],
    scale: [0.05, 0.02, 0.035] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 12, 12],
  },
  // Top of foot (dorsum) - slopes down from ankle
  leftDorsum: {
    position: [-0.14, -0.70, 0.03] as [number, number, number],
    rotation: [0.4, 0, 0] as [number, number, number],
    scale: [0.035, 0.015, 0.07] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 0.5, 8, 12],
  },
  // Big toe
  leftBigToe: {
    position: [-0.11, -0.74, 0.115] as [number, number, number],
    rotation: [0.1, 0.1, 0] as [number, number, number],
    scale: [0.018, 0.015, 0.025] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  // Second toe
  leftToe2: {
    position: [-0.125, -0.74, 0.12] as [number, number, number],
    scale: [0.012, 0.012, 0.022] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  // Third toe
  leftToe3: {
    position: [-0.14, -0.74, 0.12] as [number, number, number],
    scale: [0.011, 0.011, 0.02] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  // Fourth toe
  leftToe4: {
    position: [-0.155, -0.74, 0.115] as [number, number, number],
    scale: [0.01, 0.01, 0.018] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  // Pinky toe
  leftToe5: {
    position: [-0.168, -0.74, 0.105] as [number, number, number],
    scale: [0.009, 0.009, 0.014] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  // Inner ankle bone (medial malleolus)
  leftAnkleInner: {
    position: [-0.105, -0.70, -0.01] as [number, number, number],
    scale: [0.018, 0.022, 0.016] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 8, 8],
  },
  // Outer ankle bone (lateral malleolus) - slightly lower
  leftAnkleOuter: {
    position: [-0.175, -0.705, -0.01] as [number, number, number],
    scale: [0.015, 0.02, 0.014] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 8, 8],
  },

  // === RIGHT FOOT ===
  // Heel (calcaneus)
  rightHeel: {
    position: [0.14, -0.73, -0.04] as [number, number, number],
    scale: [0.04, 0.035, 0.045] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 12, 12],
  },
  // Mid-foot
  rightMidfoot: {
    position: [0.14, -0.71, 0.02] as [number, number, number],
    rotation: [-0.2, 0, 0] as [number, number, number],
    scale: [0.04, 0.025, 0.05] as [number, number, number],
    type: 'box' as const,
    args: [1, 1, 1],
  },
  // Ball of foot
  rightBallOfFoot: {
    position: [0.14, -0.735, 0.07] as [number, number, number],
    scale: [0.05, 0.02, 0.035] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 12, 12],
  },
  // Top of foot (dorsum)
  rightDorsum: {
    position: [0.14, -0.70, 0.03] as [number, number, number],
    rotation: [0.4, 0, 0] as [number, number, number],
    scale: [0.035, 0.015, 0.07] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 0.5, 8, 12],
  },
  // Big toe
  rightBigToe: {
    position: [0.11, -0.74, 0.115] as [number, number, number],
    rotation: [0.1, -0.1, 0] as [number, number, number],
    scale: [0.018, 0.015, 0.025] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  // Second toe
  rightToe2: {
    position: [0.125, -0.74, 0.12] as [number, number, number],
    scale: [0.012, 0.012, 0.022] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  // Third toe
  rightToe3: {
    position: [0.14, -0.74, 0.12] as [number, number, number],
    scale: [0.011, 0.011, 0.02] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  // Fourth toe
  rightToe4: {
    position: [0.155, -0.74, 0.115] as [number, number, number],
    scale: [0.01, 0.01, 0.018] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  // Pinky toe
  rightToe5: {
    position: [0.168, -0.74, 0.105] as [number, number, number],
    scale: [0.009, 0.009, 0.014] as [number, number, number],
    type: 'capsule' as const,
    args: [1, 1, 6, 8],
  },
  // Inner ankle bone (medial malleolus)
  rightAnkleInner: {
    position: [0.105, -0.70, -0.01] as [number, number, number],
    scale: [0.018, 0.022, 0.016] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 8, 8],
  },
  // Outer ankle bone (lateral malleolus)
  rightAnkleOuter: {
    position: [0.175, -0.705, -0.01] as [number, number, number],
    scale: [0.015, 0.02, 0.014] as [number, number, number],
    type: 'sphere' as const,
    args: [1, 8, 8],
  },
};
