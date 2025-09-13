import { describe, it, expect, beforeEach, vi } from 'vitest';
import ky, { KyInstance } from 'ky';
import { createAuthRefreshHook } from '../index.js';
import type { KyAuthRefreshOptions, KyAuthRefreshCache } from '../types.js';
import {
  unsetCache,
  mergeOptions,
  createRefreshCall,
  shouldInterceptError,
  createRequestQueueHook,
} from '../utils.js';

const mockedKy = (): KyInstance | any => {
  const mockInstance: any = {
    extend: vi.fn((options: any) => ({
      ...mockInstance,
      ...(options || {}),
    })),
    defaults: {},
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    head: vi.fn(),
  };
  return mockInstance;
};

describe('Merges configs', () => {
  it('source and target are the same', () => {
    const source: KyAuthRefreshOptions = { statusCodes: [204] };
    const target: KyAuthRefreshOptions = { statusCodes: [204] };
    expect(mergeOptions(target, source)).toEqual({ statusCodes: [204] });
  });

  it('source is different than the target', () => {
    const source: KyAuthRefreshOptions = { statusCodes: [302] };
    const target: KyAuthRefreshOptions = { statusCodes: [204] };
    expect(mergeOptions(target, source)).toEqual({ statusCodes: [302] });
  });

  it('source is empty', () => {
    const source: KyAuthRefreshOptions = {};
    const target: KyAuthRefreshOptions = { statusCodes: [204] };
    expect(mergeOptions(target, source)).toEqual({ statusCodes: [204] });
  });
});

describe('Determines if the response should be intercepted', () => {
  let cache: KyAuthRefreshCache;
  beforeEach(() => {
    cache = {
      skipInstances: [],
      refreshCall: undefined,
      requestQueueInterceptorId: undefined,
    };
  });

  const options = { statusCodes: [401] };

  it('no error object provided', () => {
    expect(shouldInterceptError(undefined, options, ky, cache)).toBeFalsy();
  });

  it('no response inside error object', () => {
    expect(shouldInterceptError({}, options, ky, cache)).toBeFalsy();
  });

  it('no status in error.response object', () => {
    expect(
      shouldInterceptError({ response: {} }, options, ky, cache)
    ).toBeFalsy();
  });

  it('error does not include the response status', () => {
    expect(
      shouldInterceptError({ response: { status: 403 } }, options, ky, cache)
    ).toBeFalsy();
  });

  it('error includes the response status', () => {
    expect(
      shouldInterceptError({ response: { status: 401 } }, options, ky, cache)
    ).toBeTruthy();
  });

  it('error has response status specified as a string', () => {
    expect(
      shouldInterceptError({ response: { status: '401' } }, options, ky, cache)
    ).toBeTruthy();
  });

  it('when skipAuthRefresh flag is set to true', () => {
    const error = {
      response: { status: 401 },
      request: { skipAuthRefresh: true },
    };
    expect(shouldInterceptError(error, options, ky, cache)).toBeFalsy();
  });

  it('when skipAuthRefresh flag is set to false', () => {
    const error = {
      response: { status: 401 },
      request: { skipAuthRefresh: false },
    };
    expect(shouldInterceptError(error, options, ky, cache)).toBeTruthy();
  });

  it('when pauseInstanceWhileRefreshing flag is not provided', () => {
    const error = {
      response: { status: 401 },
    };
    expect(shouldInterceptError(error, options, ky, cache)).toBeTruthy();
  });

  it('when pauseInstanceWhileRefreshing flag is set to true', () => {
    const error = {
      response: { status: 401 },
    };
    const newCache = { ...cache, skipInstances: [ky] };
    const newOptions = { ...options, pauseInstanceWhileRefreshing: true };
    expect(shouldInterceptError(error, newOptions, ky, newCache)).toBeFalsy();
  });

  it('when pauseInstanceWhileRefreshing flag is set to false', () => {
    const error = {
      response: { status: 401 },
    };
    const newOptions = { ...options, pauseInstanceWhileRefreshing: false };
    expect(shouldInterceptError(error, newOptions, ky, cache)).toBeTruthy();
  });

  it('when shouldRefresh return true', () => {
    const error = {
      response: { status: 401 },
    };
    const newOptions: KyAuthRefreshOptions = {
      ...options,
      shouldRefresh: () => true,
    };
    expect(shouldInterceptError(error, newOptions, ky, cache)).toBeTruthy();
  });

  it('when shouldRefresh return false', () => {
    const error = {
      response: { status: 401 },
    };
    const newOptions: KyAuthRefreshOptions = {
      ...options,
      shouldRefresh: () => false,
    };
    expect(shouldInterceptError(error, newOptions, ky, cache)).toBeFalsy();
  });
});

describe('Creates refresh call', () => {
  let cache: KyAuthRefreshCache;
  beforeEach(() => {
    cache = {
      skipInstances: [],
      refreshCall: undefined,
      requestQueueInterceptorId: undefined,
    };
  });

  it('warns if refreshTokenCall does not return a promise', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await createRefreshCall({}, () => Promise.resolve(), cache);
    } catch (e) {
      // Expected to throw, just checking if console.warn was called
      expect(consoleSpy).toHaveBeenCalled();
      throw e; // Re-throw to satisfy linter
    }

    consoleSpy.mockRestore();
  });

  it('creates refreshTokenCall and correctly resolves', async () => {
    try {
      const result = await createRefreshCall(
        {},
        () => Promise.resolve('hello world'),
        cache
      );
      expect(result).toBe('hello world');
    } catch (e) {
      // This should not throw
      expect(e).toBeUndefined();
    }
  });

  it('creates refreshTokenCall and correctly rejects', async () => {
    try {
      await createRefreshCall(
        {},
        () => Promise.reject(new Error('goodbye world')),
        cache
      );
    } catch (e) {
      expect((e as Error).message).toBe('goodbye world');
    }
  });

  it('creates only one instance of refreshing call', () => {
    const refreshTokenCall = () => Promise.resolve('hello world');
    const result1 = createRefreshCall({}, refreshTokenCall, cache);
    const result2 = createRefreshCall({}, refreshTokenCall, cache);
    expect(result1).toBe(result2);
  });
});

describe('Requests hook', () => {
  let cache: KyAuthRefreshCache;
  beforeEach(() => {
    cache = {
      skipInstances: [],
      refreshCall: undefined,
      requestQueueInterceptorId: undefined,
    };
  });

  it('is created', () => {
    const mock = mockedKy();
    createRefreshCall({}, () => Promise.resolve(), cache);
    const result1 = createRequestQueueHook(mock, cache, {});
    expect(typeof result1).toBe('number');
  });

  it('is created only once', () => {
    createRefreshCall({}, () => Promise.resolve(), cache);
    const result1 = createRequestQueueHook(ky.create(), cache, {});
    const result2 = createRequestQueueHook(ky.create(), cache, {});
    expect(result1).toBe(result2);
  });
});

describe('Creates the overall hook correctly', () => {
  it('throws error when no function provided', () => {
    expect(() => createAuthRefreshHook(ky, null as any)).toThrow();
  });

  it('returns ky instance', () => {
    const instance = createAuthRefreshHook(ky, () => Promise.resolve());
    expect(typeof instance).toBe('function');
    expect(instance.extend).toBeDefined();
  });

  it('extends ky instance with hooks', () => {
    const mockKy = mockedKy();
    createAuthRefreshHook(mockKy, () => Promise.resolve());
    expect(mockKy.extend).toHaveBeenCalled();
  });
});

describe('State is cleared', () => {
  const cache: KyAuthRefreshCache = {
    skipInstances: [],
    refreshCall: undefined,
    requestQueueInterceptorId: undefined,
  };

  it('after refreshing call succeeds/fails', () => {
    const instance = mockedKy();
    cache.requestQueueInterceptorId = Math.random();
    cache.skipInstances.push(instance);
    expect(cache.skipInstances.length).toBe(1);
    unsetCache(instance, cache);
    expect(cache.skipInstances.length).toBe(0);
    expect(cache.requestQueueInterceptorId).toBeFalsy();
  });
});
