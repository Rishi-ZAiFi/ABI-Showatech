import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoaderService } from './loader.service';
import { CacheService } from './cache.service';

function file(name: string, bytes: number[] = [1, 2, 3]): File {
  return new File([new Uint8Array(bytes)], name);
}

beforeEach(() => {
  CacheService.clear();
});

describe('loadModelFromFile', () => {
  it('returns the cached object URL without re-reading the file', async () => {
    vi.spyOn(CacheService, 'get').mockReturnValue('blob:cached-url');
    const setSpy = vi.spyOn(CacheService, 'set');
    const url = await LoaderService.loadModelFromFile(file('jet.glb'));
    expect(url).toBe('blob:cached-url');
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('passes a .glb through directly and caches the resulting URL', async () => {
    vi.spyOn(CacheService, 'get').mockReturnValue(null);
    const setSpy = vi.spyOn(CacheService, 'set').mockImplementation(() => undefined);
    const url = await LoaderService.loadModelFromFile(file('jet.glb', [1, 2, 3, 4]));
    expect(url).toMatch(/^blob:/);
    expect(setSpy).toHaveBeenCalledOnce();
    expect(setSpy.mock.calls[0][0]).toBe('jet.glb');
  });

  it('throws on an unsupported file format', async () => {
    vi.spyOn(CacheService, 'get').mockReturnValue(null);
    await expect(LoaderService.loadModelFromFile(file('model.xyz'))).rejects.toThrow(
      /Unsupported file format: \.xyz/,
    );
  });
});
