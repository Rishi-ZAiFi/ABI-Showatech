/**
 * Tests for the Export service — bundles the workflow snapshot + GLB model into
 * a ZIP package and triggers a browser download. The heavy GLB exporter is
 * mocked; we then unzip the produced blob to assert package structure.
 */
import { describe, expect, it, vi } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import * as THREE from 'three';
import { exportPackage, type PackageManifest } from './export.service';
import type { WorkflowSnapshot } from './persistence.service';

vi.mock('../three/exporters/exportToGLB', () => ({
  GLBExporter: {
    exportToGlb: vi.fn(async () => new Blob([new Uint8Array([10, 20, 30, 40])])),
  },
}));

function snapshot(name = 'My Flow'): WorkflowSnapshot {
  return {
    version: 1,
    exportedAt: 0,
    workflow: { id: 'w', name, description: '', stepIds: [], createdAt: 0, updatedAt: 0 },
    steps: {},
    targets: {},
    annotations: {},
  };
}

function captureDownload() {
  let anchor: HTMLAnchorElement | undefined;
  const realCreate = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = realCreate(tag) as HTMLElement;
    if (tag === 'a') {
      (el as HTMLAnchorElement).click = vi.fn();
      anchor = el as HTMLAnchorElement;
    }
    return el;
  });
  return () => anchor;
}

describe('exportPackage', () => {
  it('produces a zip containing manifest.json, workflow.json and the model GLB', async () => {
    const getAnchor = captureDownload();
    const urlSpy = vi.spyOn(URL, 'createObjectURL');

    await exportPackage(new THREE.Group(), snapshot('My Flow'), 'jet.glb');

    // The zip blob is the argument passed to createObjectURL.
    const zipBlob = urlSpy.mock.calls.at(-1)![0] as Blob;
    const buf = await zipBlob.arrayBuffer();
    const entries = unzipSync(new Uint8Array(buf));
    const names = Object.keys(entries);

    expect(names).toContain('manifest.json');
    expect(names).toContain('workflow.json');
    expect(names).toContain('jet.glb'); // extension stripped + .glb

    const manifest = JSON.parse(strFromU8(entries['manifest.json'])) as PackageManifest;
    expect(manifest.packageType).toBe('showatec-workflow-package');
    expect(manifest.workflowName).toBe('My Flow');
    expect(manifest.modelFileName).toBe('jet.glb');

    // Download filename sanitises spaces.
    expect(getAnchor()?.download).toBe('My_Flow.showatec-pkg.zip');
  });

  it('round-trips the workflow snapshot inside the package', async () => {
    const urlSpy = vi.spyOn(URL, 'createObjectURL');
    captureDownload();

    await exportPackage(new THREE.Group(), snapshot('Round Trip'), 'model.fbx');

    const zipBlob = urlSpy.mock.calls.at(-1)![0] as Blob;
    const entries = unzipSync(new Uint8Array(await zipBlob.arrayBuffer()));
    const parsed = JSON.parse(strFromU8(entries['workflow.json'])) as WorkflowSnapshot;
    expect(parsed.workflow?.name).toBe('Round Trip');
    // .fbx extension stripped to base name + .glb
    expect(Object.keys(entries)).toContain('model.glb');
  });
});
