'use client';

import { useEffect, useState } from 'react';
import {Canvas} from '@react-three/fiber';
import { useProjectStore } from './store/useProjectStore';
import ProjectStateViewer from './components/ProjectStateViewer';
import DefaultSceneBackdrop from './components/DefaultSceneBackdrop';
import ProjectParts from './components/ProjectParts';
import { loadProjectFile } from './utils/fileLoader';

export default function Home() {
  const loadProject = useProjectStore(state => state.loadProject);
  const project = useProjectStore(state => state.project);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  
  const loadDefaultProject = async () => {
    if (isLoadingProject || project) return;
    
    setIsLoadingProject(true);
    try {
      // Load our default file.
      const loadedProject = await loadProjectFile('/new-project.glb');
      loadProject(loadedProject.name, loadedProject.parts);
    } catch (error) {
      console.error('Failed to load default project:', error);
      loadProject('Blank Project', []); // Fallback to blank project on error
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
          <DefaultSceneBackdrop />
          <ProjectParts />
        </Canvas>
      </div>
      
      {/* Sidebar */}
      <ProjectStateViewer />
    </div>
  );
}
