import { Matrix4, BufferGeometry, Material, MeshStandardMaterial, Object3D, Group, Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export interface LoadedPart {
  id: string;
  name: string;
  matrix: Matrix4;
  geometry?: BufferGeometry;
  material?: Material | Material[];
  children?: LoadedPart[];
}

export interface LoadedProject {
  name: string;
  parts: LoadedPart[];
  sceneRoot: Object3D;
  originalFile?: {
    name: string;
    type: string;
    size: number;
  };
}

export class FileLoader {
  private gltfLoader = new GLTFLoader();
  private stlLoader = new STLLoader();
  private objLoader = new OBJLoader();

  /**
   * Load a 3D file and return a standardized project object
   * @param filePathOrFile - File path (string) or File object
   * @returns Promise<LoadedProject>
   */
  async loadFile(filePathOrFile: string | File): Promise<LoadedProject> {
    let fileName: string;
    let fileExtension: string;
    let fileSize = 0;

    if (typeof filePathOrFile === 'string') {
      // Loading from URL/path
      fileName = filePathOrFile.split('/').pop() || 'unknown';
      fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    } else {
      // Loading from File object
      fileName = filePathOrFile.name;
      fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      fileSize = filePathOrFile.size;
    }

    const projectName = fileName.replace(/\.[^/.]+$/, '') || 'Untitled Project';

    try {
      let parts: LoadedPart[] = [];
      let sceneRoot: Object3D;

      switch (fileExtension) {
        case 'glb':
        case 'gltf':
          const gltfResult = await this.loadGLTF(filePathOrFile);
          parts = gltfResult.parts;
          sceneRoot = gltfResult.sceneRoot;
          break;
        case 'stl':
          const stlResult = await this.loadSTL(filePathOrFile);
          parts = stlResult.parts;
          sceneRoot = stlResult.sceneRoot;
          break;
        case 'obj':
          const objResult = await this.loadOBJ(filePathOrFile);
          parts = objResult.parts;
          sceneRoot = objResult.sceneRoot;
          break;
        default:
          throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      if (parts.length === 0) {
        throw new Error(`No valid geometry found in ${fileName}`);
      }

      return {
        name: projectName,
        parts,
        sceneRoot,
        originalFile: {
          name: fileName,
          type: fileExtension,
          size: fileSize,
        },
      };
    } catch (error) {
      throw new Error(`Failed to load ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async loadGLTF(filePathOrFile: string | File): Promise<{ parts: LoadedPart[]; sceneRoot: Object3D }> {
    const gltf: any = await new Promise((resolve, reject) => {
      if (typeof filePathOrFile === 'string') {
        this.gltfLoader.load(
          filePathOrFile,
          (gltf) => resolve(gltf),
          undefined,
          (error) => reject(error)
        );
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          this.gltfLoader.parse(
            arrayBuffer,
            '',
            (gltf) => resolve(gltf),
            (error) => reject(error)
          );
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(filePathOrFile);
      }
    });

    const parts: LoadedPart[] = [];
    
    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        parts.push({
          id: child.uuid,
          name: child.name || 'Mesh',
          matrix: child.matrix.clone(),
          geometry: child.geometry.clone(),
          material: Array.isArray(child.material)
            ? child.material.map((mat: any) => mat.clone())
            : child.material.clone(),
        });
      }
    });

    return { parts, sceneRoot: gltf.scene };
  }

  private async loadSTL(filePathOrFile: string | File): Promise<{ parts: LoadedPart[]; sceneRoot: Object3D }> {
    const geometry: BufferGeometry = await new Promise((resolve, reject) => {
      if (typeof filePathOrFile === 'string') {
        this.stlLoader.load(
          filePathOrFile,
          (geometry) => resolve(geometry),
          undefined,
          (error) => reject(error)
        );
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const arrayBuffer = reader.result as ArrayBuffer;
            const geometry = this.stlLoader.parse(arrayBuffer);
            resolve(geometry);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(filePathOrFile);
      }
    });

    // STL files don't have materials, so we'll create a default one
    const defaultMaterial = new MeshStandardMaterial({
      color: '#6b7280',
      metalness: 0.3,
      roughness: 0.4,
    });

    // Scale down STL geometry to 5% - this is a temporary fix for STL units
    // TODO: We should implement proper unit detection and scaling based on model dimensions or adapt scene camera  and grid?
    const scaleMatrix = new Matrix4().makeScale(0.05, 0.05, 0.05);

    // Create a mesh and add it to a group to serve as scene root
    const mesh = new Mesh(geometry, defaultMaterial);
    mesh.applyMatrix4(scaleMatrix);
    const sceneRoot = new Group();
    sceneRoot.add(mesh);

    const parts: LoadedPart[] = [{
      id: `stl-${Date.now()}`,
      name: 'STL Mesh',
      matrix: scaleMatrix,
      geometry: geometry,
      material: defaultMaterial,
    }];

    return { parts, sceneRoot };
  }

  private async loadOBJ(filePathOrFile: string | File): Promise<{ parts: LoadedPart[]; sceneRoot: Object3D }> {
    const objGroup: any = await new Promise((resolve, reject) => {
      if (typeof filePathOrFile === 'string') {
        this.objLoader.load(
          filePathOrFile,
          (object) => resolve(object),
          undefined,
          (error) => reject(error)
        );
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const text = reader.result as string;
            const object = this.objLoader.parse(text);
            resolve(object);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(filePathOrFile);
      }
    });

    const parts: LoadedPart[] = [];
    
    objGroup.traverse((child: any) => {
      if (child.isMesh) {
        // OBJ files may not have materials
        let material = child.material;
        if (!material) {
          material = new MeshStandardMaterial({
            color: '#6b7280',
            metalness: 0.3,
            roughness: 0.4,
          });
        }

        parts.push({
          id: child.uuid,
          name: child.name || 'OBJ Mesh',
          matrix: child.matrix.clone(),
          geometry: child.geometry.clone(),
          material: material,
        });
      }
    });

    return { parts, sceneRoot: objGroup };
  }
}

// Convenience function for loading files
export async function loadProjectFile(filePathOrFile: string | File): Promise<LoadedProject> {
    const fileLoader = new FileLoader();
    return fileLoader.loadFile(filePathOrFile);
}