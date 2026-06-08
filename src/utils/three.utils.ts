/**
 * Three.js Utilities
 * Common helpers for Three.js operations
 */

import * as THREE from 'three';

export class ThreeUtils {
  /**
   * Get default camera position for model
   */
  static getCameraPosition(
    boundingBox: THREE.Box3,
  ): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = 75;
    const cameraZ = (maxDim / 2) * Math.tan((fov * Math.PI) / 2 / 180);

    const center = boundingBox.getCenter(new THREE.Vector3());
    const position = new THREE.Vector3(
      center.x + maxDim * 0.5,
      center.y + maxDim * 0.3,
      center.z + cameraZ,
    );

    return {
      position,
      lookAt: center,
    };
  }

  /**
   * Fit camera to view all objects
   */
  static fitCameraToObjects(
    camera: THREE.PerspectiveCamera,
    objects: THREE.Object3D[],
    controls?: any,
  ) {
    const boundingBox = new THREE.Box3();

    objects.forEach((obj) => {
      boundingBox.expandByObject(obj);
    });

    // Check if bounding box is valid
    if (boundingBox.isEmpty()) {
      console.warn('Bounding box is empty, using default camera position');
      camera.position.set(5, 5, 5);
      camera.lookAt(0, 0, 0);
      if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
      }
      return;
    }

    const size = boundingBox.getSize(new THREE.Vector3());
    const center = boundingBox.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Handle extremely small models
    const effectiveMaxDim = Math.max(maxDim, 0.1);

    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(effectiveMaxDim / 2 / Math.tan(fov / 2));

    // Add padding (2x for better view)
    cameraZ *= 2.5;

    // Position camera at an angle for better 3D perception
    const distance = cameraZ;
    camera.position.set(
      center.x + distance * 0.5,
      center.y + distance * 0.5,
      center.z + distance,
    );

    camera.lookAt(center);
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.copy(center);
      controls.update();
    }

    console.log('Camera fitted to model:', {
      boundingBoxSize: size,
      center: center,
      maxDimension: maxDim,
      cameraDistance: distance,
      cameraPosition: camera.position,
    });
  }

  /**
   * Generate unique ID
   */
  static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert hex color to THREE.Color
   */
  static hexToColor(hex: string): THREE.Color {
    return new THREE.Color(hex);
  }

  /**
   * Convert THREE.Color to hex string
   */
  static colorToHex(color: THREE.Color): string {
    return '#' + color.getHexString();
  }

  /**
   * Dispose geometry and material
   */
  static disposeMesh(mesh: THREE.Mesh) {
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((mat: THREE.Material) => mat.dispose());
    } else if (mesh.material) {
      mesh.material.dispose();
    }
  }

  /**
   * Recursively dispose all children
   */
  static disposeGroup(group: THREE.Group) {
    group.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        this.disposeMesh(child);
      }
    });
  }
}
