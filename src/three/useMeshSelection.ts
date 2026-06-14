/**
 * useMeshSelection Hook
 * Handles click-to-select raycasting and edge-highlight overlay on selected meshes.
 *
 * - Plain click  -> single select (replaces selection)
 * - Shift / Ctrl / Cmd + click -> toggle mesh in/out of multi-selection (for grouping into parts)
 * - Click on empty space (no modifier) -> clear selection
 */

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useConfiguratorStore } from '../store/configurator.store';
import { useWorkflowStore } from '../store/workflow.store';

const HIGHLIGHT_COLOR = 0x38bdf8;
const HIGHLIGHT_LINE_WIDTH = 1;
const OVERLAY_NAME = '__selectionOverlay__';

function createSelectionOverlay(mesh: THREE.Mesh): THREE.LineSegments {
  const edges = new THREE.EdgesGeometry(mesh.geometry as THREE.BufferGeometry, 10);
  const mat = new THREE.LineBasicMaterial({
    color: HIGHLIGHT_COLOR,
    linewidth: HIGHLIGHT_LINE_WIDTH,
    depthTest: false,
    transparent: true,
    opacity: 0.9,
  });
  const lines = new THREE.LineSegments(edges, mat);
  lines.name = OVERLAY_NAME;
  lines.renderOrder = 999;
  return lines;
}

function removeSelectionOverlay(mesh: THREE.Mesh): void {
  const existing = mesh.getObjectByName(OVERLAY_NAME);
  if (existing) {
    mesh.remove(existing);
    existing.traverse((child) => {
      (child as any).geometry?.dispose();
      (child as any).material?.dispose();
    });
  }
}

export function useMeshSelection() {
  const { gl, camera, scene } = useThree();
  const store = useConfiguratorStore();
  const highlightedMeshesRef = useRef<THREE.Mesh[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Sync overlays with the current multi-selection
  useEffect(() => {
    for (const mesh of highlightedMeshesRef.current) {
      removeSelectionOverlay(mesh);
    }
    highlightedMeshesRef.current = [];

    for (const meshId of store.selectedMeshIds) {
      const configMesh = store.meshes.find((m) => m.id === meshId);
      const threeMesh = configMesh?.ref;
      if (!threeMesh?.geometry) continue;
      const overlay = createSelectionOverlay(threeMesh);
      threeMesh.add(overlay);
      highlightedMeshesRef.current.push(threeMesh);
    }
  }, [store.selectedMeshIds, store.meshes]);

  useEffect(() => {
    const domElement = gl.domElement;
    let pointerDownX = 0;
    let pointerDownY = 0;

    const onPointerDown = (e: PointerEvent) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (useWorkflowStore.getState().isPlacingAnnotation) return;

      const dx = e.clientX - pointerDownX;
      const dy = e.clientY - pointerDownY;
      if (Math.sqrt(dx * dx + dy * dy) > 4) return;

      const additive = e.shiftKey || e.ctrlKey || e.metaKey;

      const rect = domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const targets: THREE.Object3D[] = [];
      scene.traverse((obj) => {
        if (
          obj instanceof THREE.Mesh &&
          obj.visible &&
          obj.name !== OVERLAY_NAME &&
          !(obj instanceof THREE.LineSegments)
        ) {
          targets.push(obj);
        }
      });

      const intersections = raycasterRef.current.intersectObjects(targets, false);

      if (intersections.length === 0) {
        if (!additive) store.clearSelection();
        return;
      }

      const hit = intersections[0].object as THREE.Mesh;
      const configMesh = store.meshes.find((m) => m.ref === hit);
      if (!configMesh) return;

      if (additive) {
        store.toggleMeshInSelection(configMesh.id);
      } else {
        store.setSelectedMeshId(
          configMesh.id === store.selectedMeshId && store.selectedMeshIds.length <= 1
            ? null
            : configMesh.id,
        );
      }
    };

    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointerup', onPointerUp);

    return () => {
      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointerup', onPointerUp);
    };
  }, [gl, camera, scene, store]);

  useEffect(() => {
    return () => {
      for (const mesh of highlightedMeshesRef.current) {
        removeSelectionOverlay(mesh);
      }
      highlightedMeshesRef.current = [];
    };
  }, []);
}
