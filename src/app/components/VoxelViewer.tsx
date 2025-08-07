import React, { RefObject, useEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  Material,
  Object3D,
  Vector3,
} from 'three';
import { SimpleVoxelGrid } from '../utils/simpleVoxelGrid';

interface VoxelViewerProps {
  voxelGrid: SimpleVoxelGrid;
}

const VoxelViewer: React.FC<VoxelViewerProps> = ({ voxelGrid }) => {
  const meshRef =
    useRef<InstancedMesh<BufferGeometry, Material | Material[]>>(null);

  // Get voxel grid statistics for heat map coloring
  const voxelStats = useMemo(() => {
    return voxelGrid.getVoxelGridStats();
  }, [voxelGrid]);

  const worldPosition = useMemo(() => {
    if (voxelGrid.worldBounds) {
      return voxelGrid.worldBounds.getCenter(new Vector3());
    }
    return voxelGrid.center || new Vector3(0, 0, 0);
  }, [voxelGrid.worldBounds, voxelGrid.center]);

  function getHeatmapColor(voxelValue: number) {
    if (voxelValue === 0) return 'blue';
    
    // Normalize based on voxel grid statistics
    const normalizedHeat = Math.min(voxelValue / voxelStats.max, 1);
    
    // Create color gradient from blue (low) to red (high)
    const h = (1.0 - normalizedHeat) * 240; // 240 = blue, 0 = red
    return `hsl(${h}, 100%, 50%)`;
  }

  const visibleOffsets = useMemo(() => {
    const offsets: number[] = [];
    const GridSizeX = voxelGrid.voxelsPerSide.x;
    const GridSizeY = voxelGrid.voxelsPerSide.y;
    const GridSizeZ = voxelGrid.voxelsPerSide.z;

    for (let z = 0; z < GridSizeZ; z++) {
      for (let y = 0; y < GridSizeY; y++) {
        for (let x = 0; x < GridSizeX; x++) {
          const offset = z * GridSizeY * GridSizeX + y * GridSizeX + x;
          if (voxelGrid.grid[offset] > 0) {
            offsets.push(offset);
          }
        }
      }
    }
    return offsets;
  }, [voxelGrid.grid, voxelGrid.voxelsPerSide]);

  useEffect(() => {
    if (!meshRef.current) return;

    const dummy = new Object3D();
    const GridSizeX = voxelGrid.voxelsPerSide.x;
    const GridSizeY = voxelGrid.voxelsPerSide.y;
    const GridSizeZ = voxelGrid.voxelsPerSide.z;

    const getPos = (index: number, size: number) =>
      voxelGrid.voxelSize * (index - (size - 1) / 2);

    visibleOffsets.forEach((offset, id) => {
      const x = offset % GridSizeX;
      const y = Math.floor((offset % (GridSizeX * GridSizeY)) / GridSizeX);
      const z = Math.floor(offset / (GridSizeX * GridSizeY));

      dummy.position.set(
        getPos(x, GridSizeX),
        getPos(y, GridSizeY),
        getPos(z, GridSizeZ),
      );
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(id, dummy.matrix);

      // Color based on voxel value using our heat map
      const voxelValue = voxelGrid.grid[offset];
      const color = new Color(getHeatmapColor(voxelValue));
      meshRef.current?.setColorAt(id, color);
    });

    meshRef.current.instanceMatrix.setUsage(DynamicDrawUsage);
    meshRef.current.instanceColor?.setUsage(DynamicDrawUsage);
    if (meshRef.current.instanceColor)
      meshRef.current.instanceColor.needsUpdate = true;
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [voxelGrid, visibleOffsets, voxelStats]);

  return (
    <group position={worldPosition}>
      <instancedMesh
        ref={
          meshRef as RefObject<
            InstancedMesh<BufferGeometry, Material | Material[]>
          >
        }
        args={[undefined, undefined, visibleOffsets.length]}
      >
        <boxGeometry
          args={[voxelGrid.voxelSize, voxelGrid.voxelSize, voxelGrid.voxelSize]}
        />
        <meshStandardMaterial opacity={0.7} transparent />
      </instancedMesh>
    </group>
  );
};

export default VoxelViewer;