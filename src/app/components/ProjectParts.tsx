'use client';

import { useMemo, useRef } from 'react';
import { MeshStandardMaterial, MeshBasicMaterial, Material, Color, Mesh } from 'three';
import { useProjectStore } from '../store/useProjectStore';
import { useViewerStore } from '../store/useViewerStore';
import VoxelViewer from './VoxelViewer';
import { createHeatmapMaterial } from '../utils/meshHeatmap';

export default function ProjectParts() {
  const project = useProjectStore(state => state.project);
  const parts = project?.parts || [];
  const viewMode = useViewerStore(state => state.viewMode);
  const selectedPartId = useViewerStore(state => state.selectedPartId);
  const showStressData = useViewerStore(state => state.showStressData);
  const stressDataViewMode = useViewerStore(state => state.stressDataViewMode);

  const getMaterialForViewMode = useMemo(() => {
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

    return (originalMaterial: Material | Material[] | undefined, isSelected: boolean, mesh?: Mesh): Material | Material[] => {
      // If stress data is enabled and in vertex shading mode, use heatmap material
      if (showStressData && stressDataViewMode === 'vertex_shading' && project?.voxelGrid && mesh) {
        const heatmapMaterial = createHeatmapMaterial(mesh, project.voxelGrid);
        
        // If selected, add emissive glow to the heatmap material
        if (isSelected) {
          heatmapMaterial.emissive = new Color('#ff6b35');
          heatmapMaterial.emissiveIntensity = 0.3;
        }
        
        return heatmapMaterial;
      }

      const baseColor = extractColor(originalMaterial);
      const selectedColor = isSelected ? '#ff6b35' : baseColor; // Orange highlight for selected parts
      
      switch (viewMode) {
        case 'wireframe':
          return new MeshBasicMaterial({
            color: selectedColor,
            wireframe: true,
            transparent: true,
            opacity: isSelected ? 1.0 : 0.8
          });
        
        case 'flat':
          return new MeshBasicMaterial({
            color: selectedColor
          });
        
        case 'textured':
        default:
          if (isSelected) {
            // For selected parts in textured mode, add an emissive glow
            return new MeshStandardMaterial({
              color: baseColor,
              emissive: new Color('#ff6b35'),
              emissiveIntensity: 0.3
            });
          }
          return originalMaterial || new MeshStandardMaterial({ color: baseColor });
      }
    };
  }, [viewMode, showStressData, stressDataViewMode, project?.voxelGrid]);

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
              if (mesh && showStressData && stressDataViewMode === 'vertex_shading' && project?.voxelGrid) {
                // Update material when mesh is available and stress data conditions are met
                mesh.material = getMaterialForViewMode(part.material, isSelected, mesh);
              } else if (mesh) {
                // Use normal material when stress data is not enabled
                mesh.material = getMaterialForViewMode(part.material, isSelected);
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