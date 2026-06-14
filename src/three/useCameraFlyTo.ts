/**
 * useCameraFlyTo
 *
 * Smoothly flies the camera to frame the target meshes of the active preview step
 * whenever isPreviewMode is active and previewStepIndex changes.
 *
 * Animation: 45-frame smooth ease-in-out (~0.75s at 60 fps).
 * OrbitControls target is updated in sync so orbit behaviour stays correct
 * after the fly completes.
 */

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorkflowStore } from '../store/workflow.store';
import { useConfiguratorStore } from '../store/configurator.store';

const FLY_FRAMES = 45; // ~0.75 s at 60 fps

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

interface FlyTarget {
  fromCamPos: THREE.Vector3;
  fromLookAt: THREE.Vector3;
  toCamPos: THREE.Vector3;
  toLookAt: THREE.Vector3;
  frame: number;
}

export function useCameraFlyTo() {
  const { camera } = useThree();
  const meshes = useConfiguratorStore((s) => s.meshes);

  const isPreviewMode = useWorkflowStore((s) => s.isPreviewMode);
  const previewStepIndex = useWorkflowStore((s) => s.previewStepIndex);
  const steps = useWorkflowStore((s) => s.steps);
  const workflow = useWorkflowStore((s) => s.workflow);
  const targets = useWorkflowStore((s) => s.targets);

  const flyRef = useRef<FlyTarget | null>(null);

  // Trigger a new fly whenever preview step changes
  useEffect(() => {
    if (!isPreviewMode || !workflow) return;

    const stepId = workflow.stepIds[previewStepIndex];
    if (!stepId) return;

    const step = steps[stepId];
    if (!step) return;

    const controlsForSaved = (camera as any).controls;

    // 1) If the step has a saved camera, fly straight to it.
    if (step.camera) {
      flyRef.current = {
        fromCamPos: camera.position.clone(),
        fromLookAt: controlsForSaved
          ? controlsForSaved.target.clone()
          : new THREE.Vector3(0, 0, 0),
        toCamPos: new THREE.Vector3(step.camera.position.x, step.camera.position.y, step.camera.position.z),
        toLookAt: new THREE.Vector3(step.camera.target.x, step.camera.target.y, step.camera.target.z),
        frame: 0,
      };
      return;
    }

    if (step.targetIds.length === 0) return;

    // 2) Otherwise build combined bounding box of all target meshes
    const bbox = new THREE.Box3();
    let hasGeometry = false;

    for (const targetId of step.targetIds) {
      const target = targets[targetId];
      if (!target) continue;

      const configMesh = meshes.find((m) => m.id === target.meshId);
      if (!configMesh?.ref.geometry) continue;

      // World-space bounding box
      configMesh.ref.updateWorldMatrix(true, false);
      const meshBbox = new THREE.Box3().setFromObject(configMesh.ref);
      if (!meshBbox.isEmpty()) {
        bbox.union(meshBbox);
        hasGeometry = true;
      }
    }

    if (!hasGeometry || bbox.isEmpty()) return;

    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.1);

    // Place camera at an angle: offset by 1× maxDim on X, 0.6× on Y, 1.5× on Z
    const distance = maxDim * 2.2;
    const toCamPos = new THREE.Vector3(
      center.x + distance * 0.4,
      center.y + distance * 0.35,
      center.z + distance * 0.9,
    );

    const controls = (camera as any).controls;
    const fromLookAt = controls
      ? controls.target.clone()
      : new THREE.Vector3(0, 0, 0);

    flyRef.current = {
      fromCamPos: camera.position.clone(),
      fromLookAt,
      toCamPos,
      toLookAt: center,
      frame: 0,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreviewMode, previewStepIndex]);

  // Animate each frame
  useFrame(() => {
    const fly = flyRef.current;
    if (!fly) return;

    fly.frame += 1;
    const t = smoothstep(fly.frame / FLY_FRAMES);

    camera.position.lerpVectors(fly.fromCamPos, fly.toCamPos, t);

    const controls = (camera as any).controls;
    if (controls) {
      controls.target.lerpVectors(fly.fromLookAt, fly.toLookAt, t);
      controls.update();
    } else {
      camera.lookAt(
        new THREE.Vector3().lerpVectors(fly.fromLookAt, fly.toLookAt, t),
      );
    }

    camera.updateProjectionMatrix();

    if (fly.frame >= FLY_FRAMES) {
      flyRef.current = null;
    }
  });
}
