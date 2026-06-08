import * as THREE from 'three';

export interface AnimationClip {
  id: string;
  name: string;
  duration: number;
  clip: THREE.AnimationClip;
}

export interface ConfigModel {
  id: string;
  name: string;
  url: string;
  scene: THREE.Group;
  meshCount: number;
  materialCount: number;
  animations: AnimationClip[];
  hasAnimations: boolean;
}
