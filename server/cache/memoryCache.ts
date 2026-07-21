interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  updatedAt: string;
}

class MemoryCache {
  private entries = new Map<string, CacheEntry<unknown>>();

  public set<T>(key: string, value: T, ttlMs: number) {
    this.entries.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      updatedAt: new Date().toISOString()
    });
  }

  public get<T>(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) return null;

    if (entry.expiresAt < Date.now()) {
      this.entries.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public getStale<T>(key: string): T | null {
    const entry = this.entries.get(key);
    return entry ? (entry.value as T) : null;
  }

  public meta(key: string) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    return {
      updatedAt: entry.updatedAt,
      expiresAt: new Date(entry.expiresAt).toISOString()
    };
  }
}

export const cache = new MemoryCache();
