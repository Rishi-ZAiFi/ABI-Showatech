/**
 * Model Parser
 * Extracts meshes and materials from loaded Three.js models
 */

import * as THREE from 'three';
import type { ConfigMesh } from '../types/ConfigMesh';
import type { ConfigMaterial } from '../types/ConfigMaterial';
import type { AnimationClip } from '../types/ConfigModel';
import { ThreeUtils } from '../utils/three.utils';
import { extractTexturePreviews } from '../utils/texture.utils';

function detectTextureMaps(material: THREE.Material): Omit<ConfigMaterial, 'id' | 'name' | 'color' | 'ref'> {
  if (!(material instanceof THREE.MeshStandardMaterial)) {
    return {
      hasBaseColorMap: false,
      hasNormalMap: false,
      hasRoughnessMap: false,
      hasMetallicMap: false,
      hasAmbientOcclusionMap: false,
    };
  }

  return {
    hasBaseColorMap: !!(material.map),
    hasNormalMap: !!(material.normalMap),
    hasRoughnessMap: !!(material.roughnessMap),
    hasMetallicMap: !!(material.metalnessMap),
    hasAmbientOcclusionMap: !!(material.aoMap),
  };
}

export class ModelParser {
  /**
   * Extract all meshes and materials from model
   */
  static parse(scene: THREE.Group): {
    meshes: ConfigMesh[];
    materials: ConfigMaterial[];
  } {
    const meshes: ConfigMesh[] = [];
    const materialsMap = new Map<THREE.Material, ConfigMaterial>();
    const materialsList: ConfigMaterial[] = [];

    scene.traverse((node: THREE.Object3D) => {
      if (node instanceof THREE.Mesh) {
        // Extract materials
        const materialRefs = Array.isArray(node.material)
          ? node.material
          : [node.material];

        let primaryMaterialId = '';

        materialRefs.forEach((material: THREE.Material) => {
          let configMaterial = materialsMap.get(material);

          if (!configMaterial) {
            const id = ThreeUtils.generateId();
            const color = this.extractColor(material);
            const textureMaps = detectTextureMaps(material);
            const texturePreviews = extractTexturePreviews(material);

            configMaterial = {
              id,
              name: material.name || `Material_${id.substring(0, 8)}`,
              color,
              ref: material,
              ...textureMaps,
              texturePreviewBaseColorMap: texturePreviews.baseColorMap,
              texturePreviewNormalMap: texturePreviews.normalMap,
              texturePreviewRoughnessMap: texturePreviews.roughnessMap,
              texturePreviewMetallicMap: texturePreviews.metallicMap,
              texturePreviewAoMap: texturePreviews.aoMap,
            };

            materialsMap.set(material, configMaterial);
            materialsList.push(configMaterial);
          }

          if (!primaryMaterialId) {
            primaryMaterialId = configMaterial.id;
          }
        });

        // Create mesh entry
        const mesh: ConfigMesh = {
          id: ThreeUtils.generateId(),
          name: node.name || `Mesh_${meshes.length}`,
          visible: true,
          materialId: primaryMaterialId,
          ref: node,
        };

        meshes.push(mesh);
      }
    });

    return {
      meshes,
      materials: materialsList,
    };
  }

  /**
   * Extract color from material
   */
  private static extractColor(material: THREE.Material): string {
    if (material instanceof THREE.MeshStandardMaterial) {
      return ThreeUtils.colorToHex(material.color);
    } else if (material instanceof THREE.MeshPhongMaterial) {
      return ThreeUtils.colorToHex(material.color);
    } else if (material instanceof THREE.MeshBasicMaterial) {
      return ThreeUtils.colorToHex(material.color);
    }
    return '#CCCCCC'; // Default gray
  }

  /**
   * Extract animation clips from loaded model
   */
  static parseAnimations(animations: THREE.AnimationClip[]): AnimationClip[] {
    return animations.map((clip, index) => ({
      id: ThreeUtils.generateId(),
      name: clip.name || `Animation ${index + 1}`,
      duration: clip.duration,
      clip: clip,
    }));
  }
}
