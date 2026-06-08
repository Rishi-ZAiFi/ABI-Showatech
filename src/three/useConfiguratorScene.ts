/**
 * useConfiguratorScene Hook
 * Custom hook for managing configurator scene state and lifecycle
 */

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useConfiguratorStore } from '../store/configurator.store';
import { LoaderService } from '../services/loader.service';
import { ModelParser } from './ModelParser';
import { ThreeUtils } from '../utils/three.utils';

export function useConfiguratorScene() {
  const { camera, scene, controls } = useThree();
  const store = useConfiguratorStore();
  const previousUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        if (!store.modelUrl || previousUrlRef.current === store.modelUrl) {
          return;
        }

        previousUrlRef.current = store.modelUrl;
        store.setIsLoading(true);

        // Clear previous model
        if (store.scene) {
          ThreeUtils.disposeGroup(store.scene);
          scene.remove(store.scene);
        }

        // Load GLB
        const gltf = (await LoaderService.loadGlb(store.modelUrl)) as any;
        const model = gltf.scene as THREE.Group;

        // Parse model
        const { meshes, materials } = ModelParser.parse(model);
        
        // Parse animations
        const animations = ModelParser.parseAnimations(gltf.animations || []);

        // Store in Zustand
        store.setScene(model);
        store.setMeshes(meshes);
        store.setMaterials(materials);
        store.setAnimations(animations);
        
        // Auto-select first animation if available
        if (animations.length > 0) {
          store.setCurrentAnimation(animations[0].id);
        }

        // Add to scene
        scene.add(model);

        // Force update world matrices for accurate bounding box calculation
        model.updateMatrixWorld(true);

        // Fit camera with a slight delay to ensure bounding box is computed
        setTimeout(() => {
          const orbitControls = (camera as any)?.controls || (controls as any) || undefined;
          if (orbitControls) {
            ThreeUtils.fitCameraToObjects(camera as THREE.PerspectiveCamera, [model], orbitControls);
          } else {
            ThreeUtils.fitCameraToObjects(camera as THREE.PerspectiveCamera, [model]);
          }
        }, 100);

        store.setIsLoading(false);
      } catch (error) {
        console.error('Failed to load model:', error);
        store.setIsLoading(false);
      }
    };

    loadModel();

    return () => {
      // Cleanup happens in reset action
    };
  }, [store.modelUrl, store, scene, camera, controls]);

  // Handle visibility changes
  useEffect(() => {
    store.meshes.forEach((mesh) => {
      mesh.ref.visible = mesh.visible;
    });
  }, [store.meshes, store]);

  // Respond to explicit fit camera requests from the UI/store
  useEffect(() => {
    if (!store.scene) return;

    // Run fit in next tick to ensure world matrices are up to date
    setTimeout(() => {
      const orbitControls = (camera as any)?.controls || (controls as any) || undefined;
      if (orbitControls) {
        ThreeUtils.fitCameraToObjects(camera as THREE.PerspectiveCamera, [store.scene as THREE.Group], orbitControls);
      } else {
        ThreeUtils.fitCameraToObjects(camera as THREE.PerspectiveCamera, [store.scene as THREE.Group]);
      }
    }, 50);
  }, [store.fitCameraRequest, store.scene, camera, controls]);
}
