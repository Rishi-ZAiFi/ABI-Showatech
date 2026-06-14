/**
 * Tests for ModelParser — extracts ConfigMesh/ConfigMaterial entries from a
 * loaded THREE scene graph, deriving stable name-based ids (deduped) and
 * de-duplicating shared materials.
 */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ModelParser } from './ModelParser';

function buildScene(): THREE.Group {
  const group = new THREE.Group();

  const steel = new THREE.MeshStandardMaterial({ color: '#ff0000' });
  steel.name = 'Steel';
  const unnamedMat = new THREE.MeshStandardMaterial({ color: '#00ff00' });

  const panelA = new THREE.Mesh(new THREE.BoxGeometry(), steel);
  panelA.name = 'Panel';
  const panelB = new THREE.Mesh(new THREE.BoxGeometry(), steel); // duplicate name + shared material
  panelB.name = 'Panel';
  const bolt = new THREE.Mesh(new THREE.BoxGeometry(), unnamedMat);
  bolt.name = 'Bolt';
  const unnamed = new THREE.Mesh(new THREE.BoxGeometry(), unnamedMat); // no name

  group.add(panelA, panelB, bolt, unnamed);
  return group;
}

describe('parse', () => {
  it('derives stable, deduplicated mesh ids from names', () => {
    const { meshes } = ModelParser.parse(buildScene());
    expect(meshes.map((m) => m.id)).toEqual(['Panel', 'Panel__2', 'Bolt', 'Mesh_3']);
    expect(meshes.every((m) => m.visible)).toBe(true);
  });

  it('de-duplicates shared materials and links meshes to them', () => {
    const { meshes, materials } = ModelParser.parse(buildScene());
    expect(materials).toHaveLength(2);
    // Both panels share the same material id.
    expect(meshes[0].materialId).toBe(meshes[1].materialId);
    expect(meshes[0].materialId).toBe(materials[0].id);
    // Bolt + unnamed share the other material.
    expect(meshes[2].materialId).toBe(meshes[3].materialId);
    expect(meshes[2].materialId).toBe(materials[1].id);
  });

  it('captures material names, colours and (absent) texture flags', () => {
    const { materials } = ModelParser.parse(buildScene());
    expect(materials[0].name).toBe('Steel');
    expect(materials[0].color).toBe('#ff0000');
    expect(materials[0].hasBaseColorMap).toBe(false);
    expect(materials[1].name).toMatch(/^Material_/); // fallback name for unnamed material
  });

  it('falls back to #CCCCCC for materials with no readable colour', () => {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshNormalMaterial());
    mesh.name = 'Widget';
    group.add(mesh);
    const { materials } = ModelParser.parse(group);
    expect(materials[0].color).toBe('#CCCCCC');
  });

  it('returns empty arrays for a scene with no meshes', () => {
    const { meshes, materials } = ModelParser.parse(new THREE.Group());
    expect(meshes).toEqual([]);
    expect(materials).toEqual([]);
  });
});

describe('parseAnimations', () => {
  it('maps THREE clips to ConfigModel animation clips', () => {
    const clipA = new THREE.AnimationClip('Open', 2.5, []);
    const clipB = new THREE.AnimationClip('', 1, []); // unnamed -> generated name
    const result = ModelParser.parseAnimations([clipA, clipB]);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ name: 'Open', duration: 2.5 });
    expect(result[1].name).toBe('Animation 2');
    expect(result[0].id).not.toBe(result[1].id);
  });
});
