'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, SkinnedMesh, Skeleton, Vector3, Mesh } from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { SimpleTwoBoneIK } from '../utils/simpleTwoBoneIK';
import { usePrinterStore } from '../store/usePrinterStore';

interface RobotArmProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

const RobotArm: React.FC<RobotArmProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1]
}) => {
  const groupRef = useRef<Group>(null);
  const [ikSolver, setIkSolver] = useState<SimpleTwoBoneIK | null>(null);
  const [skeleton, setSkeleton] = useState<Skeleton | null>(null);
  
  // Get printer state from store
  const currentTarget = usePrinterStore(state => state.currentTarget);
  const isPlaying = usePrinterStore(state => state.isPlaying);
  const updateProgress = usePrinterStore(state => state.updateProgress);
  
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
    
    // Disable frustum culling on all meshes in the robot arm
    clonedScene.traverse((child) => {
      if (child instanceof Mesh || child instanceof SkinnedMesh) {
        child.frustumCulled = false;
      }
    });
    
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

  // IK solving and progress updates
  useFrame((state, delta) => {
    if (ikSolver && skeleton) {
      // Update printer progress if playing
      if (isPlaying) {
        updateProgress(delta);
      }
      
      // Solve IK for current target
      ikSolver.solve(currentTarget);
      skeleton.bones[0].updateMatrixWorld(true);
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