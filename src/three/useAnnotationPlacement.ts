/**
 * useAnnotationPlacement — Slice 06
 *
 * When annotation placement mode is active (isPlacingAnnotation === true):
 *  - Changes the canvas cursor to a crosshair
 *  - Captures the next click, raycasts the scene
 *  - Finds or creates a Target for the hit mesh on the active step
 *  - Calls addAnnotation with the world-space hit point
 *  - Cancels placement mode
 *
 * Must be called inside a React Three Fiber context (inside <Canvas>).
 */

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorkflowStore } from '../store/workflow.store';
import { useConfiguratorStore } from '../store/configurator.store';

export function useAnnotationPlacement() {
  const { gl, camera, scene } = useThree();

  const isPlacing = useWorkflowStore((s) => s.isPlacingAnnotation);
  const stepId = useWorkflowStore((s) => s.placeAnnotationStepId);
  const steps = useWorkflowStore((s) => s.steps);
  const targets = useWorkflowStore((s) => s.targets);
  const addAnnotation = useWorkflowStore((s) => s.addAnnotation);
  const addTarget = useWorkflowStore((s) => s.addTarget);
  const cancelAnnotationPlacement = useWorkflowStore((s) => s.cancelAnnotationPlacement);

  const meshes = useConfiguratorStore((s) => s.meshes);

  // Counter for default annotation labels (persists across placements)
  const labelCounterRef = useRef(0);

  useEffect(() => {
    if (!isPlacing || !stepId) return;

    const domElement = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let pointerDownX = 0;
    let pointerDownY = 0;

    const onPointerDown = (e: PointerEvent) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      // Skip drags
      const dx = e.clientX - pointerDownX;
      const dy = e.clientY - pointerDownY;
      if (Math.sqrt(dx * dx + dy * dy) > 4) return;

      const rect = domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Collect visible, selectable meshes
      const rayTargets: THREE.Object3D[] = [];
      scene.traverse((obj) => {
        if (
          obj instanceof THREE.Mesh &&
          obj.visible &&
          obj.name !== '__selectionOverlay__' &&
          !(obj instanceof THREE.LineSegments)
        ) {
          rayTargets.push(obj);
        }
      });

      const hits = raycaster.intersectObjects(rayTargets, false);
      if (hits.length === 0) return; // clicked empty space — stay in placement mode

      const hit = hits[0];
      const hitMesh = hit.object as THREE.Mesh;
      const hitPoint = hit.point;

      // Map THREE.Mesh → ConfigMesh
      const configMesh = meshes.find((m) => m.ref === hitMesh);
      if (!configMesh) return;

      // Find existing target for this mesh on this step, or create one
      const step = steps[stepId];
      if (!step) return;

      let targetId: string | null = null;

      const existingTarget = Object.values(targets).find(
        (t) => t.stepId === stepId && t.meshId === configMesh.id,
      );

      if (existingTarget) {
        targetId = existingTarget.id;
      } else {
        // Auto-create a target for this mesh
        const newTarget = addTarget(stepId, configMesh.id, configMesh.name);
        targetId = newTarget.id;
      }

      // Build auto label
      labelCounterRef.current += 1;
      const label = `Note ${labelCounterRef.current}`;

      addAnnotation(stepId, targetId, label, {
        x: hitPoint.x,
        y: hitPoint.y,
        z: hitPoint.z,
      });

      cancelAnnotationPlacement();
    };

    // Escape key cancels placement
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelAnnotationPlacement();
    };

    domElement.style.cursor = 'crosshair';
    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      domElement.style.cursor = '';
      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    isPlacing,
    stepId,
    gl,
    camera,
    scene,
    meshes,
    steps,
    targets,
    addAnnotation,
    addTarget,
    cancelAnnotationPlacement,
  ]);
}
