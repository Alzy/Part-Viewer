import * as THREE from 'three';

export interface SimpleVoxelGridStats {
   min: number;
   max: number;
   mean: number;
   nonZeroCount: number;
}


/**
 * Super simple voxel grid which is not very precise but useful for our dummy "stress" simulation.
 * Generates a voxel grid given a bounding box and a desired density.
 * Voxel values reflect how many vertices fall within.
 */
export class SimpleVoxelGrid {
  grid: Uint32Array;
  voxelsPerSide!: THREE.Vector3;
  voxelSize!: number;
  stride!: THREE.Vector3;
  worldBounds?: THREE.Box3;
  center?: THREE.Vector3;
  numVoxels: number;

  constructor(modelRoot: THREE.Object3D, gridDensity: number = 88) {
    this.worldBounds = new THREE.Box3().setFromObject(modelRoot, true);
    this.center = this.worldBounds.getCenter(new THREE.Vector3(0, 0, 0));

    const targetVoxelNums = Math.pow(gridDensity, 3);
    
    // Get world bounds dimensions
    const worldSize = this.worldBounds.getSize(new THREE.Vector3());
    const worldVolume = worldSize.x * worldSize.y * worldSize.z;

    // Calculate voxel size as cube root of volume per voxel
    this.voxelSize = Math.cbrt(worldVolume / targetVoxelNums);

    // Calculate voxelsPerSide by dividing bounds by voxelSize
    this.voxelsPerSide = new THREE.Vector3(
      Math.ceil(worldSize.x / this.voxelSize),
      Math.ceil(worldSize.y / this.voxelSize),
      Math.ceil(worldSize.z / this.voxelSize),
    );

    // Stride calculation is straightforward
    this.stride = new THREE.Vector3(
      1,
      this.voxelsPerSide.x,
      this.voxelsPerSide.x * this.voxelsPerSide.y,
    );

    // Update total number of voxels
    this.numVoxels = this.voxelsPerSide.x * this.voxelsPerSide.y * this.voxelsPerSide.z;
    
    this.grid = new Uint32Array(this.numVoxels);

    this.fillVoxelGrid(modelRoot);
  }

  worldCoordinateToVoxelCoordinate(worldCoordinate: THREE.Vector3): THREE.Vector3 {
    if (!this.worldBounds) {
      throw new Error('World bounds not defined in voxel grid');
    }

    // Calculate the position relative to the world bounds
    const relativePos = new THREE.Vector3(
      worldCoordinate.x - this.worldBounds.min.x,
      worldCoordinate.y - this.worldBounds.min.y,
      worldCoordinate.z - this.worldBounds.min.z,
    );

    // Calculate voxel coordinates
    const voxelCoord = new THREE.Vector3(
      Math.floor(relativePos.x / this.voxelSize),
      Math.floor(relativePos.y / this.voxelSize),
      Math.floor(relativePos.z / this.voxelSize),
    );

    // Clamp the coordinates to ensure they're within the grid bounds
    return voxelCoord.clamp(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(
        this.voxelsPerSide.x - 1,
        this.voxelsPerSide.y - 1,
        this.voxelsPerSide.z - 1,
      ),
    );
  }

  worldCoordinateToVoxelIndex(worldCoordinate: THREE.Vector3): number | null {
    const voxelCoords = this.worldCoordinateToVoxelCoordinate(worldCoordinate);
    
    if (
      voxelCoords.x < 0 ||
      voxelCoords.x >= this.voxelsPerSide.x ||
      voxelCoords.y < 0 ||
      voxelCoords.y >= this.voxelsPerSide.y ||
      voxelCoords.z < 0 ||
      voxelCoords.z >= this.voxelsPerSide.z
    ) {
      return null;
    }

    return (
      voxelCoords.z * (this.voxelsPerSide.y * this.voxelsPerSide.x) +
      voxelCoords.y * this.voxelsPerSide.x +
      voxelCoords.x
    );
  }

  getVoxelValue(worldCoordinate: THREE.Vector3): number {
    const index = this.worldCoordinateToVoxelIndex(worldCoordinate);
    if (index === null || index < 0 || index >= this.grid.length) {
      return 0;
    }
    return this.grid[index];
  }

  getVoxelGridStats(): SimpleVoxelGridStats {
    let min = Infinity;
    let max = 0;
    let sum = 0;
    let nonZeroCount = 0;

    for (let i = 0; i < this.grid.length; i++) {
      const value = this.grid[i];
      if (value == 0) continue;

      min = Math.min(min, value);
      max = Math.max(max, value);
      sum += value;
      nonZeroCount++;
    }

    const mean = sum / nonZeroCount;
    return { min, max, mean, nonZeroCount };
  }

  private incrementVoxel(worldCoordinate: THREE.Vector3): void {
    const index = this.worldCoordinateToVoxelIndex(worldCoordinate);
    if (index !== null && index >= 0 && index < this.grid.length) {
      this.grid[index]++;
    }
  }

  private fillVoxelGrid(modelRoot: THREE.Object3D) {
    // Iterate through model, for every mesh iterate through coordinates (in world space) and:
    // incrementVoxel()
    modelRoot.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        const mesh = object as THREE.Mesh;
        const geometry = mesh.geometry;
        
        // Get position attribute
        const positionAttribute = geometry.getAttribute('position');
        if (!positionAttribute) return;
        
        // Create a temporary vector for world position calculation
        const worldPosition = new THREE.Vector3();
        const localPosition = new THREE.Vector3();
        
        // Iterate through all vertices
        for (let i = 0; i < positionAttribute.count; i++) {
          // Get local vertex position
          localPosition.fromBufferAttribute(positionAttribute, i);
          
          // Transform to world coordinates
          worldPosition.copy(localPosition);
          mesh.localToWorld(worldPosition);
          
          // Increment the voxel at this world position
          this.incrementVoxel(worldPosition);
        }
      }
    });
  }
}