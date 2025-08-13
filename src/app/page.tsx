'use client';

import {useEffect, useState} from 'react';
import {Canvas} from '@react-three/fiber';
import {Object3D} from 'three';
import {useProjectStore} from './store/useProjectStore';
import ProjectStateViewer from './components/ProjectStateViewer';
import DefaultSceneBackdrop from './components/DefaultSceneBackdrop';
import ProjectParts from './components/ProjectParts';
import RobotArm from './components/RobotArm';
import KeyframeVisualizer from './components/KeyframeVisualizer';
import PrinterControls from './components/PrinterControls';
import {usePrinterStore} from './store/usePrinterStore';
import {loadProjectFile} from './utils/fileLoader';
import ViewportShadingSelector from "@/app/components/ViewportShadingSelector";
import {SimpleVoxelGrid} from "@/app/utils/simpleVoxelGrid";
import OctreeViewer from "@/app/components/OctreeViewer";
import Octree from "@/app/utils/octree/octree";

export default function Home() {
  const loadProject = useProjectStore(state => state.loadProject);
  const setVoxelGrid = useProjectStore(state => state.setVoxelGrid);
  const setOctree = useProjectStore(state => state.setOctree);
  const project = useProjectStore(state => state.project);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  
  // Get printer actions from store
  const clearKeyframes = usePrinterStore(state => state.clearKeyframes);
  const pause = usePrinterStore(state => state.pause);
  const isPlaying = usePrinterStore(state => state.isPlaying);
  
  // Get project actions
  const setPrintReady = useProjectStore(state => state.setPrintReady);

  const loadDefaultProject = async () => {
    if (isLoadingProject || project) return;
    
    setIsLoadingProject(true);
    try {
      // Clear previous keyframes and stop printing
      pause();
      clearKeyframes();
      setPrintReady(false); // Reset print readiness

      // Load our default file.
      const loadedProject = await loadProjectFile('/new-project.glb');
      const _voxelGrid = new SimpleVoxelGrid(loadedProject.sceneRoot);
      const _octree = Octree.fromThreeScene(loadedProject.sceneRoot); // Max depth of 6 for performance
      loadProject(loadedProject.name, loadedProject.parts, loadedProject.sceneRoot);
      setVoxelGrid(_voxelGrid);
      setOctree(_octree);
    } catch (error) {
      console.error('Failed to load default project:', error);
      loadProject('Blank Project', [], new Object3D()); // Fallback to blank project on error
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
      setPrintReady(false); // Reset print readiness
      // Clear previous keyframes and stop printing
      pause();
      clearKeyframes();

      // Pass the actual File object instead of blob URL to preserve file extension
      const loadedProject = await loadProjectFile(file);

      // Use the original file name for the project
      const projectName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      loadProject(projectName, loadedProject.parts, loadedProject.sceneRoot);
      const _voxelGrid = new SimpleVoxelGrid(loadedProject.sceneRoot);
      const _octree = Octree.fromThreeScene(loadedProject.sceneRoot);
      setVoxelGrid(_voxelGrid);
      setOctree(_octree);

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
          camera={{
            position: [5, 5, 10],
            fov: 60,
            near: 0.0001,
            far: 10000
          }}
          shadows
          style={{ background: '#f8fafc' }}
        >
          <DefaultSceneBackdrop />
          <ProjectParts />

          {/* Show octree visualization when project is loaded */}
          {project?.octree && (
            <OctreeViewer
              octree={project.octree}
              wireframe={true}
              opacity={0.333}
            />
          )}

          {isPlaying && <>
            <RobotArm position={[5, 0, 0]} />
            <KeyframeVisualizer
              showKeyframes={true}
              showCurrentTarget={true}
            />
          </>}
        </Canvas>

        <ViewportShadingSelector/>
        
        {/* PrinterControls - only show when printing is active */}
        {isPlaying && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-80">
              <PrinterControls />
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="flex-1 flex flex-col h-screen">
        <div className="flex-1 h-full">
          <ProjectStateViewer />
        </div>
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
