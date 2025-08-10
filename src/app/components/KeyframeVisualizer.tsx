'use client';

import React, { useState, useRef, useEffect, RefObject } from 'react';
import { Vector3, Object3D, InstancedMesh, BufferGeometry, Material, Color, DynamicDrawUsage } from 'three';
import { useFrame } from '@react-three/fiber';
import { usePrinterStore } from '../store/usePrinterStore';
import { printerAnimationController } from '../controllers/PrinterAnimationController';

interface KeyframeVisualizerProps {
  showKeyframes?: boolean;
  showCurrentTarget?: boolean;
}

const KeyframeVisualizer: React.FC<KeyframeVisualizerProps> = ({
  showKeyframes = true,
  showCurrentTarget = true
}) => {
  const [currentTarget, setCurrentTarget] = useState(new Vector3());
  const lastUpdate = useRef(0);
  
  // Refs for instanced meshes
  const keyframesMeshRef = useRef<InstancedMesh<BufferGeometry, Material | Material[]>>(null);
  
  // Get keyframes from store
  const keyframes = usePrinterStore(state => state.keyframes);
  
  // Throttled updates for visualization
  useFrame(() => {
    const now = Date.now();
    if (now - lastUpdate.current >= 50) { // 20fps for visualization
      setCurrentTarget(printerAnimationController.getCurrentTarget().clone());
      lastUpdate.current = now;
    }
  });

  // Update instanced mesh when keyframes change
  useEffect(() => {
    if (!keyframesMeshRef.current || !showKeyframes || keyframes.length === 0) return;

    const dummy = new Object3D();
    const orangeColor = new Color('orange');

    keyframes.forEach((keyframe, index) => {
      // Set position for this instance
      dummy.position.copy(keyframe);
      dummy.updateMatrix();
      keyframesMeshRef.current?.setMatrixAt(index, dummy.matrix);
      
      // Set color for this instance
      keyframesMeshRef.current?.setColorAt(index, orangeColor);
    });

    // Mark for update
    if (keyframesMeshRef.current.instanceMatrix) {
      keyframesMeshRef.current.instanceMatrix.setUsage(DynamicDrawUsage);
      keyframesMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    
    if (keyframesMeshRef.current.instanceColor) {
      keyframesMeshRef.current.instanceColor.setUsage(DynamicDrawUsage);
      keyframesMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [keyframes, showKeyframes]);

  return (
    <>
      {/* Current target visualization */}
      {showCurrentTarget && (
        <mesh position={currentTarget.toArray()}>
          <sphereGeometry args={[0.08]} />
          <meshBasicMaterial color="red" transparent opacity={0.7} />
        </mesh>
      )}
      
      {/* Keyframes visualization using instanced mesh */}
      {showKeyframes && keyframes.length > 0 && (
        <instancedMesh
          ref={keyframesMeshRef as RefObject<InstancedMesh<BufferGeometry, Material | Material[]>>}
          args={[undefined, undefined, keyframes.length]}
        >
          <sphereGeometry args={[0.03]} />
          <meshBasicMaterial transparent opacity={0.4} />
        </instancedMesh>
      )}
    </>
  );
};

export default KeyframeVisualizer;