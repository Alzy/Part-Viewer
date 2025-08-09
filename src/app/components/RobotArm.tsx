'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, SkinnedMesh, Skeleton, Vector3 } from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { SimpleTwoBoneIK } from '../utils/simpleTwoBoneIK';

export interface Keyframe {
  target: Vector3;
  time: number;
}

interface RobotArmProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  animate?: boolean;
  target?: Vector3;
  keyframes: Keyframe[];
  animationDuration?: number;
  onTargetChange?: (target: Vector3) => void;
}

const RobotArm: React.FC<RobotArmProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  animate = false,
  target,
  keyframes,
  animationDuration = 8.0,
  onTargetChange
}) => {
  const groupRef = useRef<Group>(null);
  const [ikSolver, setIkSolver] = useState<SimpleTwoBoneIK | null>(null);
  const [skeleton, setSkeleton] = useState<Skeleton | null>(null);
  
  // Load GLTF model
  const gltf = useGLTF('/robo-arm.glb');
  
  // Clone scene for rigged models
  const clonedScene = useMemo(() => {
    if (!gltf.scene) return null;
    return SkeletonUtils.clone(gltf.scene);
  }, [gltf.scene]);

  // Initialize IK solver when scene loads
  useEffect(() => {
    if (!clonedScene) return;
    
    // Find skeleton
    let foundSkeleton: Skeleton | null = null;
    clonedScene.traverse((child) => {
      if (child instanceof SkinnedMesh && child.skeleton) {
        foundSkeleton = child.skeleton;
      }
    });
    
    if (foundSkeleton) {
      setSkeleton(foundSkeleton);
      
      try {
        const solver = new SimpleTwoBoneIK(foundSkeleton, {
          rootBoneName: 'Shoulder',
          middleBoneName: 'Elbow', 
          endBoneName: 'Effector'
        });
        setIkSolver(solver);
      } catch (error) {
        console.error('Failed to initialize IK solver:', error);
      }
    }
  }, [clonedScene]);

  // Get current target from keyframes using Three.js vector utilities
  const getCurrentTarget = (elapsedTime: number): Vector3 => {
    if (target) return target;
    if (!animate) return keyframes[0].target.clone();
    
    const normalizedTime = (elapsedTime / animationDuration) % 1.0;
    
    // Find keyframes to interpolate between
    let currentIdx = 0;
    let nextIdx = 1;
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (normalizedTime >= keyframes[i].time && normalizedTime <= keyframes[i + 1].time) {
        currentIdx = i;
        nextIdx = i + 1;
        break;
      }
    }
    
    // Handle wrap-around (last to first keyframe)
    if (normalizedTime >= keyframes[keyframes.length - 1].time) {
      currentIdx = keyframes.length - 1;
      nextIdx = 0;
    }
    
    const current = keyframes[currentIdx];
    const next = keyframes[nextIdx];
    
    // Calculate interpolation factor with wrap-around handling
    const timeDiff = next.time > current.time ?
      next.time - current.time :
      (1.0 - current.time) + next.time;
    
    const timeProgress = next.time > current.time ?
      normalizedTime - current.time :
      (normalizedTime >= current.time ? normalizedTime - current.time : normalizedTime + (1.0 - current.time));
    
    const t = timeProgress / timeDiff;
    const smoothT = t * t * (3.0 - 2.0 * t); // Smoothstep
    
    // Use Three.js lerp method directly
    return current.target.clone().lerp(next.target, smoothT);
  };

  // IK solving
  useFrame((state) => {
    if (ikSolver && skeleton) {
      const targetPosition = getCurrentTarget(state.clock.elapsedTime);
      ikSolver.solve(targetPosition);
      skeleton.bones[0].updateMatrixWorld(true);
      
      // Notify parent of current target for visualization
      if (onTargetChange) {
        onTargetChange(targetPosition);
      }
    }
  });

  if (!clonedScene) return null;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <primitive object={clonedScene} />
    </group>
  );
};

useGLTF.preload('/robo-arm.glb');

export default RobotArm;