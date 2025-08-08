'use client';

import {MeshStandardMaterial, MeshBasicMaterial, Material, Color, Mesh, BufferGeometry} from 'three';
import { useProjectStore } from '../store/useProjectStore';
import { useViewerStore } from '../store/useViewerStore';
import VoxelViewer from './VoxelViewer';
import { createHeatmapMaterial } from '../utils/meshHeatmap';

/**
 * Draws the project part tree to the Three.js Canvas.
 * Displays stress data on parts based on current stress data view.
 * @constructor
 */
export default function ProjectParts() {
  const project = useProjectStore(state => state.project);
  const parts = project?.parts || [];
  const viewMode = useViewerStore(state => state.viewMode);
  const selectedPartId = useViewerStore(state => state.selectedPartId);
  const showStressData = useViewerStore(state => state.showStressData);
  const stressDataViewMode = useViewerStore(state => state.stressDataViewMode);

  const getMaterialForViewMode = (
    originalMaterial: Material | Material[] | undefined, isSelected: boolean, mesh?: Mesh
  ): { material: Material | Material[], geometry?: BufferGeometry } => {
    const intendsToShowStressData = showStressData && stressDataViewMode === 'vertex_shading';
    const projectValidityReportDidSucceed = project?.validityReport && project.validityReport.success;
    const dataAvailable = project?.voxelGrid && mesh;

    // If stress data is enabled and in vertex shading mode, use heatmap material
    if (intendsToShowStressData && projectValidityReportDidSucceed && dataAvailable) {
      try {
        if (!project?.voxelGrid) throw new Error("Voxel Grid is not available");
        const heatmapResult = createHeatmapMaterial(mesh, project.voxelGrid);
        return { material: heatmapResult.material, geometry: heatmapResult.geometry };
      } catch (error) {
        console.warn('Failed to create heatmap material:', error);
        // Fallback to normal material if heatmap creation fails
      }
    }

    const extractColor = (material: Material | Material[] | undefined): string => {
      const defaultColor = '#026ec1';
      if (!material) return defaultColor;
      
      const targetMaterial = Array.isArray(material) ? material[0] : material;
      if (!targetMaterial) return defaultColor;
      
      // Check if material has a color property
      const color = (targetMaterial as { color?: Color }).color;
      if (!color) return defaultColor;
      
      return `#${color.getHexString()}`;
    };

    const baseColor = extractColor(originalMaterial);
    const selectedColor = isSelected ? '#ff6b35' : baseColor; // Orange highlight for selected parts
    
    switch (viewMode) {
      case 'wireframe':
        return { material: new MeshBasicMaterial({
          color: selectedColor,
          wireframe: true,
          transparent: true,
          opacity: isSelected ? 1.0 : 0.8
        }) };
      
      case 'flat':
        return { material: new MeshBasicMaterial({
          color: selectedColor
        }) };
      
      case 'textured':
      default:
        if (isSelected) {
          // For selected parts in textured mode, add an emissive glow
          return { material: new MeshStandardMaterial({
            color: baseColor,
            emissive: new Color('#ff6b35'),
            emissiveIntensity: 0.3
          }) };
        }
        return { material: originalMaterial || new MeshStandardMaterial({ color: baseColor }) };
    }
  };

  return (
    <>
      {parts.map((part) => {
        const isSelected = selectedPartId === part.id;
        return (
          <mesh
            key={part.id}
            matrix={part.matrix}
            matrixAutoUpdate={false}
            geometry={part.geometry}
            ref={(mesh) => {
              if (mesh) {
                // Ensure the matrix world is updated before creating heatmap materials
                mesh.updateMatrixWorld(true);
                
                const result = showStressData && stressDataViewMode === 'vertex_shading' && project?.voxelGrid
                  ? getMaterialForViewMode(part.material, isSelected, mesh)
                  : getMaterialForViewMode(part.material, isSelected);
                
                mesh.material = result.material;
                if (result.geometry) {
                  mesh.geometry = result.geometry;
                }
              }
            }}
          />
        );
      })}
      
      {/* Show VoxelViewer only if project has voxel grid, stress data is enabled, and view mode is voxels */}
      {project?.voxelGrid && showStressData && stressDataViewMode === 'voxels' && (
        <VoxelViewer voxelGrid={project.voxelGrid} />
      )}
    </>
  );
}