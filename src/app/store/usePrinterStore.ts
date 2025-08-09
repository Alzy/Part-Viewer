import { create } from 'zustand';
import { Vector3 } from 'three';

interface PrinterStore {
  // State
  speed: number; // units per second
  currentTarget: Vector3;
  normalizedProgress: number; // 0-1 progress through keyframes
  keyframes: Vector3[];
  totalDistance: number;
  isPlaying: boolean;
  
  // Actions
  setSpeed: (speed: number) => void;
  setCurrentTarget: (target: Vector3) => void;
  setKeyframes: (keyframes: Vector3[]) => void;
  setIsPlaying: (playing: boolean) => void;
  updateProgress: (deltaTime: number) => void;
  reset: () => void;
}

const calculateTotalDistance = (keyframes: Vector3[]): number => {
  let totalDistance = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    totalDistance += keyframes[i].distanceTo(keyframes[i + 1]);
  }
  return totalDistance;
};

const defaultKeyframes = [
  new Vector3(1.2, 0.8, 0.3),
  new Vector3(0.8, 1.4, 0.5),
  new Vector3(0.2, 1.2, 0.8),
  new Vector3(-0.3, 0.9, 0.4),
  new Vector3(0.1, 0.6, -0.2),
  new Vector3(0.9, 0.7, 0.1)
];

export const usePrinterStore = create<PrinterStore>((set, get) => ({
  // State
  speed: 0.333,
  currentTarget: defaultKeyframes[0].clone(),
  normalizedProgress: 0.0,
  keyframes: defaultKeyframes,
  totalDistance: calculateTotalDistance(defaultKeyframes),
  isPlaying: false,

  // Actions
  setSpeed: (speed: number) => set({ speed }),
  
  setCurrentTarget: (target: Vector3) => {
    const state = get();
    const keyframes = state.keyframes;
    
    // Calculate normalized progress based on current target
    let normalizedProgress = 0;
    if (keyframes.length > 1) {
      // Find closest keyframe and calculate progress
      let minDistance = Infinity;
      let closestIndex = 0;
      
      for (let i = 0; i < keyframes.length; i++) {
        const distance = target.distanceTo(keyframes[i]);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = i;
        }
      }
      
      normalizedProgress = closestIndex / (keyframes.length - 1);
    }
    
    set({ currentTarget: target.clone(), normalizedProgress });
  },
  
  setKeyframes: (keyframes: Vector3[]) => {
    const currentTarget = keyframes.length > 0 ? keyframes[0].clone() : new Vector3();
    const totalDistance = calculateTotalDistance(keyframes);
    set({ keyframes, currentTarget, normalizedProgress: 0, totalDistance });
  },
  
  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
  
  updateProgress: (deltaTime: number) => {
    const state = get();
    if (!state.isPlaying || state.keyframes.length < 2) return;
    
    const keyframes = state.keyframes;
    
    // Simple linear progress increment using precomputed total distance
    const progressIncrement = (state.speed * deltaTime) / state.totalDistance;
    let newProgress = state.normalizedProgress + progressIncrement;
    
    // Handle looping
    if (newProgress >= 1.0) {
      newProgress = newProgress - 1.0;
    }
    
    // Find current segment based on progress
    const segmentCount = keyframes.length - 1;
    const segmentProgress = newProgress * segmentCount;
    const currentIndex = Math.floor(segmentProgress);
    const nextIndex = (currentIndex + 1) % keyframes.length;
    const t = segmentProgress - currentIndex;
    
    // Smooth interpolation between keyframes
    const currentKeyframe = keyframes[currentIndex];
    const nextKeyframe = keyframes[nextIndex];
    const newTarget = currentKeyframe.clone().lerp(nextKeyframe, t);
    
    set({
      normalizedProgress: newProgress,
      currentTarget: newTarget
    });
  },
  
  reset: () => {
    const keyframes = get().keyframes;
    const currentTarget = keyframes.length > 0 ? keyframes[0].clone() : new Vector3();
    const totalDistance = calculateTotalDistance(keyframes);
    set({
      normalizedProgress: 0,
      currentTarget,
      totalDistance,
      isPlaying: false
    });
  }
}));