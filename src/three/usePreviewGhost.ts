/**
 * usePreviewGhost — Slice 15
 *
 * The inverse of usePreviewHighlight: while previewing/presenting a guide with
 * the "ghost" view option on, every mesh that is NOT a target of the active
 * step is dimmed to low opacity so the relevant part visually pops out of the
 * assembly.
 *
 * Implementation notes:
 *  - We clone each non-target mesh's material(s) and swap in a transparent,
 *    low-opacity copy. The original material reference is remembered (keyed by
 *    the mesh object itself) and restored on step change / toggle-off / exit /
 *    unmount, disposing the cloned ghost material.
 *  - Target meshes keep their original material so the amber highlight overlay
 *    (usePreviewHighlight) reads cleanly on top of them.
 *  - Meshes hidden by per-step visibility actions simply stay hidden — dimming
 *    a hidden mesh is harmless.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useWorkflowStore } from '../store/workflow.store';
import { useConfiguratorStore } from '../store/configurator.store';

const GHOST_OPACITY = 0.15;

type MeshMaterial = THREE.Material | THREE.Material[];

function cloneDimmed(material: THREE.Material): THREE.Material {
  const clone = material.clone();
  clone.transparent = true;
  clone.opacity = GHOST_OPACITY;
  clone.depthWrite = false;
  clone.needsUpdate = true;
  return clone;
}

function dimMaterial(mat: MeshMaterial): MeshMaterial {
  return Array.isArray(mat) ? mat.map(cloneDimmed) : cloneDimmed(mat);
}

function disposeMaterial(mat: MeshMaterial): void {
  if (Array.isArray(mat)) mat.forEach((m) => m.dispose?.());
  else mat.dispose?.();
}

/** Restore every dimmed mesh to its original material and dispose the clone. */
function restoreAll(originals: Map<THREE.Mesh, MeshMaterial>): void {
  originals.forEach((orig, mesh) => {
    const current = mesh.material;
    mesh.material = orig;
    if (current && current !== orig) disposeMaterial(current);
  });
  originals.clear();
}

export function usePreviewGhost() {
  const meshes = useConfiguratorStore((s) => s.meshes);

  const isPreviewMode = useWorkflowStore((s) => s.isPreviewMode);
  const ghostNonTargets = useWorkflowStore((s) => s.ghostNonTargets);
  const activeStepId = useWorkflowStore((s) => s.activeStepId);
  const steps = useWorkflowStore((s) => s.steps);
  const targets = useWorkflowStore((s) => s.targets);

  // Keyed by the mesh object so restore never depends on a (possibly stale)
  // meshes array snapshot.
  const originalsRef = useRef<Map<THREE.Mesh, MeshMaterial>>(new Map());

  useEffect(() => {
    // Always reset to a clean baseline before (re)applying.
    restoreAll(originalsRef.current);

    if (!isPreviewMode || !ghostNonTargets || !activeStepId) return;

    const step = steps[activeStepId];
    if (!step) return;

    const targetMeshIds = new Set<string>();
    for (const targetId of step.targetIds) {
      const target = targets[targetId];
      if (target) targetMeshIds.add(target.meshId);
    }

    for (const configMesh of meshes) {
      if (targetMeshIds.has(configMesh.id)) continue; // keep targets bright
      const mesh = configMesh.ref;
      if (!mesh.material) continue;
      originalsRef.current.set(mesh, mesh.material);
      mesh.material = dimMaterial(mesh.material);
    }
  }, [isPreviewMode, ghostNonTargets, activeStepId, steps, targets, meshes]);

  // Safety net: restore on unmount.
  useEffect(() => {
    const originals = originalsRef.current;
    return () => restoreAll(originals);
  }, []);
}
