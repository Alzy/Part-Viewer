'use client';

import React from 'react';
import { Vector3 } from 'three';

interface Keyframe {
  target: Vector3;
  time: number;
}

interface KeyframeVisualizerProps {
  keyframes: Keyframe[];
  currentTarget?: Vector3;
  showKeyframes?: boolean;
  showCurrentTarget?: boolean;
}

const KeyframeVisualizer: React.FC<KeyframeVisualizerProps> = ({
  keyframes,
  currentTarget,
  showKeyframes = true,
  showCurrentTarget = true
}) => {
  return (
    <>
      {/* Current target visualization */}
      {showCurrentTarget && currentTarget && (
        <mesh position={currentTarget.toArray()}>
          <sphereGeometry args={[0.08]} />
          <meshBasicMaterial color="red" transparent opacity={0.7} />
        </mesh>
      )}
      
      {/* Keyframe visualization */}
      {showKeyframes && keyframes.map((keyframe, index) => (
        <mesh key={index} position={keyframe.target.toArray()}>
          <sphereGeometry args={[0.03]} />
          <meshBasicMaterial color="orange" transparent opacity={0.4} />
        </mesh>
      ))}
    </>
  );
};

export default KeyframeVisualizer;