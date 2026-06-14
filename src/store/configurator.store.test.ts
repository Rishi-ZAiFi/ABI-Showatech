/**
 * Tests for the Configurator store — model metadata, mesh/material
 * extraction, single + multi mesh selection, part groups, visibility
 * toggling and material colour edits.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { useConfiguratorStore } from './configurator.store';
import { PART_GROUP_COLORS } from '../types/PartGroup';
import type { ConfigMesh } from '../types/ConfigMesh';
import type { ConfigMaterial } from '../types/ConfigMaterial';

const cfg = () => useConfiguratorStore.getState();

function makeMesh(id: string, visible = true): ConfigMesh {
  return { id, name: id, visible, materialId: 'mat', ref: new THREE.Mesh() };
}

function makeStandardMaterial(id: string, color = '#ffffff'): ConfigMaterial {
  return {
    id,
    name: id,
    color,
    ref: new THREE.MeshStandardMaterial({ color }),
    hasBaseColorMap: false,
    hasNormalMap: false,
    hasRoughnessMap: false,
    hasMetallicMap: false,
    hasAmbientOcclusionMap: false,
  };
}

beforeEach(() => {
  cfg().reset();
});

describe('model + scene setters', () => {
  it('stores model url and name', () => {
    cfg().setModelUrl('blob:abc', 'jet.glb');
    expect(cfg().modelUrl).toBe('blob:abc');
    expect(cfg().modelName).toBe('jet.glb');
  });

  it('setMeshes replaces meshes and clears groups + selection', () => {
    useConfiguratorStore.setState({
      partGroups: [{ id: 'g', name: 'g', tag: '', color: '#fff', meshIds: ['a'] }],
      selectedMeshId: 'a',
      selectedMeshIds: ['a'],
    });
    cfg().setMeshes([makeMesh('a'), makeMesh('b')]);
    expect(cfg().meshes).toHaveLength(2);
    expect(cfg().partGroups).toEqual([]);
    expect(cfg().selectedMeshId).toBeNull();
    expect(cfg().selectedMeshIds).toEqual([]);
  });

  it('addMaterial enriches a non-standard material with all-false texture flags', () => {
    cfg().addMaterial({
      id: 'm',
      name: 'basic',
      color: '#fff',
      ref: new THREE.MeshBasicMaterial(),
    } as ConfigMaterial);
    const mat = cfg().materials[0];
    expect(mat.hasBaseColorMap).toBe(false);
    expect(mat.hasNormalMap).toBe(false);
  });
});

describe('single-mesh selection', () => {
  it('setSelectedMeshId mirrors into selectedMeshIds', () => {
    cfg().setSelectedMeshId('m1');
    expect(cfg().selectedMeshId).toBe('m1');
    expect(cfg().selectedMeshIds).toEqual(['m1']);
    cfg().setSelectedMeshId(null);
    expect(cfg().selectedMeshIds).toEqual([]);
  });
});

describe('multi-mesh selection', () => {
  it('toggles meshes in and out and tracks the "primary" id', () => {
    cfg().toggleMeshInSelection('a');
    cfg().toggleMeshInSelection('b');
    expect(cfg().selectedMeshIds).toEqual(['a', 'b']);
    expect(cfg().selectedMeshId).toBe('b');

    cfg().toggleMeshInSelection('b'); // remove b
    expect(cfg().selectedMeshIds).toEqual(['a']);
    expect(cfg().selectedMeshId).toBe('a');

    cfg().toggleMeshInSelection('a'); // remove last
    expect(cfg().selectedMeshIds).toEqual([]);
    expect(cfg().selectedMeshId).toBeNull();
  });

  it('clearSelection empties everything', () => {
    cfg().toggleMeshInSelection('a');
    cfg().clearSelection();
    expect(cfg().selectedMeshIds).toEqual([]);
    expect(cfg().selectedMeshId).toBeNull();
  });
});

describe('mesh visibility', () => {
  it('toggles a single mesh visible flag', () => {
    cfg().setMeshes([makeMesh('a', true), makeMesh('b', true)]);
    cfg().toggleMeshVisibility('a');
    expect(cfg().meshes.find((m) => m.id === 'a')!.visible).toBe(false);
    cfg().toggleMeshVisibility('a');
    expect(cfg().meshes.find((m) => m.id === 'a')!.visible).toBe(true);
  });
});

describe('part groups', () => {
  it('creates a group with deduped meshIds and a cycled colour', () => {
    const g1 = cfg().createPartGroup('Cowling', ['a', 'a', 'b'], 'panel');
    expect(g1).not.toBeNull();
    expect(g1!.meshIds).toEqual(['a', 'b']);
    expect(g1!.tag).toBe('panel');
    expect(g1!.color).toBe(PART_GROUP_COLORS[0]);

    const g2 = cfg().createPartGroup('Wing', ['c']);
    expect(g2!.color).toBe(PART_GROUP_COLORS[1]);
    expect(cfg().partGroups).toHaveLength(2);
  });

  it('returns null and adds nothing for an empty mesh list', () => {
    expect(cfg().createPartGroup('Empty', [])).toBeNull();
    expect(cfg().partGroups).toHaveLength(0);
  });

  it('defaults a blank name to "Untitled Part"', () => {
    expect(cfg().createPartGroup('   ', ['a'])!.name).toBe('Untitled Part');
  });

  it('updates and removes a group', () => {
    const g = cfg().createPartGroup('A', ['a'])!;
    cfg().updatePartGroup(g.id, { name: 'Renamed', tag: 'fastener' });
    expect(cfg().partGroups[0].name).toBe('Renamed');
    expect(cfg().partGroups[0].tag).toBe('fastener');
    cfg().removePartGroup(g.id);
    expect(cfg().partGroups).toHaveLength(0);
  });

  it('toggles visibility of every member mesh at once', () => {
    cfg().setMeshes([makeMesh('a', true), makeMesh('b', true), makeMesh('c', true)]);
    const g = cfg().createPartGroup('AB', ['a', 'b'])!;

    cfg().togglePartGroupVisibility(g.id); // some visible -> hide all members
    expect(cfg().meshes.find((m) => m.id === 'a')!.visible).toBe(false);
    expect(cfg().meshes.find((m) => m.id === 'b')!.visible).toBe(false);
    expect(cfg().meshes.find((m) => m.id === 'c')!.visible).toBe(true); // untouched

    cfg().togglePartGroupVisibility(g.id); // none visible -> show all members
    expect(cfg().meshes.find((m) => m.id === 'a')!.visible).toBe(true);
    expect(cfg().meshes.find((m) => m.id === 'b')!.visible).toBe(true);
  });

  it('selects all member meshes of a group', () => {
    const g = cfg().createPartGroup('AB', ['a', 'b'])!;
    cfg().selectPartGroup(g.id);
    expect(cfg().selectedMeshIds).toEqual(['a', 'b']);
    expect(cfg().selectedMeshId).toBe('b');
  });

  it('setPartGroups replaces wholesale (used on import)', () => {
    cfg().createPartGroup('A', ['a']);
    cfg().setPartGroups([{ id: 'x', name: 'X', tag: '', color: '#000', meshIds: ['z'] }]);
    expect(cfg().partGroups).toHaveLength(1);
    expect(cfg().partGroups[0].id).toBe('x');
  });
});

describe('material colour', () => {
  it('updates both the ConfigMaterial.color and the live THREE material', () => {
    const mat = makeStandardMaterial('mat1', '#ffffff');
    useConfiguratorStore.setState({ materials: [mat] });
    cfg().setMaterialColor('mat1', '#ff0000');
    const updated = cfg().materials[0];
    expect(updated.color).toBe('#ff0000');
    const ref = updated.ref as THREE.MeshStandardMaterial;
    expect(ref.color.getHexString()).toBe('ff0000');
  });

  it('is a no-op for an unknown material id', () => {
    expect(() => cfg().setMaterialColor('nope', '#000')).not.toThrow();
  });
});

describe('animation + camera request counters', () => {
  it('sets animation speed / current / play state / time', () => {
    cfg().setAnimationSpeed(2);
    cfg().setCurrentAnimation('anim-1');
    cfg().setAnimationTime(1.5);
    cfg().toggleAnimationPlayPause();
    expect(cfg().animationSpeed).toBe(2);
    expect(cfg().currentAnimationId).toBe('anim-1');
    expect(cfg().animationTime).toBe(1.5);
    expect(cfg().isAnimationPlaying).toBe(true);
  });

  it('increments fit-camera and camera-capture request counters', () => {
    const beforeFit = cfg().fitCameraRequest;
    const beforeCap = cfg().cameraCaptureRequest;
    cfg().requestFitCamera();
    cfg().requestCameraCapture();
    expect(cfg().fitCameraRequest).toBe(beforeFit + 1);
    expect(cfg().cameraCaptureRequest).toBe(beforeCap + 1);
  });
});

describe('reset', () => {
  it('returns model + selection + group state to defaults', () => {
    cfg().setModelUrl('blob:x', 'm.glb');
    cfg().setMeshes([makeMesh('a')]);
    cfg().toggleMeshInSelection('a');
    cfg().createPartGroup('A', ['a']);
    cfg().reset();
    expect(cfg().modelUrl).toBeNull();
    expect(cfg().meshes).toEqual([]);
    expect(cfg().partGroups).toEqual([]);
    expect(cfg().selectedMeshIds).toEqual([]);
  });
});
