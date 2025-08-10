import { create } from 'zustand';
import { Vector3 } from 'three';

interface PrinterStore {
  isPlaying: boolean;
  speed: number; // units per second
  keyframes: Vector3[];
  
  // Configuration
  totalDistance: number;
  loopEnabled: boolean;
  
  // User Actions
  play: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
  setKeyframes: (keyframes: Vector3[]) => void;
  clearKeyframes: () => void;
  toggleLoop: () => void;
}

const calculateTotalDistance = (keyframes: Vector3[]): number => {
  let totalDistance = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    totalDistance += keyframes[i].distanceTo(keyframes[i + 1]);
  }
  return totalDistance;
};

export const usePrinterStore = create<PrinterStore>((set, get) => ({
  isPlaying: false,
  speed: 0.333,
  keyframes: [],
  
  // Configuration
  totalDistance: 0,
  loopEnabled: true,
  
  // User Actions
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setSpeed: (speed: number) => set({ speed }),
  setKeyframes: (keyframes: Vector3[]) => set({
    keyframes,
    totalDistance: calculateTotalDistance(keyframes)
  }),
  clearKeyframes: () => set({
    keyframes: [],
    totalDistance: 0,
    isPlaying: false
  }),
  toggleLoop: () => set(state => ({ loopEnabled: !state.loopEnabled }))
}));