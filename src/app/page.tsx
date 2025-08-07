'use client';

import { useEffect } from 'react';
import {Canvas} from '@react-three/fiber';
import {Grid, OrbitControls} from '@react-three/drei';
import { Matrix4 } from 'three';
import { useProjectStore } from './store/useProjectStore';
import ProjectStateViewer from './components/ProjectStateViewer';

function Cube() {
  return (
    <mesh position={[0, 1, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial 
        color="#026ec1" 
        metalness={0.3} 
        roughness={0.4} 
      />
    </mesh>
  );
}

function Scene() {
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
      
      <Cube />
      
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

export default function Home() {
  const loadProject = useProjectStore(state => state.loadProject);
  const project = useProjectStore(state => state.project);
  
  // Initialize project on page load
  useEffect(() => {
    if (!project) {
      const defaultCubePart = {
        id: 'default-cube',
        name: 'Cube',
        matrix: new Matrix4(),
      };
      
      loadProject('New Project', [defaultCubePart]);
    }
  }, [project, loadProject]);
  
  return (
    <div className="flex w-full h-screen bg-gray-100">
      {/* 3D Canvas */}
      <div className="flex-1">
        <Canvas
          camera={{ position: [5, 5, 5], fov: 60 }}
          shadows
          style={{ background: '#f8fafc' }}
        >
          <Scene />
        </Canvas>
      </div>
      
      {/* Sidebar */}
      <ProjectStateViewer />
    </div>
  );
}
