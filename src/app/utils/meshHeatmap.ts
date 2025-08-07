import {
  BufferAttribute, BufferGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from "three";
import type { SimpleVoxelGrid } from "./simpleVoxelGrid";

export function createHeatmapMaterial(
  mesh: Mesh,
  voxelGrid: SimpleVoxelGrid
): { material: MeshBasicMaterial; geometry: BufferGeometry } {
  // Clone the geometry to avoid modifying the original
  const geometry = mesh.geometry.index
    ? mesh.geometry.toNonIndexed()
    : mesh.geometry.clone();

  const pos = geometry.getAttribute("position");
  const vertCount = pos.count;
  
  const stats = voxelGrid.getVoxelGridStats();
  const min = stats.min || 0;
  const max = stats.max || 1;
  const denom = Math.max(1e-6, max - min);

  const pLocal = new Vector3();
  const pWorld = new Vector3();
  const color = new Color();

  const hslFromNormalized = (t: number) => {
    const h = (1.0 - t) * 240.0 / 360.0; // blue -> red
    color.setHSL(h, 1.0, 0.5);
    return color;
  };

  const colorArray = [];
  for (let i = 0; i < vertCount; i++) {
    pLocal.fromBufferAttribute(pos as BufferAttribute, i);
    pWorld.copy(pLocal).applyMatrix4(mesh.matrixWorld);

    const value = voxelGrid.getVoxelValue(pWorld);
    
    let t = 0;
    if (max > min && value > 0) {
      t = (value - min) / denom;
      t = Math.min(Math.max(t, 0), 1);
    } else if (value > 0) {
      // If all values are the same, show them as mid-range
      t = 0.5;
    }
    // If value is 0, t remains 0 (blue)

    const color = hslFromNormalized(t);
    colorArray.push(color.r, color.g, color.b);
  }

  // Create color attribute following the THREE.js example pattern
  const colorAttribute = new BufferAttribute(new Float32Array(colorArray), 3);
  geometry.setAttribute('color', colorAttribute);

  return {
    material: new MeshBasicMaterial({ vertexColors: true }),
    geometry: geometry
  };
}
