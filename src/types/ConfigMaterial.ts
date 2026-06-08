import * as THREE from 'three';

export interface ConfigMaterial {
  id: string;
  name: string;
  color: string;
  ref: THREE.Material;
  hasBaseColorMap: boolean;
  hasNormalMap: boolean;
  hasRoughnessMap: boolean;
  hasMetallicMap: boolean;
  hasAmbientOcclusionMap: boolean;
  texturePreviewBaseColorMap?: string;
  texturePreviewNormalMap?: string;
  texturePreviewRoughnessMap?: string;
  texturePreviewMetallicMap?: string;
  texturePreviewAoMap?: string;
}
