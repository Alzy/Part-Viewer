'use client';

import { useEffect, useState } from 'react';
import {Canvas} from '@react-three/fiber';
import {Grid, OrbitControls} from '@react-three/drei';
import { Matrix4 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useProjectStore } from './store/useProjectStore';
import ProjectStateViewer from './components/ProjectStateViewer';

function ProjectParts() {
  const parts = useProjectStore(state => state.project?.parts || []);
  
  return (
    <>
      {parts.map((part) => (
        <mesh
          key={part.id}
          matrix={part.matrix}
          matrixAutoUpdate={false}
          geometry={part.geometry}
          material={part.material}
        />
      ))}
    </>
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
      
      <ProjectParts />
      
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
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  
  const loadDefaultProject = async () => {
    if (isLoadingProject || project) return;
    
    setIsLoadingProject(true);
    try {
      const loader = new GLTFLoader();
      
      // Load the default GLB file from public folder
      const gltf: any = await new Promise((resolve, reject) => {
        loader.load(
          '/new-project.glb',
          (gltf) => resolve(gltf),
          undefined,
          (error) => reject(error)
        );
      });
      
      // Extract parts from the GLTF scene
      const parts: Array<{id: string; name: string; matrix: Matrix4; geometry?: any; material?: any; children?: any[]}> = [];
      
      gltf.scene.traverse((child: any) => {
        if (child.isMesh) {
          parts.push({
            id: child.uuid,
            name: child.name || 'Mesh',
            matrix: child.matrix.clone(),
            geometry: child.geometry.clone(),
            material: Array.isArray(child.material)
              ? child.material.map((mat: any) => mat.clone())
              : child.material.clone(),
          });
        }
      });
      
      // If no meshes found, throw an error
      if (parts.length === 0) {
        throw new Error('No meshes found in GLB file');
      }
      
      loadProject('New Project', parts);
    } catch (error) {
      console.error('Failed to load default project:', error);
      
      loadProject('Blank Project', []);
    } finally {
      setIsLoadingProject(false);
    }
  };
  
  // Initialize project on page load
  useEffect(() => {
    loadDefaultProject();
  }, []);
  
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
