'use client';

import { useEffect, useState } from 'react';
import {Canvas} from '@react-three/fiber';
import { useProjectStore } from './store/useProjectStore';
import ProjectStateViewer from './components/ProjectStateViewer';
import DefaultSceneBackdrop from './components/DefaultSceneBackdrop';
import ProjectParts from './components/ProjectParts';
import { loadProjectFile } from './utils/fileLoader';
import ViewportShadingSelector from "@/app/components/ViewportShadingSelector";
import {SimpleVoxelGrid} from "@/app/utils/simpleVoxelGrid";
import VoxelViewer from "@/app/components/VoxelViewer";

export default function Home() {
  const loadProject = useProjectStore(state => state.loadProject);
  const setVoxelGrid = useProjectStore(state => state.setVoxelGrid);
  const project = useProjectStore(state => state.project);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  const loadDefaultProject = async () => {
    if (isLoadingProject || project) return;
    
    setIsLoadingProject(true);
    try {
      // Load our default file.
      const loadedProject = await loadProjectFile('/new-project.glb');
      const _voxelGrid = new SimpleVoxelGrid(loadedProject.sceneRoot);
      loadProject(loadedProject.name, loadedProject.parts);
      setVoxelGrid(_voxelGrid);
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

  const acceptedFileTypes = ['.stl', '.obj', '.glb'];
  
  const isValidFileType = (fileName: string) => {
    const extension = fileName.toLowerCase();
    return acceptedFileTypes.some(type => extension.endsWith(type));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (!file || !isValidFileType(file.name)) {
      console.warn('Invalid file type. Please drop a .stl, .obj, or .glb file.');
      return;
    }

    setIsLoadingProject(true);
    try {
      // Pass the actual File object instead of blob URL to preserve file extension
      const loadedProject = await loadProjectFile(file);
      
      // Use the original file name for the project
      const projectName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      loadProject(projectName, loadedProject.parts);
      const _voxelGrid = new SimpleVoxelGrid(loadedProject.sceneRoot);
      setVoxelGrid(_voxelGrid);

      console.log(`Successfully loaded project: ${projectName}`);
    } catch (error) {
      console.error('Failed to load dropped file:', error);
    } finally {
      setIsLoadingProject(false);
    }
  };
  
  return (
    <div className="flex w-full h-screen bg-gray-100"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 3D Canvas */}
      <div className="flex-3 relative">
        <Canvas
          camera={{ position: [5, 5, 5], fov: 60 }}
          shadows
          style={{ background: '#f8fafc' }}
        >
          <DefaultSceneBackdrop />
          <ProjectParts />

          {project?.voxelGrid && <VoxelViewer voxelGrid={project.voxelGrid}/>}
        </Canvas>

        <ViewportShadingSelector/>
      </div>

      {/* Sidebar */}
      <div className="flex-1">
        <ProjectStateViewer />
      </div>

      {/* Loading Overlay */}
      {isLoadingProject && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-gray-700">Loading 3D model...</p>
          </div>
        </div>
      )}
    </div>
  );
}
