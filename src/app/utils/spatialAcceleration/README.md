# Spatial Acceleration

This directory contains several common spatial acceleration data structures implemented as MVPs.

None of the data structures written here have been optimized beyond simple proof of concepts.

All code presented here has been written for practice and/or demo purposes. Use at your own discretion.


## Octree

An Octree is a three-dimensional tree where space is separated via subdividing each node in the tree into eight equal parts.

In essence, every non-leaf node has eight children.

On average, Octrees have O log(n) complexity for insertion/deletion and searching, O log (n+m) for range querying.


## BVH

A Bounding Volume Hierarchy (BVH) is a binary tree data structure where each node represents an object in the scene.

Each node represents the rectangular bounding volume (AABB) of that object (in the case of a leaf node) or object pairs.

On average, BVH has O log(n) complexity for searches and traversal.


## K-d Tree

A K-Dimensional tree is a space partitioning binary tree data structure which partitions space into two (non exclusively equal) subspaces.

