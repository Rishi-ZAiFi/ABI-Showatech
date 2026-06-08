/**
 * GLB Exporter
 * Exports modified scene back to GLB format
 */

import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import * as THREE from 'three';

export class GLBExporter {
  /**
   * Export scene to GLB blob
   */
  static async exportToGlb(scene: THREE.Group): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();

      // Clone scene so we can remove hidden objects without mutating original
      const sceneClone = scene.clone(true) as THREE.Group;

      // Collect nodes that are explicitly invisible and remove them from the clone
      const toRemove: THREE.Object3D[] = [];
      sceneClone.traverse((node) => {
        if (node !== sceneClone && node.visible === false) {
          toRemove.push(node);
        }
      });
      toRemove.forEach((node) => node.parent && node.parent.remove(node));

      exporter.parse(
        sceneClone,
        (result: any) => {
          if (result instanceof ArrayBuffer) {
            resolve(new Blob([result], { type: 'model/gltf-binary' }));
          } else {
            reject(new Error('Unexpected export result type'));
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
   * Download GLB file
   */
  static async downloadGlb(scene: THREE.Group, fileName: string = 'model.glb') {
    const blob = await this.exportToGlb(scene);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}
