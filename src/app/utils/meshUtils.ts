import {Box3, Object3D, Vector3, Mesh} from "three";

export interface Face {
  vertices: [Vector3, Vector3, Vector3];
  bounds: Box3;
}

/**
 * Given the root object in a Three.js scene, get a list of all faces in the scene.
 * All values returned are in world space.
 * @param rootObject3D
 */
export function getSceneFaceList(rootObject3D: Object3D): Face[] {
  const faces: Face[] = [];
  
  // Traverse the entire scene hierarchy
  rootObject3D.traverse((object: Object3D) => {
    if (object instanceof Mesh) {
      const mesh = object as Mesh;
      const geometry = mesh.geometry;
      const index = geometry.getIndex();
      
      // Get position attribute
      const positionAttribute = geometry.getAttribute('position');
      if (!positionAttribute || !index) return;
      
      // Create temporary vectors for calculations
      const worldPosition = new Vector3();
      const localPosition = new Vector3();
      
      // Iterate through all triangular faces
      for (let i = 0; i < index.count; i += 3) {
        const a = index.getX(i);
        const b = index.getX(i + 1);
        const c = index.getX(i + 2);
        
        // Get world positions for each vertex of the face
        const vertexA = localPosition.fromBufferAttribute(positionAttribute, a);
        worldPosition.copy(vertexA);
        mesh.localToWorld(worldPosition);
        const worldVertexA = worldPosition.clone();
        
        const vertexB = localPosition.fromBufferAttribute(positionAttribute, b);
        worldPosition.copy(vertexB);
        mesh.localToWorld(worldPosition);
        const worldVertexB = worldPosition.clone();
        
        const vertexC = localPosition.fromBufferAttribute(positionAttribute, c);
        worldPosition.copy(vertexC);
        mesh.localToWorld(worldPosition);
        const worldVertexC = worldPosition.clone();
        
        // Create face vertices array
        const vertices: [Vector3, Vector3, Vector3] = [worldVertexA, worldVertexB, worldVertexC];
        
        // Calculate bounding box for this face
        const bounds = new Box3().setFromPoints(vertices);
        
        // Create face object
        const face: Face = {
          vertices,
          bounds
        };
        
        faces.push(face);
      }
    }
  });
  
  return faces;
}