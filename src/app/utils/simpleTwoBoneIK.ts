import * as THREE from 'three';

export interface SimpleTwoBoneIKConfig {
  rootBoneName: string;    // e.g., "Shoulder"
  middleBoneName: string;  // e.g., "Elbow" 
  endBoneName: string;     // e.g., "Effector"
}

/**
 * Simple Two-Bone IK Solver
 * Uses law of cosines to animate two bone armatures.
 */
export class SimpleTwoBoneIK {
  private static readonly EPSILON = 0.01;
  
  // Precomputed bone references
  private rootBone: THREE.Bone;
  private middleBone: THREE.Bone;
  private endBone: THREE.Bone;
  
  // Precomputed bone lengths
  private upperLength!: number;  // Root to middle bone length
  private lowerLength!: number;  // Middle to end bone length
  private maxReach!: number;     // Maximum reach distance

  constructor(skeleton: THREE.Skeleton, config: SimpleTwoBoneIKConfig) {
    // Find bones by name
    this.rootBone = this.findBoneByName(skeleton, config.rootBoneName);
    this.middleBone = this.findBoneByName(skeleton, config.middleBoneName);
    this.endBone = this.findBoneByName(skeleton, config.endBoneName);
    
    if (!this.rootBone || !this.middleBone || !this.endBone) {
      throw new Error(`SimpleTwoBoneIK: Could not find required bones. Found: ${this.rootBone?.name}, ${this.middleBone?.name}, ${this.endBone?.name}`);
    }
    
    // Ensure skeleton matrices are up to date
    skeleton.bones[0].updateMatrixWorld(true);
    
    // Precompute bone lengths from bind pose
    this.precomputeBoneLengths();
  }

  /**
   * Find bone by name in skeleton
   */
  private findBoneByName(skeleton: THREE.Skeleton, name: string): THREE.Bone {
    const bone = skeleton.bones.find(b => 
      b.name.toLowerCase().includes(name.toLowerCase())
    );
    
    if (!bone) {
      console.warn(`Bone containing "${name}" not found. Available bones:`, 
        skeleton.bones.map(b => b.name));
    }
    
    return bone!;
  }
  
  /**
   * Precompute bone lengths from current pose
   */
  private precomputeBoneLengths(): void {
    // Get world positions
    const rootPos = this.rootBone.getWorldPosition(new THREE.Vector3());
    const middlePos = this.middleBone.getWorldPosition(new THREE.Vector3());
    const endPos = this.endBone.getWorldPosition(new THREE.Vector3());
    
    // Calculate bone lengths
    this.upperLength = rootPos.distanceTo(middlePos);
    this.lowerLength = middlePos.distanceTo(endPos);
    this.maxReach = this.upperLength + this.lowerLength - SimpleTwoBoneIK.EPSILON;
  }
  
  /**
   * Solve IK for target position
   */
  solve(target: THREE.Vector3): void {
    // Get current world positions
    const a = this.rootBone.getWorldPosition(new THREE.Vector3());
    const b = this.middleBone.getWorldPosition(new THREE.Vector3());
    const c = this.endBone.getWorldPosition(new THREE.Vector3());
    const t = target.clone(); // Clone to avoid modifying original
    
    // Get segment lengths
    const lab = this.upperLength;
    const lcb = this.lowerLength;
    
    // Clamp target distance to valid range
    const targetDist = Math.max(
      SimpleTwoBoneIK.EPSILON,
      Math.min(t.clone().sub(a).length(), lab + lcb - SimpleTwoBoneIK.EPSILON),
    );
    
    // Step 1: Extend/Contract the Joint Chain
    // Get current angles
    const ac_ab_0 = Math.acos(
      THREE.MathUtils.clamp(
        c.clone().sub(a).normalize().dot(b.clone().sub(a).normalize()),
        -1, 1
      ),
    );
    
    const ba_bc_0 = Math.acos(
      THREE.MathUtils.clamp(
        a.clone().sub(b).normalize().dot(c.clone().sub(b).normalize()),
        -1, 1
      ),
    );
    
    // Calculate desired angles using cosine rule
    const ac_ab_1 = Math.acos(
      THREE.MathUtils.clamp(
        (lcb * lcb - lab * lab - targetDist * targetDist) / (-2 * lab * targetDist),
        -1, 1
      ),
    );
    
    const ba_bc_1 = Math.acos(
      THREE.MathUtils.clamp(
        (targetDist * targetDist - lab * lab - lcb * lcb) / (-2 * lab * lcb),
        -1, 1
      ),
    );
    
    // Get world rotations
    const rootWorldQuat = new THREE.Quaternion();
    const middleWorldQuat = new THREE.Quaternion();
    this.rootBone.getWorldQuaternion(rootWorldQuat);
    this.middleBone.getWorldQuaternion(middleWorldQuat);
    
    // Calculate rotation axis
    const upVector = new THREE.Vector3(0, 1, 0);
    const axis0 = new THREE.Vector3()
      .crossVectors(c.clone().sub(a), upVector)
      .normalize();
    
    // Create extension/contraction rotations
    const r0 = new THREE.Quaternion().setFromAxisAngle(
      axis0.clone().applyQuaternion(rootWorldQuat.clone().invert()),
      ac_ab_1 - ac_ab_0,
    );
    
    const r1 = new THREE.Quaternion().setFromAxisAngle(
      axis0.clone().applyQuaternion(middleWorldQuat.clone().invert()),
      ba_bc_1 - ba_bc_0,
    );
    
    // Apply extension/contraction rotations
    this.rootBone.quaternion.multiply(r0);
    this.middleBone.quaternion.multiply(r1);
    
    // Update chain
    this.updateChain();
    
    // Get updated position
    const finalC = this.endBone.getWorldPosition(new THREE.Vector3());
    
    // Step 2: Rotate into final position
    const ac_at_0 = Math.acos(
      THREE.MathUtils.clamp(
        finalC.clone().sub(a).normalize().dot(t.clone().sub(a).normalize()),
        -1, 1
      ),
    );
    
    const axis1 = new THREE.Vector3()
      .crossVectors(finalC.clone().sub(a), t.clone().sub(a))
      .normalize();
    
    // Get final world rotation
    const finalRootWorldQuat = new THREE.Quaternion();
    this.rootBone.getWorldQuaternion(finalRootWorldQuat);
    
    // Create and apply final rotation
    const r2 = new THREE.Quaternion().setFromAxisAngle(
      axis1.clone().applyQuaternion(finalRootWorldQuat.clone().invert()),
      ac_at_0,
    );
    
    this.rootBone.quaternion.multiply(r2);
    
    // Final update of the chain
    this.updateChain();
  }
  
  /**
   * Update chain transforms
   */
  private updateChain(): void {
    this.rootBone.updateMatrixWorld(true);
  }
}