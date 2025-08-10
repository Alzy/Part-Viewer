'use client';

import React, { useState, useRef } from 'react';
import { Vector3 } from 'three';
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

  return (
    <>
      {/* Current target visualization */}
      {showCurrentTarget && (
        <mesh position={currentTarget.toArray()}>
          <sphereGeometry args={[0.08]} />
          <meshBasicMaterial color="red" transparent opacity={0.7} />
        </mesh>
      )}
      
      {/* Keyframe visualization */}
      {showKeyframes && keyframes.map((keyframe, index) => (
        <mesh key={index} position={keyframe.toArray()}>
          <sphereGeometry args={[0.03]} />
          <meshBasicMaterial color="orange" transparent opacity={0.4} />
        </mesh>
      ))}
    </>
  );
};

export default KeyframeVisualizer;