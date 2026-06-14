/**
 * Tests for ThreeUtils — id generation, colour conversion, camera framing
 * helpers and resource disposal.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { ThreeUtils } from './three.utils';

beforeEach(() => {
  // Silence the informational logging inside fitCameraToObjects.
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('generateId', () => {
  it('produces unique, timestamp-prefixed ids', () => {
    const a = ThreeUtils.generateId();
    const b = ThreeUtils.generateId();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^\d+_[a-z0-9]+$/);
  });
});

describe('colour conversion', () => {
  it('round-trips hex <-> THREE.Color', () => {
    const color = ThreeUtils.hexToColor('#ff0000');
    expect(color).toBeInstanceOf(THREE.Color);
    expect(ThreeUtils.colorToHex(color)).toBe('#ff0000');
  });
});

describe('getCameraPosition', () => {
  it('looks at the box centre and offsets the camera from it', () => {
    const box = new THREE.Box3(
      new THREE.Vector3(-1, -1, -1),
      new THREE.Vector3(1, 1, 1),
    );
    const { position, lookAt } = ThreeUtils.getCameraPosition(box);
    expect(lookAt.toArray()).toEqual([0, 0, 0]);
    // maxDim = 2 -> x offset = 2 * 0.5 = 1, y offset = 2 * 0.3 = 0.6
    expect(position.x).toBeCloseTo(1, 5);
    expect(position.y).toBeCloseTo(0.6, 5);
    expect(Number.isFinite(position.z)).toBe(true);
  });
});

describe('fitCameraToObjects', () => {
  it('falls back to a default viewpoint when there are no objects', () => {
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const controls = { target: new THREE.Vector3(9, 9, 9), update: vi.fn() };
    ThreeUtils.fitCameraToObjects(camera, [], controls);
    expect(camera.position.toArray()).toEqual([5, 5, 5]);
    expect(controls.target.toArray()).toEqual([0, 0, 0]);
    expect(controls.update).toHaveBeenCalled();
  });

  it('frames a real object and updates controls to its centre', () => {
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const controls = { target: new THREE.Vector3(), update: vi.fn() };
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
    mesh.position.set(5, 0, 0);
    ThreeUtils.fitCameraToObjects(camera, [mesh], controls);
    expect(controls.target.x).toBeCloseTo(5, 5);
    expect(Number.isFinite(camera.position.z)).toBe(true);
    expect(controls.update).toHaveBeenCalled();
  });
});

describe('disposeMesh', () => {
  it('disposes geometry and a single material', () => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial();
    const geoSpy = vi.spyOn(geometry, 'dispose');
    const matSpy = vi.spyOn(material, 'dispose');
    ThreeUtils.disposeMesh(new THREE.Mesh(geometry, material));
    expect(geoSpy).toHaveBeenCalled();
    expect(matSpy).toHaveBeenCalled();
  });

  it('disposes every material when the mesh has a material array', () => {
    const geometry = new THREE.BoxGeometry();
    const m1 = new THREE.MeshStandardMaterial();
    const m2 = new THREE.MeshStandardMaterial();
    const s1 = vi.spyOn(m1, 'dispose');
    const s2 = vi.spyOn(m2, 'dispose');
    ThreeUtils.disposeMesh(new THREE.Mesh(geometry, [m1, m2]));
    expect(s1).toHaveBeenCalled();
    expect(s2).toHaveBeenCalled();
  });
});
