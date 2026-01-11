/**
 * Avatar URL caching using session storage
 * Caches friend profile picture URLs to reduce redundant fetches
 */

const CACHE_KEY = 'avatar_cache';
const CACHE_VERSION = 1;

interface AvatarCacheEntry {
  url: string | null;
  cachedAt: number;
}

interface AvatarCache {
  version: number;
  entries: Record<string, AvatarCacheEntry>;
}

// Cache duration: 1 hour (in milliseconds)
const CACHE_DURATION_MS = 60 * 60 * 1000;

const getCache = (): AvatarCache => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) {
      return { version: CACHE_VERSION, entries: {} };
    }

    const parsed = JSON.parse(cached) as AvatarCache;

    // Clear cache if version mismatch
    if (parsed.version !== CACHE_VERSION) {
      return { version: CACHE_VERSION, entries: {} };
    }

    return parsed;
  } catch {
    return { version: CACHE_VERSION, entries: {} };
  }
};

const saveCache = (cache: AvatarCache): void => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Session storage might be full or disabled
    console.warn('Failed to save avatar cache');
  }
};

/**
 * Get a cached avatar URL for a user
 * Returns undefined if not cached or expired
 */
export const getCachedAvatarUrl = (userId: string): string | null | undefined => {
  const cache = getCache();
  const entry = cache.entries[userId];

  if (!entry) {
    return undefined; // Not cached
  }

  // Check if cache entry has expired
  if (Date.now() - entry.cachedAt > CACHE_DURATION_MS) {
    return undefined; // Expired
  }

  return entry.url;
};

/**
 * Cache an avatar URL for a user
 */
export const cacheAvatarUrl = (userId: string, url: string | null): void => {
  const cache = getCache();

  cache.entries[userId] = {
    url,
    cachedAt: Date.now(),
  };

  saveCache(cache);
};

/**
 * Cache multiple avatar URLs at once (for batch operations like feed loading)
 */
export const cacheAvatarUrls = (entries: Array<{ userId: string; url: string | null }>): void => {
  const cache = getCache();
  const now = Date.now();

  entries.forEach(({ userId, url }) => {
    cache.entries[userId] = {
      url,
      cachedAt: now,
    };
  });

  saveCache(cache);
};

/**
 * Clear the entire avatar cache
 */
export const clearAvatarCache = (): void => {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore errors
  }
};

/**
 * Remove expired entries from the cache
 */
export const pruneAvatarCache = (): void => {
  const cache = getCache();
  const now = Date.now();

  Object.keys(cache.entries).forEach((userId) => {
    if (now - cache.entries[userId].cachedAt > CACHE_DURATION_MS) {
      delete cache.entries[userId];
    }
  });

  saveCache(cache);
};
