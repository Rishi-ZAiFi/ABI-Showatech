/**
 * Tests for texture utilities. These focus on the branches that do NOT need a
 * real 2D canvas backend (unavailable under jsdom): material-type guards and
 * the "no maps present" path.
 */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { extractTexturePreviews, generatePlaceholder } from './texture.utils';

describe('extractTexturePreviews', () => {
  it('returns an empty object for non-standard materials', () => {
    expect(extractTexturePreviews(new THREE.MeshBasicMaterial())).toEqual({});
    expect(extractTexturePreviews(new THREE.MeshNormalMaterial())).toEqual({});
  });

  it('returns all-undefined previews for a standard material with no maps', () => {
    const result = extractTexturePreviews(new THREE.MeshStandardMaterial());
    expect(result.baseColorMap).toBeUndefined();
    expect(result.normalMap).toBeUndefined();
    expect(result.roughnessMap).toBeUndefined();
    expect(result.metallicMap).toBeUndefined();
    expect(result.aoMap).toBeUndefined();
  });
});

describe('generatePlaceholder', () => {
  it('returns a string without throwing (data URL, or empty when no 2D context)', () => {
    let out = '';
    expect(() => {
      out = generatePlaceholder('#123456');
    }).not.toThrow();
    expect(typeof out).toBe('string');
  });
});
