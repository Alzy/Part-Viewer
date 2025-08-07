'use client';

import { useMemo } from 'react';
import { MeshStandardMaterial, MeshBasicMaterial, Material, Color } from 'three';
import { useProjectStore } from '../store/useProjectStore';
import { useViewerStore } from '../store/useViewerStore';

export default function ProjectParts() {
  const parts = useProjectStore(state => state.project?.parts || []);
  const viewMode = useViewerStore(state => state.viewMode);

  const getMaterialForViewMode = useMemo(() => {
    const extractColor = (material: Material | Material[] | undefined): string => {
      const defaultColor = '#[026ec1';
      if (!material) return defaultColor;
      
      const targetMaterial = Array.isArray(material) ? material[0] : material;
      if (!targetMaterial) return defaultColor;
      
      // Check if material has a color property
      const color = (targetMaterial as { color?: Color }).color;
      if (!color) return defaultColor;
      
      return `#${color.getHexString()}`;
    };

    return (originalMaterial: Material | Material[] | undefined): Material | Material[] => {
      const baseColor = extractColor(originalMaterial);
      
      switch (viewMode) {
        case 'wireframe':
          return new MeshBasicMaterial({
            color: baseColor,
            wireframe: true,
            transparent: true,
            opacity: 0.8
          });
        
        case 'flat':
          return new MeshBasicMaterial({
            color: baseColor
          });
        
        case 'textured':
        default:
          return originalMaterial || new MeshStandardMaterial({ color: baseColor });
      }
    };
  }, [viewMode]);

  return (
    <>
      {parts.map((part) => (
        <mesh
          key={part.id}
          matrix={part.matrix}
          matrixAutoUpdate={false}
          geometry={part.geometry}
          material={getMaterialForViewMode(part.material)}
        />
      ))}
    </>
  );
}