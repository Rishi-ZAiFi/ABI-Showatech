/**
 * usePreviewHighlight — Enhanced
 *
 * While isPreviewMode is active, renders TWO overlays on all mesh targets:
 *   1. Amber EdgesGeometry LineSegments (crisp outline)
 *   2. Semi-transparent amber fill mesh with sine-wave pulse animation
 */

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorkflowStore } from '../store/workflow.store';
import { useConfiguratorStore } from '../store/configurator.store';

const PREVIEW_COLOR = 0xf59e0b;
const EDGE_OVERLAY_NAME = '__previewEdgeOverlay__';
const FILL_OVERLAY_NAME = '__previewFillOverlay__';

function createEdgeOverlay(mesh: THREE.Mesh): THREE.LineSegments {
  const edges = new THREE.EdgesGeometry(mesh.geometry as THREE.BufferGeometry, 10);
  const mat = new THREE.LineBasicMaterial({
    color: PREVIEW_COLOR,
    linewidth: 1,
    depthTest: false,
    transparent: true,
    opacity: 0.95,
  });
  const lines = new THREE.LineSegments(edges, mat);
  lines.name = EDGE_OVERLAY_NAME;
  lines.renderOrder = 999;
  return lines;
}

function createFillOverlay(mesh: THREE.Mesh): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    color: PREVIEW_COLOR,
    transparent: true,
    opacity: 0.22,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const fill = new THREE.Mesh(mesh.geometry, mat);
  fill.name = FILL_OVERLAY_NAME;
  fill.renderOrder = 997;
  return fill;
}

function removeOverlayByName(mesh: THREE.Mesh, name: string): void {
  const existing = mesh.getObjectByName(name);
  if (existing) {
    mesh.remove(existing);
    existing.traverse((child) => {
      (child as THREE.Mesh).geometry?.dispose?.();
      const mat = (child as THREE.Mesh).material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose?.());
      else (mat as THREE.Material | undefined)?.dispose?.();
    });
  }
}

function removeAllOverlays(mesh: THREE.Mesh): void {
  removeOverlayByName(mesh, EDGE_OVERLAY_NAME);
  removeOverlayByName(mesh, FILL_OVERLAY_NAME);
}

export function usePreviewHighlight() {
  const { scene } = useThree();
  const meshes = useConfiguratorStore((s) => s.meshes);

  const isPreviewMode = useWorkflowStore((s) => s.isPreviewMode);
  const activeStepId = useWorkflowStore((s) => s.activeStepId);
  const steps = useWorkflowStore((s) => s.steps);
  const targets = useWorkflowStore((s) => s.targets);

  const highlightedMeshesRef = useRef<THREE.Mesh[]>([]);
  const fillMaterialsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  useEffect(() => {
    for (const mesh of highlightedMeshesRef.current) {
      removeAllOverlays(mesh);
    }
    highlightedMeshesRef.current = [];
    fillMaterialsRef.current = [];

    if (!isPreviewMode || !activeStepId) return;

    const step = steps[activeStepId];
    if (!step) return;

    for (const targetId of step.targetIds) {
      const target = targets[targetId];
      if (!target) continue;

      const configMesh = meshes.find((m) => m.id === target.meshId);
      if (!configMesh) continue;

      const threeMesh = configMesh.ref;
      if (!threeMesh.geometry) continue;

      const fill = createFillOverlay(threeMesh);
      const edges = createEdgeOverlay(threeMesh);
      threeMesh.add(fill);
      threeMesh.add(edges);

      highlightedMeshesRef.current.push(threeMesh);
      fillMaterialsRef.current.push(fill.material as THREE.MeshBasicMaterial);
    }

    void scene;
  }, [isPreviewMode, activeStepId, steps, targets, meshes, scene]);

  // Pulse fill opacity with sine wave (0.10 -> 0.32)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const opacity = 0.21 + Math.sin(t * 2.2) * 0.11;
    for (const mat of fillMaterialsRef.current) {
      mat.opacity = opacity;
    }
  });

  useEffect(() => {
    return () => {
      for (const mesh of highlightedMeshesRef.current) {
        removeAllOverlays(mesh);
      }
      highlightedMeshesRef.current = [];
      fillMaterialsRef.current = [];
    };
  }, []);
}
