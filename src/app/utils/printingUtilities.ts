import { Vector3, BufferGeometry } from 'three';

/**
 * Utilities for 3D printing and robot arm operations
 */

/**
 * Extract keyframes from buffer geometry vertices
 * @param geometry BufferGeometry to extract vertices from
 * @param simplificationFactor Optional factor to reduce number of keyframes (default: 1 = all vertices)
 * @returns Array of Vector3 keyframes
 */
export function getKeyframesFromGeometry(
  geometry: BufferGeometry,
  simplificationFactor: number = 1
): Vector3[] {
  const keyframes: Vector3[] = [];
  const positionAttribute = geometry.getAttribute('position');
  
  if (!positionAttribute) {
    console.warn('getKeyframesFromGeometry: No position attribute found in geometry');
    return keyframes;
  }
  
  const vertexCount = positionAttribute.count;
  const step = Math.max(1, Math.floor(simplificationFactor));
  
  for (let i = 0; i < vertexCount; i += step) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const z = positionAttribute.getZ(i);
    
    keyframes.push(new Vector3(x, y, z));
  }
  
  return keyframes;
}

/**
 * Simplify keyframes by removing points that are too close together
 * @param keyframes Original keyframes array
 * @param minDistance Minimum distance between keyframes
 * @returns Simplified keyframes array
 */
export function simplifyKeyframes(
  keyframes: Vector3[],
  minDistance: number = 0.1
): Vector3[] {
  if (keyframes.length <= 1) return keyframes;
  
  const simplified: Vector3[] = [keyframes[0]]; // Always keep first point
  
  for (let i = 1; i < keyframes.length; i++) {
    const lastPoint = simplified[simplified.length - 1];
    const currentPoint = keyframes[i];
    
    if (lastPoint.distanceTo(currentPoint) >= minDistance) {
      simplified.push(currentPoint);
    }
  }
  
  // Always keep last point if it's not already included
  const lastOriginal = keyframes[keyframes.length - 1];
  const lastSimplified = simplified[simplified.length - 1];
  if (!lastOriginal.equals(lastSimplified)) {
    simplified.push(lastOriginal);
  }
  
  return simplified;
}