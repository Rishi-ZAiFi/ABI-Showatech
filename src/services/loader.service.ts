/**
 * Loader Service
 * Handles loading and parsing of 3D model files
 */

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FileService } from './file.service';
import { CacheService } from './cache.service';
import { ConverterService } from './converter.service';

export class LoaderService {
  private static gltfLoader = new GLTFLoader();

  /**
   * Load model from file with automatic conversion if needed
   * @param file - Primary model file
   * @param relatedFiles - Related files (bin, textures, etc.) with preserved folder structure
   * @returns ObjectURL pointing to GLB file
   */
  static async loadModelFromFile(file: File, relatedFiles?: File[]): Promise<string> {
    // Check cache first
    const cached = CacheService.get(file.name);
    if (cached) {
      return cached;
    }

    const ext = FileService.getFileExtension(file);
    const arrayBuffer = await FileService.readAsArrayBuffer(file);

    // Store related files with preserved paths
    const fileMap = new Map<string, { arrayBuffer: ArrayBuffer; relativePath?: string }>();
    if (relatedFiles && relatedFiles.length > 0) {
      for (const relFile of relatedFiles) {
        const relArrayBuffer = await FileService.readAsArrayBuffer(relFile);
        // Get relative path if available, fallback to filename
        const relativePath = (relFile as any).relativePath || relFile.name;
        fileMap.set(relFile.name, { arrayBuffer: relArrayBuffer, relativePath });
      }
    }

    let glbBuffer: ArrayBuffer;

    if (ext === '.glb') {
      // Already GLB, use directly
      glbBuffer = arrayBuffer;
    } else if (ext === '.gltf') {
      // Convert GLTF to GLB, passing related files with paths
      glbBuffer = await ConverterService.gltfToGlb(arrayBuffer, fileMap);
    } else if (ext === '.fbx') {
      // Convert FBX to GLB
      glbBuffer = await ConverterService.fbxToGlb(arrayBuffer);
    } else if (ext === '.obj') {
      // Try to load associated MTL file if available
      let mtlBuffer: ArrayBuffer | undefined;
      if (relatedFiles) {
        const mtlFile = relatedFiles.find((f) => f.name.endsWith('.mtl'));
        if (mtlFile) {
        const mtlFileData = fileMap.get(mtlFile.name);
        mtlBuffer = mtlFileData?.arrayBuffer;
        }
      }
      glbBuffer = await ConverterService.objToGlb(arrayBuffer, mtlBuffer);
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }

    // Create blob and URL
    const blob = FileService.arrayBufferToBlob(glbBuffer, 'model/gltf-binary');
    const objectUrl = FileService.createObjectUrl(blob);

    // Cache for future use
    CacheService.set(file.name, objectUrl, blob.size);

    return objectUrl;
  }

  /**
   * Load GLB from URL using GLTFLoader
   * Handles both blob URLs and regular URLs
   */
  static async loadGlb(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // For blob URLs, don't set a base path - resources should be embedded
      // For regular URLs, set the base path for proper resource resolution
      if (!url.startsWith('blob:')) {
        const basePath = url.substring(0, url.lastIndexOf('/') + 1);
        this.gltfLoader.setPath(basePath);
      }

      this.gltfLoader.load(
        url,
        (gltf: any) => {
          // Reset the path after loading to avoid side effects
          this.gltfLoader.setPath('');
          resolve(gltf);
        },
        undefined,
        (error: any) => {
          // Reset the path on error as well
          this.gltfLoader.setPath('');
          reject(error);
        }
      );
    });
  }
}
