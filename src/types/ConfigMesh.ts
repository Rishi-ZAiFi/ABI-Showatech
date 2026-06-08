import * as THREE from 'three';

export interface ConfigMesh {
  id: string;
  name: string;
  visible: boolean;
  materialId: string;
  ref: THREE.Mesh;
}
