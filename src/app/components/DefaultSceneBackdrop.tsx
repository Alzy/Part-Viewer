'use client';

import { Grid, OrbitControls } from '@react-three/drei';

export default function DefaultSceneBackdrop() {
  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={3}
        castShadow
      />
      <directionalLight
        position={[-10, -10, -5]}
        intensity={1}
      />
      
      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#d1d5db"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9ca3af"
        fadeDistance={25}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />
      
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={20}
      />
    </>
  );
}