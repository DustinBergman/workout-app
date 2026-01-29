import { FC, useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Card } from '../ui';
import { muscleGroups, createGeometry, bodyFrameConfig } from './muscleModel';
import { PieChartDataItem } from './MuscleGroupChart';

interface MuscleBodyMap3DProps {
  muscleData: PieChartDataItem[];
}

interface SelectedMuscle {
  name: string;
  sets: number;
  percentage: number;
}

// Heat map color based on intensity - red scale
const getHeatColor = (percentage: number, maxPercentage: number): string => {
  if (percentage === 0 || maxPercentage === 0) return '#404040'; // gray - not worked
  const intensity = percentage / maxPercentage;
  // Scale from very light (almost white) to bright red
  // Low = light pink/salmon, High = vivid red
  const r = 255; // Keep red channel at max
  const g = Math.round(240 - intensity * 240); // 240 -> 0
  const b = Math.round(240 - intensity * 240); // 240 -> 0
  return `rgb(${r}, ${g}, ${b})`;
};

// Get emissive intensity based on workout intensity
const getEmissiveIntensity = (percentage: number, maxPercentage: number): number => {
  if (percentage === 0 || maxPercentage === 0) return 0;
  const intensity = percentage / maxPercentage;
  return intensity * 0.3;
};

interface MuscleGroupMeshProps {
  config: (typeof muscleGroups)[number];
  color: string;
  emissiveIntensity: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

const MuscleGroupMesh: FC<MuscleGroupMeshProps> = ({
  config,
  color,
  emissiveIntensity,
  isSelected,
  isHovered,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create geometries once
  const geometries = useMemo(() => {
    return config.geometries.map((geo) => createGeometry(geo.type, geo.args));
  }, [config.geometries]);

  // Scale effect for selection/hover
  const scale = isSelected ? 1.08 : isHovered ? 1.04 : 1;

  return (
    <group ref={groupRef} scale={scale}>
      {config.geometries.map((geo, index) => (
        <mesh
          key={`${config.id}-${index}`}
          position={geo.position}
          rotation={geo.rotation ? new THREE.Euler(...geo.rotation) : undefined}
          scale={geo.scale}
          geometry={geometries[index]}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            onPointerOver();
          }}
          onPointerOut={onPointerOut}
        >
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={emissiveIntensity + (isHovered ? 0.15 : 0) + (isSelected ? 0.2 : 0)}
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
};

interface BodyFrameProps {
  isDarkMode: boolean;
}

const BodyFrame: FC<BodyFrameProps> = ({ isDarkMode }) => {
  const frameColor = isDarkMode ? '#2a2a2a' : '#e5e5e5';
  const opacity = 0.4;

  const renderPart = (
    partConfig: (typeof bodyFrameConfig)[keyof typeof bodyFrameConfig],
    key: string
  ) => {
    const geometry = createGeometry(partConfig.type, partConfig.args);
    return (
      <mesh
        key={key}
        position={partConfig.position}
        rotation={
          'rotation' in partConfig && partConfig.rotation
            ? new THREE.Euler(...partConfig.rotation)
            : undefined
        }
        scale={partConfig.scale}
        geometry={geometry}
      >
        <meshStandardMaterial
          color={frameColor}
          transparent
          opacity={opacity}
          roughness={0.8}
          metalness={0}
        />
      </mesh>
    );
  };

  return (
    <group>
      {Object.entries(bodyFrameConfig).map(([key, config]) => renderPart(config, key))}
    </group>
  );
};

interface HumanBodyProps {
  muscleDataMap: Map<string, { sets: number; percentage: number }>;
  maxPercentage: number;
  selectedMuscle: string | null;
  hoveredMuscle: string | null;
  onMuscleClick: (id: string, name: string) => void;
  onMuscleHover: (id: string | null) => void;
  isDarkMode: boolean;
  autoRotate: boolean;
}

const HumanBody: FC<HumanBodyProps> = ({
  muscleDataMap,
  maxPercentage,
  selectedMuscle,
  hoveredMuscle,
  onMuscleClick,
  onMuscleHover,
  isDarkMode,
  autoRotate,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const rotationRef = useRef(0);

  // Auto-rotation
  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      rotationRef.current += delta * 0.3;
      groupRef.current.rotation.y = rotationRef.current;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body frame for context */}
      <BodyFrame isDarkMode={isDarkMode} />

      {/* Muscle groups */}
      {muscleGroups.map((muscle) => {
        const data = muscleDataMap.get(muscle.id);
        const percentage = data?.percentage || 0;
        const color = getHeatColor(percentage, maxPercentage);
        const emissiveIntensity = getEmissiveIntensity(percentage, maxPercentage);

        return (
          <MuscleGroupMesh
            key={muscle.id}
            config={muscle}
            color={color}
            emissiveIntensity={emissiveIntensity}
            isSelected={selectedMuscle === muscle.id}
            isHovered={hoveredMuscle === muscle.id}
            onClick={() => onMuscleClick(muscle.id, muscle.name)}
            onPointerOver={() => onMuscleHover(muscle.id)}
            onPointerOut={() => onMuscleHover(null)}
          />
        );
      })}
    </group>
  );
};

export const MuscleBodyMap3D: FC<MuscleBodyMap3DProps> = ({ muscleData }) => {
  const [selectedMuscle, setSelectedMuscle] = useState<SelectedMuscle | null>(null);
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Create a map of muscle data by lowercase name for easy lookup
  const muscleDataMap = useMemo(() => {
    const map = new Map<string, { sets: number; percentage: number }>();
    muscleData.forEach((item) => {
      map.set(item.name.toLowerCase(), {
        sets: item.value,
        percentage: item.percentage,
      });
    });
    return map;
  }, [muscleData]);

  // Calculate max percentage for normalization
  const maxPercentage = useMemo(() => {
    return Math.max(...muscleData.map((item) => item.percentage), 1);
  }, [muscleData]);

  // Handle muscle click
  const handleMuscleClick = (muscleId: string, muscleName: string) => {
    const data = muscleDataMap.get(muscleId);
    if (data && data.sets > 0) {
      setSelectedMuscle({
        name: muscleName,
        sets: data.sets,
        percentage: data.percentage,
      });
    } else {
      setSelectedMuscle(null);
    }
  };

  // Handle hover
  const handleMuscleHover = (muscleId: string | null) => {
    setHoveredMuscle(muscleId);
  };

  // Handle canvas click (deselect)
  const handleCanvasClick = () => {
    setSelectedMuscle(null);
  };

  // Pause auto-rotate during interaction
  const handleInteractionStart = () => {
    setAutoRotate(false);
  };

  const handleInteractionEnd = () => {
    // Resume auto-rotate after a delay
    setTimeout(() => setAutoRotate(true), 2000);
  };

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Muscle Map</h2>
      </div>

      {/* Selected muscle info */}
      {selectedMuscle && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: getHeatColor(selectedMuscle.percentage, maxPercentage),
              }}
            />
            <span className="font-medium text-foreground">{selectedMuscle.name}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedMuscle.sets} sets ({selectedMuscle.percentage.toFixed(1)}%)
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <div
        className="w-full h-[320px] rounded-lg overflow-hidden"
        style={{
          background: isDarkMode
            ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
        }}
      >
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Loading 3D model...
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 0.2, 2.2], fov: 45 }}
            onClick={handleCanvasClick}
            gl={{ antialias: true }}
          >
            {/* Lighting */}
            <ambientLight intensity={isDarkMode ? 0.4 : 0.6} />
            <directionalLight position={[5, 5, 5]} intensity={isDarkMode ? 0.6 : 0.8} />
            <directionalLight position={[-5, 3, -5]} intensity={0.3} />
            <pointLight position={[0, 2, 2]} intensity={0.4} />

            {/* Human body model */}
            <HumanBody
              muscleDataMap={muscleDataMap}
              maxPercentage={maxPercentage}
              selectedMuscle={selectedMuscle?.name.toLowerCase() || null}
              hoveredMuscle={hoveredMuscle}
              onMuscleClick={handleMuscleClick}
              onMuscleHover={handleMuscleHover}
              isDarkMode={isDarkMode}
              autoRotate={autoRotate}
            />

            {/* Controls */}
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={(3 * Math.PI) / 4}
              onStart={handleInteractionStart}
              onEnd={handleInteractionEnd}
            />
          </Canvas>
        </Suspense>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#404040]" />
          <span>None</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(255, 220, 220)' }} />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(226, 147, 147)' }} />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(182, 55, 55)' }} />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(139, 0, 0)' }} />
          <span>Max</span>
        </div>
      </div>

      {/* Interaction hint */}
      <p className="text-center text-xs text-muted-foreground mt-2">
        Drag to rotate - Tap a muscle for details
      </p>
    </Card>
  );
};
