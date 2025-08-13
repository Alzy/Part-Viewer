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
import Octree from '../utils/octree/octree';
import OctreeNode from '../utils/octree/octreeNode';

interface OctreeViewerProps {
  octree: Octree;
  wireframe?: boolean;
  opacity?: number;
}

// Color palette for different depths
const DEPTH_COLORS = [
  '#ff0000', // Red - depth 0 (root)
  '#ff8000', // Orange - depth 1
  '#ffff00', // Yellow - depth 2
  '#80ff00', // Lime - depth 3
  '#00ff00', // Green - depth 4
  '#00ff80', // Spring Green - depth 5
  '#00ffff', // Cyan - depth 6
  '#0080ff', // Sky Blue - depth 7
  '#0000ff', // Blue - depth 8
  '#8000ff', // Purple - depth 9
  '#ff00ff', // Magenta - depth 10+
];

interface NodeData {
  position: Vector3;
  scale: Vector3;
  depth: number;
}

const OctreeViewer: React.FC<OctreeViewerProps> = ({ 
  octree, 
  wireframe = true, 
  opacity = 0.3 
}) => {
  const meshRef = useRef<InstancedMesh<BufferGeometry, Material | Material[]>>(null);

  // Collect all nodes for rendering
  const nodeData = useMemo(() => {
    const nodes: NodeData[] = [];
    
    octree.traverse((node: OctreeNode) => {
      const center = new Vector3();
      const size = new Vector3();
      node.bounds.getCenter(center);
      node.bounds.getSize(size);
      
      nodes.push({
        position: center,
        scale: size,
        depth: node.depth
      });
      
      return false; // Continue traversal
    }, octree.rootNode);
    
    return nodes;
  }, [octree]);

  const octreeCenter = useMemo(() => {
    return new Vector3(0, 0, 0);
  }, [octree]);

  useEffect(() => {
    if (!meshRef.current || nodeData.length === 0) return;

    const dummy = new Object3D();

    nodeData.forEach((node, index) => {
      // Set position to the center of the node's bounds
      dummy.position.copy(node.position);
      // Set scale to the actual size of the node's bounds
      dummy.scale.copy(node.scale);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(index, dummy.matrix);

      // Set color based on depth
      const colorHex = DEPTH_COLORS[node.depth % DEPTH_COLORS.length];
      const color = new Color(colorHex);
      meshRef.current?.setColorAt(index, color);
    });

    meshRef.current.instanceMatrix.setUsage(DynamicDrawUsage);
    meshRef.current.instanceColor?.setUsage(DynamicDrawUsage);
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [nodeData]);

  if (nodeData.length === 0) {
    return null;
  }

  return (
    <group position={octreeCenter}>
      <instancedMesh
        ref={meshRef as RefObject<InstancedMesh<BufferGeometry, Material | Material[]>>}
        args={[undefined, undefined, nodeData.length]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          wireframe={wireframe}
          transparent={true}
          opacity={opacity}
        />
      </instancedMesh>
    </group>
  );
};

export default OctreeViewer;