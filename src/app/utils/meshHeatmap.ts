import {
  BufferAttribute,
  Color,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from "three";
import type { SimpleVoxelGrid } from "./simpleVoxelGrid";

export function createHeatmapMaterial(
  mesh: Mesh,
  voxelGrid: SimpleVoxelGrid
) {
  const geometry = mesh.geometry.index
    ? mesh.geometry.toNonIndexed()
    : mesh.geometry;

  const pos = geometry.getAttribute("position");
  const vertCount = pos.count;
  const colors = new Float32Array(vertCount * 3);

  const stats = voxelGrid.getVoxelGridStats();
  const min = Math.max(0, stats.min || 0);
  const max = Math.max(1, stats.max || 1);
  const denom = Math.max(1e-6, max - min);

  const pLocal = new Vector3();
  const pWorld = new Vector3();
  const color = new Color();

  const hslFromNormalized = (t: number) => {
    const h = (1.0 - t) * 240.0 / 360.0; // blue -> red
    color.setHSL(h, 1.0, 0.5);
    return color;
  };

  for (let i = 0; i < vertCount; i++) {
    pLocal.fromBufferAttribute(pos as BufferAttribute, i);
    pWorld.copy(pLocal).applyMatrix4(mesh.matrixWorld);

    const value = voxelGrid.getVoxelValue(pWorld);
    let t = (value - min) / denom;
    if (value <= 0) t = 0;
    t = Math.min(Math.max(t, 0), 1);

    const c = hslFromNormalized(t);
    const o = i * 3;
    colors[o] = c.r;
    colors[o + 1] = c.g;
    colors[o + 2] = c.b;
  }

  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.getAttribute("color").needsUpdate = true;

  return new MeshStandardMaterial({ vertexColors: true });
}
