import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAvatar, fetchAndCacheAvatar, prefetchAvatars, updateCachedAvatar } from './useAvatar';

// Mock the avatar cache
const mockAvatarCache: Record<string, string | null> = {};
vi.mock('../services/avatarCache', () => ({
  getCachedAvatarUrl: vi.fn((userId: string) => {
    if (userId in mockAvatarCache) {
      return mockAvatarCache[userId];
    }
    return undefined;
  }),
  cacheAvatarUrl: vi.fn((userId: string, url: string | null) => {
    mockAvatarCache[userId] = url;
  }),
  cacheAvatarUrls: vi.fn((entries: Array<{ userId: string; url: string | null }>) => {
    entries.forEach(({ userId, url }) => {
      mockAvatarCache[userId] = url;
    });
  }),
}));

// Mock supabase
const mockSupabaseSelect = vi.fn();
const mockSupabaseEq = vi.fn();
const mockSupabaseSingle = vi.fn();
const mockSupabaseIn = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSupabaseSelect,
    })),
  },
}));

describe('useAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockAvatarCache).forEach((key) => delete mockAvatarCache[key]);

    // Setup default mock chain
    mockSupabaseSelect.mockReturnValue({
      eq: mockSupabaseEq,
      in: mockSupabaseIn,
    });
    mockSupabaseEq.mockReturnValue({
      single: mockSupabaseSingle,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useAvatar hook', () => {
    it('returns null when userId is null', () => {
      const { result } = renderHook(() => useAvatar(null));

      expect(result.current.avatarUrl).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('returns null when userId is undefined', () => {
      const { result } = renderHook(() => useAvatar(undefined));

      expect(result.current.avatarUrl).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('returns cached avatar without fetching', async () => {
      const userId = 'user-123';
      const avatarUrl = 'https://example.com/avatar.jpg';
      mockAvatarCache[userId] = avatarUrl;

      const { result } = renderHook(() => useAvatar(userId));

      expect(result.current.avatarUrl).toBe(avatarUrl);
      expect(result.current.isLoading).toBe(false);
      expect(mockSupabaseSelect).not.toHaveBeenCalled();
    });

    it('fetches avatar from supabase when not cached', async () => {
      const userId = 'user-456';
      const avatarUrl = 'https://example.com/new-avatar.jpg';

      mockSupabaseSingle.mockResolvedValue({
        data: { avatar_url: avatarUrl },
        error: null,
      });

      const { result } = renderHook(() => useAvatar(userId));

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.avatarUrl).toBe(avatarUrl);
      expect(mockAvatarCache[userId]).toBe(avatarUrl);
    });

    it('handles null avatar_url from supabase', async () => {
      const userId = 'user-no-avatar';

      mockSupabaseSingle.mockResolvedValue({
        data: { avatar_url: null },
        error: null,
      });

      const { result } = renderHook(() => useAvatar(userId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.avatarUrl).toBeNull();
      expect(mockAvatarCache[userId]).toBeNull();
    });

    it('handles supabase error gracefully', async () => {
      const userId = 'user-error';
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSupabaseSingle.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const { result } = renderHook(() => useAvatar(userId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.avatarUrl).toBeNull();
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('refresh fetches new data even when cached', async () => {
      const userId = 'user-refresh';
      const oldUrl = 'https://example.com/old.jpg';
      const newUrl = 'https://example.com/new.jpg';
      mockAvatarCache[userId] = oldUrl;

      mockSupabaseSingle.mockResolvedValue({
        data: { avatar_url: newUrl },
        error: null,
      });

      const { result } = renderHook(() => useAvatar(userId));

      // Initially has cached value
      expect(result.current.avatarUrl).toBe(oldUrl);

      // Refresh should fetch new data
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.avatarUrl).toBe(newUrl);
      expect(mockSupabaseSelect).toHaveBeenCalled();
    });
  });

  describe('fetchAndCacheAvatar', () => {
    it('returns cached value without fetching', async () => {
      const userId = 'cached-user';
      const avatarUrl = 'https://example.com/cached.jpg';
      mockAvatarCache[userId] = avatarUrl;

      const result = await fetchAndCacheAvatar(userId);

      expect(result).toBe(avatarUrl);
      expect(mockSupabaseSelect).not.toHaveBeenCalled();
    });

    it('fetches and caches when not cached', async () => {
      const userId = 'fetch-user';
      const avatarUrl = 'https://example.com/fetch.jpg';

      mockSupabaseSingle.mockResolvedValue({
        data: { avatar_url: avatarUrl },
        error: null,
      });

      const result = await fetchAndCacheAvatar(userId);

      expect(result).toBe(avatarUrl);
      expect(mockAvatarCache[userId]).toBe(avatarUrl);
    });

    it('returns null on error', async () => {
      const userId = 'error-user';
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSupabaseSingle.mockResolvedValue({
        data: null,
        error: new Error('Fetch error'),
      });

      const result = await fetchAndCacheAvatar(userId);

      expect(result).toBeNull();
      consoleError.mockRestore();
    });
  });

  describe('prefetchAvatars', () => {
    it('does nothing with empty array', async () => {
      await prefetchAvatars([]);

      expect(mockSupabaseSelect).not.toHaveBeenCalled();
    });

    it('skips already cached IDs', async () => {
      mockAvatarCache['cached-1'] = 'https://example.com/1.jpg';
      mockAvatarCache['cached-2'] = 'https://example.com/2.jpg';

      await prefetchAvatars(['cached-1', 'cached-2']);

      expect(mockSupabaseSelect).not.toHaveBeenCalled();
    });

    it('fetches only uncached IDs', async () => {
      mockAvatarCache['cached'] = 'https://example.com/cached.jpg';

      mockSupabaseIn.mockResolvedValue({
        data: [
          { id: 'uncached-1', avatar_url: 'https://example.com/1.jpg' },
          { id: 'uncached-2', avatar_url: null },
        ],
        error: null,
      });

      await prefetchAvatars(['cached', 'uncached-1', 'uncached-2']);

      expect(mockSupabaseIn).toHaveBeenCalledWith('id', ['uncached-1', 'uncached-2']);
      expect(mockAvatarCache['uncached-1']).toBe('https://example.com/1.jpg');
      expect(mockAvatarCache['uncached-2']).toBeNull();
    });

    it('handles errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSupabaseIn.mockResolvedValue({
        data: null,
        error: new Error('Batch fetch error'),
      });

      await prefetchAvatars(['user-1', 'user-2']);

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('updateCachedAvatar', () => {
    it('updates the cache with new URL', () => {
      const userId = 'update-user';
      const newUrl = 'https://example.com/updated.jpg';

      updateCachedAvatar(userId, newUrl);

      expect(mockAvatarCache[userId]).toBe(newUrl);
    });

    it('updates the cache with null', () => {
      const userId = 'remove-user';
      mockAvatarCache[userId] = 'https://example.com/old.jpg';

      updateCachedAvatar(userId, null);

      expect(mockAvatarCache[userId]).toBeNull();
    });
  });
});
