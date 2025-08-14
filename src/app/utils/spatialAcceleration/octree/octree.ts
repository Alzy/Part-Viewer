import OctreeNode from "./octreeNode";
import {Box3, Mesh, Object3D, Vector3} from "three";

export enum TraversalMode {depthFirst, breadthFirst}

/**
 * Simple Octree implementation
 */
export default class Octree {
  rootNode: OctreeNode;
  maxDepth: number;

  constructor(bounds: Box3, maxDepth = 8) {
    this.rootNode = new OctreeNode(bounds);
    this.maxDepth = maxDepth;
  }

  traverse(method: (node: OctreeNode) => boolean, fromNode: OctreeNode, traversalMode = TraversalMode.depthFirst) {
    if (traversalMode === TraversalMode.depthFirst) {
      this.traverseDepthFirst(method, fromNode);
    } else {
      this.traverseBreadthFirst(method, fromNode);
    }
  }

  private traverseDepthFirst(method: (node: OctreeNode) => boolean, fromNode: OctreeNode) {
    // traverse depth first
    if (method(fromNode)) return; // user terminates with true return

    if (fromNode.isLeaf()) return; // nothing to traverse further
    for (const child of fromNode.children) {
      this.traverseDepthFirst(method, child);
    }
  }

  private traverseBreadthFirst(method: (node: OctreeNode) => boolean, fromNode: OctreeNode) {
    // traverse breadth first
    const queue: OctreeNode[] = [];
    queue.push(fromNode);

    const visited: string[] = [];

    while (queue.length > 0) {
      const currentNode = queue.shift();
      if (!currentNode) break;

      visited.push(currentNode.id);
      if (method(currentNode)) return; // user terminates with true return

      for (const nodeChild of currentNode.children) {
        if (visited.includes(nodeChild.id)) continue;
        queue.push(nodeChild);
      }
    }
  }

  static fromThreeScene(modelRoot: Object3D, maxDepth = 8): Octree {
    const bounds = new Box3().setFromObject(modelRoot, true);
    const octree = new Octree(bounds, maxDepth);

    // Collect center world position for each face in scene
    const faceCenters: Vector3[] = [];
    modelRoot.traverse((object: Object3D) => {
      if (object instanceof Mesh) {
        const mesh = object as Mesh;
        const geometry = mesh.geometry;
        const index = geometry.getIndex();

        // Get position attribute
        const positionAttribute = geometry.getAttribute('position');
        if (!positionAttribute || !index) return;

        // Create a temporary vector for world position calculation
        const worldPosition = new Vector3();
        const localPosition = new Vector3();

        const faceBounds = new Box3();
        const faceWorldPositions = [new Vector3(), new Vector3(), new Vector3()];

        // Iterate through all face vertices
        for (let i = 0; i < index.count; i += 3) {
          const a = index.getX(i);
          const b = index.getX(i + 1);
          const c = index.getX(i + 2);

          // get all world positions for each vertex in face
          const vA = localPosition.fromBufferAttribute(positionAttribute, a);
          worldPosition.copy(vA);
          mesh.localToWorld(worldPosition);
          faceWorldPositions[0].copy(worldPosition);
          const vB = localPosition.fromBufferAttribute(positionAttribute, b);
          worldPosition.copy(vB);
          mesh.localToWorld(worldPosition);
          faceWorldPositions[1].copy(worldPosition);
          const vC = localPosition.fromBufferAttribute(positionAttribute, c);
          worldPosition.copy(vC);
          mesh.localToWorld(worldPosition);
          faceWorldPositions[2].copy(worldPosition);

          // store center world position of face
          const center = new Vector3();
          faceBounds.setFromPoints(faceWorldPositions).getCenter(center);
          faceCenters.push(center);
        }
      }
    });

    for (const faceCenter of faceCenters) {
      octree.traverse((node: OctreeNode) => {
        if (node.depth >= maxDepth) return true;

        if (node.isLeaf() && node.containsPoint(faceCenter)) {
          node.subdivide();
          return true;
        }

        return false;
      }, octree.rootNode)
    }

    return octree;
  }
}