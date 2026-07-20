export class LRUCache {
  constructor(capacity, ttlMs) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error("Cache capacity must be a positive integer");
    }

    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new Error("Cache TTL must be a positive number");
    }

    this.capacity = capacity;
    this.ttlMs = ttlMs;
    this.store = new Map();

    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.expirations = 0;
  }

  get(key) {
    if (!this.store.has(key)) {
      this.misses++;
      return null;
    }

    const entry = this.store.get(key);

    if (this.isExpired(entry)) {
      this.store.delete(key);
      this.expirations++;
      this.misses++;
      return null;
    }

    // Move the accessed item to the end of Map.
    // The end represents the most recently used item.
    this.store.delete(key);
    this.store.set(key, entry);

    this.hits++;

    return entry.value;
  }

  set(key, value) {
    if (this.store.has(key)) {
      this.store.delete(key);
    }

    if (this.store.size >= this.capacity) {
      this.evictLeastRecentlyUsed();
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs
    });
  }

  delete(key) {
    return this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  deleteByPath(pathPrefix) {
    for (const key of this.store.keys()) {
      if (key.includes(pathPrefix)) {
        this.store.delete(key);
      }
    }
  }

  isExpired(entry) {
    return Date.now() >= entry.expiresAt;
  }

  evictLeastRecentlyUsed() {
    const oldestKey = this.store.keys().next().value;

    if (oldestKey !== undefined) {
      this.store.delete(oldestKey);
      this.evictions++;
    }
  }

  getStats() {
    const totalLookups = this.hits + this.misses;

    const hitRate =
      totalLookups === 0
        ? 0
        : (this.hits / totalLookups) * 100;

    return {
      size: this.store.size,
      capacity: this.capacity,
      ttlMs: this.ttlMs,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      expirations: this.expirations,
      hitRate: `${hitRate.toFixed(2)}%`
    };
  }
}