/**
 * Tests for the Cache service — an in-memory LRU-ish cache of converted model
 * object URLs with a byte budget and eviction of the oldest entry.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheService } from './cache.service';

const MB = 1024 * 1024;

beforeEach(() => {
  CacheService.clear();
});

describe('set / get / has', () => {
  it('stores and retrieves an entry', () => {
    CacheService.set('a.glb', 'blob:a', 10);
    expect(CacheService.has('a.glb')).toBe(true);
    expect(CacheService.get('a.glb')).toBe('blob:a');
  });

  it('returns null for a missing entry', () => {
    expect(CacheService.get('missing.glb')).toBeNull();
    expect(CacheService.has('missing.glb')).toBe(false);
  });
});

describe('getStats', () => {
  it('reports entry count and accumulated size', () => {
    CacheService.set('a', 'blob:a', 100);
    CacheService.set('b', 'blob:b', 250);
    const stats = CacheService.getStats();
    expect(stats.entries).toBe(2);
    expect(stats.size).toBe(350);
    expect(stats.maxSize).toBe(500 * MB);
  });
});

describe('eviction', () => {
  it('evicts the oldest entry when the budget is exceeded', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    CacheService.set('old.glb', 'blob:old', 400 * MB);
    CacheService.set('new.glb', 'blob:new', 200 * MB); // 600MB > 500MB budget

    expect(CacheService.has('old.glb')).toBe(false);
    expect(CacheService.has('new.glb')).toBe(true);
    expect(revoke).toHaveBeenCalledWith('blob:old');
    expect(CacheService.getStats().size).toBe(200 * MB);
  });
});

describe('clear', () => {
  it('revokes every URL and resets the cache', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    CacheService.set('a', 'blob:a', 10);
    CacheService.set('b', 'blob:b', 20);
    CacheService.clear();
    expect(revoke).toHaveBeenCalledTimes(2);
    expect(CacheService.getStats()).toMatchObject({ entries: 0, size: 0 });
  });
});
