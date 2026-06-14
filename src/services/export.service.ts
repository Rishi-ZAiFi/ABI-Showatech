/**
 * Export Service — Slice 09
 *
 * Bundles the workflow snapshot + the 3D model (GLB) into a single ZIP package
 * and triggers a browser download.
 *
 * Output structure:
 *   <workflow_name>.showatec-pkg/
 *     manifest.json          — package metadata
 *     workflow.json          — WorkflowSnapshot (domain data)
 *     model.glb              — re-exported scene via GLTFExporter
 *
 * No backend, no cloud. Pure browser-side ZIP via fflate.
 */

import { zipSync, strToU8 } from 'fflate';
import * as THREE from 'three';
import { GLBExporter } from '../three/exporters/exportToGLB';
import type { WorkflowSnapshot } from './persistence.service';

// ---------------------------------------------------------------------------
// Manifest type
// ---------------------------------------------------------------------------

export interface PackageManifest {
  version: 1;
  packageType: 'showatec-workflow-package';
  createdAt: number;
  workflowName: string;
  modelFileName: string;
  workflowFileName: string;
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

/**
 * Export the current workflow + 3D model as a downloadable ZIP package.
 *
 * @param scene       The loaded THREE.Group from the configurator store.
 * @param snapshot    The current WorkflowSnapshot built from workflow store state.
 * @param modelName   Human-readable model filename (used for the .glb name inside the zip).
 */
export async function exportPackage(
  scene: THREE.Group,
  snapshot: WorkflowSnapshot,
  modelName: string,
): Promise<void> {
  const workflowName = snapshot.workflow?.name ?? 'workflow';
  const safeModelName = modelName.replace(/\.[^.]+$/, '') || 'model'; // strip extension
  const glbFileName = `${safeModelName}.glb`;
  const workflowFileName = 'workflow.json';
  const manifestFileName = 'manifest.json';

  // ── 1. Export GLB ────────────────────────────────────────────────────────
  const glbBlob = await GLBExporter.exportToGlb(scene);
  const glbBuffer = await glbBlob.arrayBuffer();

  // ── 2. Build manifest ────────────────────────────────────────────────────
  const manifest: PackageManifest = {
    version: 1,
    packageType: 'showatec-workflow-package',
    createdAt: Date.now(),
    workflowName,
    modelFileName: glbFileName,
    workflowFileName,
  };

  // ── 3. ZIP it up ─────────────────────────────────────────────────────────
  const zipEntries: Record<string, Uint8Array> = {
    [manifestFileName]: strToU8(JSON.stringify(manifest, null, 2)),
    [workflowFileName]: strToU8(JSON.stringify(snapshot, null, 2)),
    [glbFileName]: new Uint8Array(glbBuffer),
  };

  const zipped = zipSync(zipEntries, {
    // Store GLB uncompressed (already binary-packed) to avoid CPU overhead
    [glbFileName]: { level: 0 },
  });

  // ── 4. Trigger download ──────────────────────────────────────────────────
  const blob = new Blob([zipped], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const zipName = `${workflowName.replace(/\s+/g, '_')}.showatec-pkg.zip`;

  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
