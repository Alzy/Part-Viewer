import { Vector3 } from 'three';
import { SimpleTwoBoneIK } from '../utils/simpleTwoBoneIK';
import { usePrinterStore } from '../store/usePrinterStore';

class PrinterAnimationController {
  private state = {
    currentProgress: 0,
    currentTarget: new Vector3(),
    isInitialized: false
  };

  private ikSolver: SimpleTwoBoneIK | null = null;
  private keyframes: Vector3[] = [];
  private totalDistance = 0;

  // Called from useFrame - no React dependencies
  update(deltaTime: number) {
    const storeState = usePrinterStore.getState();
    
    // Sync configuration changes from store
    if (this.keyframes !== storeState.keyframes) {
      this.keyframes = storeState.keyframes;
      this.totalDistance = storeState.totalDistance;
    }
    
    // Only update progress if playing
    if (storeState.isPlaying && this.totalDistance > 0) {
      const progressIncrement = (storeState.speed * deltaTime) / this.totalDistance;
      this.state.currentProgress += progressIncrement;
      
      if (this.state.currentProgress >= 1.0) {
        this.state.currentProgress -= 1.0;
      }
      
      // Interpolate and solve
      this.state.currentTarget = this.interpolateKeyframes();
      if (this.ikSolver) {
        this.ikSolver.solve(this.state.currentTarget);
      }
    }
    // If paused, still update target in case progress was manually set
    else if (!storeState.isPlaying) {
      this.state.currentTarget = this.interpolateKeyframes();
      if (this.ikSolver) {
        this.ikSolver.solve(this.state.currentTarget);
      }
    }
  }

  // Global access for UI components
  getCurrentProgress(): number {
    return this.state.currentProgress;
  }

  getCurrentTarget(): Vector3 {
    return this.state.currentTarget;
  }

  setProgress(progress: number): void {
    this.state.currentProgress = Math.max(0, Math.min(1, progress));
    
    // Immediately update target and solve IK even when paused
    this.state.currentTarget = this.interpolateKeyframes();
    if (this.ikSolver) {
      this.ikSolver.solve(this.state.currentTarget);
    }
  }

  initialize(ikSolver: SimpleTwoBoneIK): void {
    this.ikSolver = ikSolver;
    this.state.isInitialized = true;
  }

  private interpolateKeyframes(): Vector3 {
    if (this.keyframes.length < 2) {
      return this.keyframes[0]?.clone() || new Vector3();
    }

    // Find current segment based on progress
    const segmentCount = this.keyframes.length - 1;
    const segmentProgress = this.state.currentProgress * segmentCount;
    const currentIndex = Math.floor(segmentProgress);
    const nextIndex = (currentIndex + 1) % this.keyframes.length;
    const t = segmentProgress - currentIndex;

    // Smooth interpolation between keyframes
    const currentKeyframe = this.keyframes[currentIndex];
    const nextKeyframe = this.keyframes[nextIndex];
    
    return currentKeyframe.clone().lerp(nextKeyframe, t);
  }
}

// Global singleton instance
export const printerAnimationController = new PrinterAnimationController();