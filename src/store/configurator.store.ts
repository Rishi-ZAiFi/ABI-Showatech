import { create } from 'zustand';
import * as THREE from 'three';
import type { ConfigMesh } from '../types/ConfigMesh';
import type { ConfigMaterial } from '../types/ConfigMaterial';
import type { AnimationClip } from '../types/ConfigModel';

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

export interface ConfiguratorState {
  // Data
  modelUrl: string | null;
  modelName: string;
  scene: THREE.Group | null;
  meshes: ConfigMesh[];
  materials: ConfigMaterial[];
  animations: AnimationClip[];
  currentAnimationId: string | null;
  animationSpeed: number;
  animationTime: number;
  isAnimationPlaying: boolean;
  isLoading: boolean;
  // HDRI / environment intensity for studio lighting
  hdriIntensity: number;
  // Fit camera request trigger (increment to request a fit)
  fitCameraRequest: number;

  // Actions
  setModelUrl: (url: string, name: string) => void;
  setScene: (scene: THREE.Group) => void;
  addMesh: (mesh: ConfigMesh) => void;
  addMaterial: (material: ConfigMaterial) => void;
  setMeshes: (meshes: ConfigMesh[]) => void;
  setMaterials: (materials: ConfigMaterial[]) => void;
  setAnimations: (animations: AnimationClip[]) => void;
  setCurrentAnimation: (animationId: string | null) => void;
  setAnimationSpeed: (speed: number) => void;
  toggleAnimationPlayPause: () => void;
  setAnimationTime: (time: number) => void;
  setIsLoading: (loading: boolean) => void;
  setHdriIntensity: (intensity: number) => void;
  requestFitCamera: () => void;
  toggleMeshVisibility: (meshId: string) => void;
  setMaterialColor: (materialId: string, color: string) => void;
  reset: () => void;
}

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  // Initial state
  modelUrl: null,
  modelName: '',
  scene: null,
  meshes: [],
  materials: [],
  animations: [],
  currentAnimationId: null,
  animationSpeed: 1.0,
  animationTime: 0,
  isAnimationPlaying: false,
  isLoading: false,
  fitCameraRequest: 0,
  // default HDRI intensity
  hdriIntensity: 1.0,

  // Actions
  setModelUrl: (url, name) =>
    set({
      modelUrl: url,
      modelName: name,
    }),

  setScene: (scene) =>
    set({
      scene,
    }),

  addMesh: (mesh) =>
    set((state) => ({
      meshes: [...state.meshes, mesh],
    })),

  addMaterial: (material) =>
    set((state) => {
      const textureMaps = detectTextureMaps(material.ref);
      const enrichedMaterial = { ...material, ...textureMaps };
      return {
        materials: [...state.materials, enrichedMaterial],
      };
    }),

  setMeshes: (meshes) =>
    set({
      meshes,
    }),

  setMaterials: (materials) =>
    set({
      materials,
    }),

  setAnimations: (animations) =>
    set({
      animations,
    }),

  setCurrentAnimation: (animationId) =>
    set({
      currentAnimationId: animationId,
    }),

  setAnimationSpeed: (speed) =>
    set({
      animationSpeed: speed,
    }),

  toggleAnimationPlayPause: () =>
    set((state) => ({
      isAnimationPlaying: !state.isAnimationPlaying,
    })),

  setAnimationTime: (time) =>
    set({
      animationTime: time,
    }),

  setIsLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  setHdriIntensity: (intensity) =>
    set({
      hdriIntensity: intensity,
    }),

  requestFitCamera: () =>
    set((state) => ({
      fitCameraRequest: (state.fitCameraRequest || 0) + 1,
    })),

  toggleMeshVisibility: (meshId) =>
    set((state) => ({
      meshes: state.meshes.map((mesh) =>
        mesh.id === meshId ? { ...mesh, visible: !mesh.visible } : mesh,
      ),
    })),

  setMaterialColor: (materialId, color) =>
    set((state) => {
      const material = state.materials.find((m) => m.id === materialId);
      if (material && material.ref instanceof THREE.MeshStandardMaterial) {
        material.ref.color.set(color);
      }
      return {
        materials: state.materials.map((m) =>
          m.id === materialId ? { ...m, color } : m,
        ),
      };
    }),

  reset: () =>
    set({
      modelUrl: null,
      modelName: '',
      scene: null,
      meshes: [],
      materials: [],
      animations: [],
      currentAnimationId: null,
      animationSpeed: 1.0,
      animationTime: 0,
      isAnimationPlaying: false,
      isLoading: false,
    }),
}));
