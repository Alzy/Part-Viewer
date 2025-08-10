'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {Group, Mesh, Skeleton, SkinnedMesh} from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import {SimpleTwoBoneIK} from '../utils/simpleTwoBoneIK';
import {printerAnimationController} from '../controllers/PrinterAnimationController';

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
        printerAnimationController.initialize(solver);
      } catch (error) {
        console.error('Failed to initialize IK solver:', error);
      }
    }
  }, [clonedScene]);

  // Pure animation loop - matches R3F's internal render loop pattern
  useFrame((state, delta) => {
    if (skeleton) {
      // Update animation controller
      printerAnimationController.update(delta);
      
      // Update skeleton bones
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