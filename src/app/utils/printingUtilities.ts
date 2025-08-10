import { Vector3, Object3D, Mesh, BufferGeometry } from 'three';

/**
 * Extract keyframes from Object3D by getting all vertex world positions
 * Merges vertices that are within delta distance of each other
 * @param object3D Object3D to extract vertices from (traverses all meshes)
 * @param delta Minimum distance between keyframes (default: 0.1)
 * @returns Array of Vector3 keyframes in world space
 */
export function getKeyframesFromObject3D(
  object3D: Object3D,
  delta: number = 0.1
): Vector3[] {
  object3D.updateMatrixWorld(true);

  const gridMap = new Map<string, Vector3>();
  let totalVertices = 0;
  let meshCount = 0;

  // Traverse all meshes in the object and collect vertices into grid
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
      for (let i = 0; i < vertexCount; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);

        // Create vertex in local space
        const vertex = new Vector3(x, y, z);

        // Transform to world space using the mesh's world matrix
        vertex.applyMatrix4(child.matrixWorld);

        // Create grid key based on delta precision
        const gridX = Math.floor(vertex.x / delta);
        const gridY = Math.floor(vertex.y / delta);
        const gridZ = Math.floor(vertex.z / delta);
        const gridKey = `${meshCount},${gridX},${gridY},${gridZ}`;

        // Only store if this grid cell is empty
        if (!gridMap.has(gridKey)) gridMap.set(gridKey, vertex);
      }
    }
  });

  const keyframes = Array.from(gridMap.values());
  console.log(`Found ${meshCount} meshes with ${totalVertices} total vertices, reduced to ${keyframes.length} keyframes (delta: ${delta})`);
  return keyframes;
}