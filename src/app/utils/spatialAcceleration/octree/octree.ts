import OctreeNode from "./octreeNode";
import {Box3, Object3D} from "three";
import {getSceneFaceList, Face} from "../../meshUtils";

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

  static fromThreeScene(modelRoot: Object3D, maxDepth = 6): Octree {
    const startTime = performance.now();
    
    const bounds = new Box3().setFromObject(modelRoot, true);
    const octree = new Octree(bounds, maxDepth);

    // Get all faces from the scene
    const faces = getSceneFaceList(modelRoot);
    const faceExtractionTime = performance.now();

    // Build octree by subdividing nodes that intersect with face bounds
    for (const face of faces) {
      octree.traverse((node: OctreeNode) => {
        if (node.depth >= maxDepth) return true;

        if (node.isLeaf() && node.bounds.intersectsBox(face.bounds)) {
          node.subdivide();
          return true;
        }

        return false;
      }, octree.rootNode);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const subdivisionTime = endTime - faceExtractionTime;
    
    console.log(`Octree construction completed:
      - Total time: ${totalTime.toFixed(2)}ms
      - Face extraction: ${(faceExtractionTime - startTime).toFixed(2)}ms
      - Subdivision: ${subdivisionTime.toFixed(2)}ms
      - Faces processed: ${faces.length}
      - Max depth: ${maxDepth}`);

    return octree;
  }
}