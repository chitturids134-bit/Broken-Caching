class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = parseInt(process.env.CACHE_TTL) || 300; // default 5 minutes
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  // Clear all keys that start with a namespace
  clearNamespace(namespace) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(namespace)) {
        this.cache.delete(key);
      }
    }
  }

  has(key) {
    return this.get(key) !== null;
  }
}

module.exports = new CacheService();
