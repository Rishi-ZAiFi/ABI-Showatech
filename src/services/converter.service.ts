/**
 * Converter Service
 * Converts non-GLB files to GLB format for unified pipeline
 */

import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import * as THREE from 'three';

export class ConverterService {
  /**
   * Convert FBX to GLB
   */
  static async fbxToGlb(arrayBuffer: ArrayBuffer): Promise<ArrayBuffer> {
    const fbxLoader = new FBXLoader();
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    try {
      const model = await fbxLoader.loadAsync(url);
      return this.sceneToGlb(model);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Convert OBJ to GLB
   */
  static async objToGlb(
    arrayBuffer: ArrayBuffer,
    mtlArrayBuffer?: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    const objLoader = new OBJLoader();
    let mtlLoader: any | undefined;

    const objBlob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
    const objUrl = URL.createObjectURL(objBlob);

    try {
      let model: THREE.Group | THREE.Object3D;

      if (mtlArrayBuffer) {
        mtlLoader = new MTLLoader();
        const mtlBlob = new Blob([mtlArrayBuffer], {
          type: 'application/octet-stream',
        });
        const mtlUrl = URL.createObjectURL(mtlBlob);

        try {
          const materials = await mtlLoader.loadAsync(mtlUrl);
          objLoader.setMaterials(materials);
        } finally {
          URL.revokeObjectURL(mtlUrl);
        }
      }

      model = await objLoader.loadAsync(objUrl);
      return this.sceneToGlb(model);
    } finally {
      URL.revokeObjectURL(objUrl);
    }
  }

  /**
   * Convert GLTF to GLB
   * @param arrayBuffer - GLTF JSON or binary file content
   * @param relatedFiles - Map of related files (bin buffers, textures, etc.) with preserved paths
   */
  static async gltfToGlb(arrayBuffer: ArrayBuffer, relatedFiles?: Map<string, { arrayBuffer: ArrayBuffer; relativePath?: string }>): Promise<ArrayBuffer> {
    const gltfLoader = new (await import('three/examples/jsm/loaders/GLTFLoader')).GLTFLoader();
    
    // Create object URLs for all related files
    const fileUrls = new Map<string, string>();
    const pathIndex = new Map<string, string>(); // Maps expected paths to actual URLs
    const blobUrls: string[] = [];

    try {
      // Parse GLTF to extract buffer and image URIs
      let gltfJson: any = {};

      // Try to parse as JSON GLTF
      try {
        const text = new TextDecoder().decode(new Uint8Array(arrayBuffer));
        if (text.startsWith('{')) {
          gltfJson = JSON.parse(text);
        } else if (text.startsWith('\0glTF')) {
          // GLB format - parse binary header
          const view = new DataView(arrayBuffer);
          const jsonLength = view.getUint32(8, true);
          const jsonArrayBuffer = arrayBuffer.slice(20, 20 + jsonLength);
          const jsonText = new TextDecoder().decode(new Uint8Array(jsonArrayBuffer));
          gltfJson = JSON.parse(jsonText);
        }
      } catch {
        // If parse fails, continue without JSON updates
      }

      // Create blobs and URLs for related files
      if (relatedFiles) {
        for (const [fileName, { arrayBuffer: buffer, relativePath }] of relatedFiles) {
          const mimeType = this.getMimeType(fileName);
          const blob = new Blob([buffer], { type: mimeType });
          const url = URL.createObjectURL(blob);
          fileUrls.set(fileName, url);
          blobUrls.push(url);

          // Index the file by both its filename and relative path for flexible resolution
          pathIndex.set(fileName, url);
          
          if (relativePath && relativePath !== fileName) {
            pathIndex.set(relativePath, url);
            // Also index just the filename from the path
            const justFileName = relativePath.split('/').pop() || fileName;
            if (justFileName !== fileName) {
              pathIndex.set(justFileName, url);
            }
          }
        }
      }

      // Update GLTF JSON with direct object URLs for buffers and images
      if (gltfJson.buffers) {
        for (const buffer of gltfJson.buffers) {
          if (buffer.uri && !buffer.uri.startsWith('data:')) {
            const resolvedUrl = this.resolveFileUrl(buffer.uri, pathIndex);
            if (resolvedUrl) {
              buffer.uri = resolvedUrl;
            }
          }
        }
      }

      if (gltfJson.images) {
        for (const image of gltfJson.images) {
          if (image.uri && !image.uri.startsWith('data:')) {
            const resolvedUrl = this.resolveFileUrl(image.uri, pathIndex);
            if (resolvedUrl) {
              image.uri = resolvedUrl;
            }
          }
        }
      }

      // Create updated GLTF blob with modified URIs
      const gltfBlob = new Blob([JSON.stringify(gltfJson)], { type: 'application/json' });
      const gltfUrl = URL.createObjectURL(gltfBlob);
      blobUrls.push(gltfUrl);

      // Load GLTF
      const gltf = await new Promise<any>((resolve, reject) => {
        gltfLoader.load(gltfUrl, resolve, undefined, reject);
      });

      // Export to GLB
      const exporter = new GLTFExporter();
      const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        exporter.parse(
          gltf.scene,
          (result: any) => {
            if (result instanceof ArrayBuffer) {
              resolve(result);
            } else {
              reject(new Error('Export did not return ArrayBuffer'));
            }
          },
          (error: any) => {
            reject(error);
          },
          { binary: true }
        );
      });

      return glbBuffer;
    } finally {
      // Clean up all created URLs
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
    }
  }

  /**
   * Resolve file URL from path index
   */
  private static resolveFileUrl(path: string, pathIndex: Map<string, string>): string | null {
    // Check if we have the file indexed by its path
    if (pathIndex.has(path)) {
      return pathIndex.get(path) || null;
    }
    
    // Try to extract just the filename and look it up
    const fileName = path.split('/').pop() || path;
    if (pathIndex.has(fileName)) {
      return pathIndex.get(fileName) || null;
    }

    // Return null if not found
    return null;
  }

  /**
   * Get MIME type for file
   */
  private static getMimeType(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    const mimeTypes: Record<string, string> = {
      'bin': 'application/octet-stream',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'json': 'application/json',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Convert a Three.js scene/model to GLB format
   */
  private static async sceneToGlb(object: THREE.Object3D): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();

      exporter.parse(
        object,
        (gltf: any) => {
          if (gltf instanceof ArrayBuffer) {
            resolve(gltf);
          } else {
            // Binary GLB export
            const json = JSON.stringify(gltf);
            const jsonBuffer = new TextEncoder().encode(json).buffer;
            const glb = this.createGlbFromJson(jsonBuffer);
            resolve(glb);
          }
        },
        (error: any) => {
          reject(new Error(`Export failed: ${error}`));
        },
        {
          binary: true,
        },
      );
    });
  }

  /**
   * Create GLB binary from JSON and buffers
   */
  private static createGlbFromJson(jsonBuffer: ArrayBuffer): ArrayBuffer {
    // GLB file format:
    // 12 byte header: magic (0x46546C67), version (2), length
    // JSON chunk: 8 byte header (length, type 0x4E4F534A) + JSON
    // BIN chunk: 8 byte header (length, type 0x004E4942) + binary data

    const magic = 0x46546c67; // 'glTF'
    const version = 2;
    const jsonChunkType = 0x4e4f534a; // 'JSON'

    // Pad JSON to 4-byte boundary
    const paddedJsonLength =
      Math.ceil(jsonBuffer.byteLength / 4) * 4;
    const jsonChunkData = new ArrayBuffer(paddedJsonLength);
    const jsonUint8 = new Uint8Array(jsonChunkData);
    jsonUint8.set(new Uint8Array(jsonBuffer));

    // Create GLB
    const glbLength = 12 + 8 + paddedJsonLength;
    const glb = new ArrayBuffer(glbLength);
    const view = new DataView(glb);
    const uint8 = new Uint8Array(glb);

    let offset = 0;

    // Header
    view.setUint32(offset, magic, true);
    offset += 4;
    view.setUint32(offset, version, true);
    offset += 4;
    view.setUint32(offset, glbLength, true);
    offset += 4;

    // JSON Chunk
    view.setUint32(offset, paddedJsonLength, true);
    offset += 4;
    view.setUint32(offset, jsonChunkType, true);
    offset += 4;

    uint8.set(new Uint8Array(jsonChunkData), offset);

    return glb;
  }
}
