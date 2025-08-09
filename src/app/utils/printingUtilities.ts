import { Vector3, Object3D, Mesh, BufferGeometry } from 'three';

/**
 * Extract keyframes from Object3D by getting all vertex world positions
 * Merges vertices that are within epsilon distance of each other
 * @param object3D Object3D to extract vertices from (traverses all meshes)
 * @param delta Minimum distance between keyframes (default: 0.001)
 * @returns Array of Vector3 keyframes in world space
 */
export function getKeyframesFromObject3D(
  object3D: Object3D,
  delta: number = 0.001
): Vector3[] {
  const allVertices: Vector3[] = [];
  
  // Ensure all world matrices are up to date
  object3D.updateMatrixWorld(true);
  
  let totalVertices = 0;
  let meshCount = 0;
  
  // Traverse all meshes in the object and collect all vertices
  object3D.traverse((child) => {
    if (child instanceof Mesh && child.geometry) {
      meshCount++;
      const geometry = child.geometry as BufferGeometry;
      const positionAttribute = geometry.getAttribute('position');
      
      if (!positionAttribute) {
        console.warn('getKeyframesFromObject3D: No position attribute found in mesh geometry');
        return;
      }
      
      const vertexCount = positionAttribute.count;
      totalVertices += vertexCount;
      
      console.log(`Mesh ${meshCount}: ${child.name || 'unnamed'} has ${vertexCount} vertices`);
      
      for (let i = 0; i < vertexCount; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        
        // Create vertex in local space
        const vertex = new Vector3(x, y, z);
        
        // Transform to world space using the mesh's world matrix
        vertex.applyMatrix4(child.matrixWorld);
        
        allVertices.push(vertex);
      }
    }
  });
  
  // Merge vertices that are within epsilon distance
  const mergedKeyframes: Vector3[] = [];
  
  for (const vertex of allVertices) {
    let shouldAdd = true;
    
    // Check if this vertex is too close to any existing keyframe
    for (const existingKeyframe of mergedKeyframes) {
      if (vertex.distanceTo(existingKeyframe) < delta) {
        shouldAdd = false;
        break;
      }
    }
    
    if (shouldAdd) {
      mergedKeyframes.push(vertex.clone());
    }
  }
  
  console.log(`Found ${meshCount} meshes with ${totalVertices} total vertices, merged to ${mergedKeyframes.length} keyframes (epsilon: ${delta})`);
  return mergedKeyframes;
}