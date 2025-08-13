import {Box3, Vector3} from "three";

export default class OctreeNode {
  id: string;
  bounds: Box3;
  children: OctreeNode[];
  depth: number;

  constructor(bounds: Box3, depth = 0) {
    this.id = bounds.getCenter(new Vector3()).toArray().toString();
    this.bounds = bounds;
    this.children = [];
    this.depth = depth;
  }

  isLeaf () {
    return this.children.length === 0;
  }

  subdivide() {
    const childDepth = this.depth + 1;

    const parentSize = new Vector3();
    this.bounds.getSize(parentSize);
    const childSize = parentSize.clone().multiplyScalar(0.5); // Each child is half the size in each dimension

    const parentCenter = new Vector3();
    this.bounds.getCenter(parentCenter);

    // Create 8 children in octree pattern
    for (let i = 0; i < 8; i++) {
      // Binary representation gives us the 8 octants
      const xDir = (i & 1) ? 1 : -1;  // bit 0
      const yDir = (i & 2) ? 1 : -1;  // bit 1
      const zDir = (i & 4) ? 1 : -1;  // bit 2

      // Calculate child center by offsetting from this node center
      const offset = childSize.clone().multiplyScalar(0.5).multiply(new Vector3(xDir, yDir, zDir));
      const childCenter = parentCenter.clone().add(offset);

      const newNodeBounds = new Box3().setFromCenterAndSize(childCenter, childSize);

      const newNode = new OctreeNode(newNodeBounds, childDepth);
      this.children.push(newNode);
    }
  }

  containsPoint(point: Vector3): boolean {
    return this.bounds.containsPoint(point);
  }
}