/**
 * Cache Service
 * Manages in-memory cache of converted models and metadata
 */

interface CacheEntry {
  url: string;
  timestamp: number;
  size: number;
}

export class CacheService {
  private static cache = new Map<string, CacheEntry>();
  private static readonly MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB
  private static currentSize = 0;

  /**
   * Check if file is already cached
   */
  static has(fileName: string): boolean {
    return this.cache.has(fileName);
  }

  /**
   * Get cached URL
   */
  static get(fileName: string): string | null {
    const entry = this.cache.get(fileName);
    return entry ? entry.url : null;
  }

  /**
   * Set cache entry
   */
  static set(fileName: string, url: string, size: number): void {
    // Remove oldest entries if cache is full
    while (this.currentSize + size > this.MAX_CACHE_SIZE && this.cache.size > 0) {
      this.evictOldest();
    }

    const entry: CacheEntry = {
      url,
      timestamp: Date.now(),
      size,
    };

    this.cache.set(fileName, entry);
    this.currentSize += size;
  }

  /**
   * Clear entire cache
   */
  static clear(): void {
    this.cache.forEach((entry) => {
      URL.revokeObjectURL(entry.url);
    });
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Get cache stats
   */
  static getStats() {
    return {
      entries: this.cache.size,
      size: this.currentSize,
      maxSize: this.MAX_CACHE_SIZE,
    };
  }

  /**
   * Evict oldest entry
   */
  private static evictOldest(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldest = key;
      }
    });

    if (oldest) {
      const entry = this.cache.get(oldest);
      if (entry) {
        URL.revokeObjectURL(entry.url);
        this.currentSize -= entry.size;
      }
      this.cache.delete(oldest);
    }
  }
}
