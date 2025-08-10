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
  toggleLoop: () => void;
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
  isPlaying: false,
  speed: 0.333,
  keyframes: defaultKeyframes,
  
  // Configuration
  totalDistance: calculateTotalDistance(defaultKeyframes),
  loopEnabled: true,
  
  // User Actions
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setSpeed: (speed: number) => set({ speed }),
  setKeyframes: (keyframes: Vector3[]) => set({
    keyframes,
    totalDistance: calculateTotalDistance(keyframes)
  }),
  toggleLoop: () => set(state => ({ loopEnabled: !state.loopEnabled }))
}));