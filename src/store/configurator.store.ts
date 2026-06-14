import { create } from 'zustand';
import * as THREE from 'three';
import type { ConfigMesh } from '../types/ConfigMesh';
import type { ConfigMaterial } from '../types/ConfigMaterial';
import type { AnimationClip } from '../types/ConfigModel';
import { PART_GROUP_COLORS, type PartGroup } from '../types/PartGroup';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

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
  hdriIntensity: number;
  fitCameraRequest: number;
  cameraCaptureRequest: number;
  selectedMeshId: string | null;
  /** Multi-selection used for grouping meshes into parts. */
  selectedMeshIds: string[];
  /** Logical parts: each bundles several meshes under one name + tag. */
  partGroups: PartGroup[];

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
  requestCameraCapture: () => void;
  setSelectedMeshId: (id: string | null) => void;
  /** Add/remove a mesh from the multi-selection (modifier-click). */
  toggleMeshInSelection: (meshId: string) => void;
  clearSelection: () => void;
  toggleMeshVisibility: (meshId: string) => void;
  setMaterialColor: (materialId: string, color: string) => void;

  // Part group actions
  createPartGroup: (name: string, meshIds: string[], tag?: string) => PartGroup | null;
  updatePartGroup: (id: string, patch: Partial<Pick<PartGroup, 'name' | 'tag' | 'color' | 'meshIds'>>) => void;
  removePartGroup: (id: string) => void;
  /** Show/hide every mesh in a group in a single step. */
  togglePartGroupVisibility: (id: string) => void;
  /** Select all meshes belonging to a group. */
  selectPartGroup: (id: string) => void;
  /** Replace all part groups (used when importing a saved workflow). */
  setPartGroups: (groups: PartGroup[]) => void;

  reset: () => void;
}

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
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
  cameraCaptureRequest: 0,
  hdriIntensity: 1.0,
  selectedMeshId: null,
  selectedMeshIds: [],
  partGroups: [],

  setModelUrl: (url, name) =>
    set({ modelUrl: url, modelName: name }),

  setScene: (scene) =>
    set({ scene }),

  addMesh: (mesh) =>
    set((state) => ({ meshes: [...state.meshes, mesh] })),

  addMaterial: (material) =>
    set((state) => {
      const textureMaps = detectTextureMaps(material.ref);
      const enrichedMaterial = { ...material, ...textureMaps };
      return { materials: [...state.materials, enrichedMaterial] };
    }),

  setMeshes: (meshes) =>
    set({ meshes, partGroups: [], selectedMeshId: null, selectedMeshIds: [] }),

  setMaterials: (materials) =>
    set({ materials }),

  setAnimations: (animations) =>
    set({ animations }),

  setCurrentAnimation: (animationId) =>
    set({ currentAnimationId: animationId }),

  setAnimationSpeed: (speed) =>
    set({ animationSpeed: speed }),

  toggleAnimationPlayPause: () =>
    set((state) => ({ isAnimationPlaying: !state.isAnimationPlaying })),

  setAnimationTime: (time) =>
    set({ animationTime: time }),

  setIsLoading: (loading) =>
    set({ isLoading: loading }),

  setHdriIntensity: (intensity) =>
    set({ hdriIntensity: intensity }),

  requestFitCamera: () =>
    set((state) => ({ fitCameraRequest: (state.fitCameraRequest || 0) + 1 })),

  requestCameraCapture: () =>
    set((state) => ({ cameraCaptureRequest: (state.cameraCaptureRequest || 0) + 1 })),

  setSelectedMeshId: (id) =>
    set({ selectedMeshId: id, selectedMeshIds: id ? [id] : [] }),

  toggleMeshInSelection: (meshId) =>
    set((state) => {
      const exists = state.selectedMeshIds.includes(meshId);
      const selectedMeshIds = exists
        ? state.selectedMeshIds.filter((id) => id !== meshId)
        : [...state.selectedMeshIds, meshId];
      return {
        selectedMeshIds,
        selectedMeshId: exists
          ? (selectedMeshIds[selectedMeshIds.length - 1] ?? null)
          : meshId,
      };
    }),

  clearSelection: () =>
    set({ selectedMeshId: null, selectedMeshIds: [] }),

  toggleMeshVisibility: (meshId) =>
    set((state) => ({
      meshes: state.meshes.map((mesh) =>
        mesh.id === meshId ? { ...mesh, visible: !mesh.visible } : mesh,
      ),
    })),

  createPartGroup: (name, meshIds, tag = '') => {
    if (meshIds.length === 0) return null;
    const group: PartGroup = {
      id: uid(),
      name: name.trim() || 'Untitled Part',
      tag: tag.trim(),
      color: PART_GROUP_COLORS[0],
      meshIds: [...new Set(meshIds)],
    };
    set((state) => {
      group.color = PART_GROUP_COLORS[state.partGroups.length % PART_GROUP_COLORS.length];
      return { partGroups: [...state.partGroups, group] };
    });
    return group;
  },

  updatePartGroup: (id, patch) =>
    set((state) => ({
      partGroups: state.partGroups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    })),

  removePartGroup: (id) =>
    set((state) => ({
      partGroups: state.partGroups.filter((g) => g.id !== id),
    })),

  togglePartGroupVisibility: (id) =>
    set((state) => {
      const group = state.partGroups.find((g) => g.id === id);
      if (!group) return {};
      const memberSet = new Set(group.meshIds);
      const anyVisible = state.meshes.some((m) => memberSet.has(m.id) && m.visible);
      const nextVisible = !anyVisible;
      return {
        meshes: state.meshes.map((m) =>
          memberSet.has(m.id) ? { ...m, visible: nextVisible } : m,
        ),
      };
    }),

  selectPartGroup: (id) =>
    set((state) => {
      const group = state.partGroups.find((g) => g.id === id);
      if (!group) return {};
      return {
        selectedMeshIds: [...group.meshIds],
        selectedMeshId: group.meshIds[group.meshIds.length - 1] ?? null,
      };
    }),

  setPartGroups: (groups) => set({ partGroups: groups }),

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
      selectedMeshId: null,
      selectedMeshIds: [],
      partGroups: [],
    }),
}));
