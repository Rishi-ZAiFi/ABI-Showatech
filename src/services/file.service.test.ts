/**
 * Tests for the File service — format validation, extension parsing and the
 * FileReader / Blob / object-URL helpers.
 */
import { describe, expect, it, vi } from 'vitest';
import { FileService } from './file.service';

function file(name: string, bytes: number[] = []): File {
  return new File([new Uint8Array(bytes)], name);
}

describe('isSupportedFormat', () => {
  it.each(['model.glb', 'model.gltf', 'model.fbx', 'model.obj'])(
    'accepts %s',
    (name) => {
      expect(FileService.isSupportedFormat(file(name))).toBe(true);
    },
  );

  it('is case-insensitive', () => {
    expect(FileService.isSupportedFormat(file('MODEL.GLB'))).toBe(true);
  });

  it('rejects unsupported formats', () => {
    expect(FileService.isSupportedFormat(file('image.png'))).toBe(false);
    expect(FileService.isSupportedFormat(file('archive.zip'))).toBe(false);
  });
});

describe('getFileExtension', () => {
  it('returns the lowercased dotted extension', () => {
    expect(FileService.getFileExtension(file('Scene.GLTF'))).toBe('.gltf');
  });
});

describe('readAsArrayBuffer', () => {
  it('reads file contents into an ArrayBuffer', async () => {
    const buf = await FileService.readAsArrayBuffer(file('x.bin', [1, 2, 3, 4]));
    expect(buf).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(buf)).toEqual(new Uint8Array([1, 2, 3, 4]));
  });
});

describe('blob + object-url helpers', () => {
  it('wraps an ArrayBuffer in a typed Blob', () => {
    const blob = FileService.arrayBufferToBlob(new Uint8Array([1, 2]).buffer, 'model/gltf-binary');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('model/gltf-binary');
    expect(blob.size).toBe(2);
  });

  it('creates and revokes an object URL', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    const url = FileService.createObjectUrl(new Blob(['x']));
    expect(url).toMatch(/^blob:/);
    FileService.revokeObjectUrl(url);
    expect(revoke).toHaveBeenCalledWith(url);
  });
});
