/**
 * useCameraCapture
 *
 * When the UI calls configuratorStore.requestCameraCapture(), this hook (which
 * lives inside the Canvas and therefore has access to the live camera) snapshots
 * the current camera position + orbit target and saves it onto the active step.
 */

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useConfiguratorStore } from '../store/configurator.store';
import { useWorkflowStore } from '../store/workflow.store';

export function useCameraCapture() {
  const { camera } = useThree();
  const captureRequest = useConfiguratorStore((s) => s.cameraCaptureRequest);
  const lastSeen = useRef(captureRequest);

  useEffect(() => {
    if (captureRequest === lastSeen.current) return;
    lastSeen.current = captureRequest;

    const activeStepId = useWorkflowStore.getState().activeStepId;
    if (!activeStepId) return;

    const controls = (camera as any).controls;
    const target: THREE.Vector3 = controls?.target
      ? controls.target.clone()
      : new THREE.Vector3(0, 0, 0);

    useWorkflowStore.getState().setStepCamera(activeStepId, {
      position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      target: { x: target.x, y: target.y, z: target.z },
    });
  }, [captureRequest, camera]);
}
