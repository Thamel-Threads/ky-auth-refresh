import { KyInstance, Options } from 'ky';
import type { KyAuthRefreshOptions, KyAuthRefreshCache } from './types.js';

export interface CustomKyRequestConfig extends Options {
  skipAuthRefresh?: boolean;
}

export const defaultOptions: KyAuthRefreshOptions = {
  statusCodes: [401],
  pauseInstanceWhileRefreshing: false,
};

/**
 * Merges two options objects (options overwrites defaults).
 */
export function mergeOptions(
  defaults: KyAuthRefreshOptions,
  options: KyAuthRefreshOptions
): KyAuthRefreshOptions {
  return {
    ...defaults,
    ...options,
  };
}

/**
 * Returns TRUE: when error.response.status is contained in options.statusCodes
 * Returns FALSE: when error or error.response doesn't exist or options.statusCodes doesn't include response status
 */
export function shouldInterceptError(
  error: any,
  options: KyAuthRefreshOptions,
  instance: KyInstance,
  cache: KyAuthRefreshCache
): boolean {
  if (!error) {
    return false;
  }

  if (error.request?.skipAuthRefresh) {
    return false;
  }

  if (
    !(
      options.interceptNetworkError &&
      !error.response &&
      error.request?.status === 0
    ) &&
    (!error.response ||
      (options?.shouldRefresh
        ? !options.shouldRefresh(error)
        : !options.statusCodes?.includes(parseInt(error.response.status))))
  ) {
    return false;
  }

  // Copy request to response if there's a network error, so request can be modified and used in the retry
  if (!error.response) {
    error.response = {
      request: error.request,
    };
  }

  return (
    !options.pauseInstanceWhileRefreshing ||
    !cache.skipInstances.includes(instance)
  );
}

/**
 * Creates refresh call if it does not exist or returns the existing one.
 */
export function createRefreshCall(
  error: any,
  fn: (error: any) => Promise<any>,
  cache: KyAuthRefreshCache
): Promise<any> {
  if (!cache.refreshCall) {
    cache.refreshCall = fn(error);
    if (typeof cache.refreshCall.then !== 'function') {
      console.warn(
        '@thamel-threads/ky-auth-refresh requires `refreshTokenCall` to return a promise.'
      );
      return Promise.reject(
        new Error('refreshTokenCall must return a promise')
      );
    }
  }
  return cache.refreshCall;
}

/**
 * Creates request queue hook if it does not exist and returns its id.
 * Note: This function is not used in the current ky implementation as we handle
 * request queuing differently through the afterResponse hook.
 */
export function createRequestQueueHook(
  _instance: KyInstance,
  cache: KyAuthRefreshCache,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: KyAuthRefreshOptions
): number {
  if (typeof cache.requestQueueInterceptorId === 'undefined') {
    // Generate a unique ID for the hook
    cache.requestQueueInterceptorId = Math.random();

    // In ky, we don't need to modify the instance directly
    // The request queuing is handled by the afterResponse hook
  }
  return cache.requestQueueInterceptorId;
}

/**
 * Removes request queue hook and unset hook cached values.
 */
export function unsetCache(
  instance: KyInstance,
  cache: KyAuthRefreshCache
): void {
  // In ky, we don't need to remove hooks from the instance
  // as each instance is immutable and we create new instances
  cache.requestQueueInterceptorId = undefined;
  cache.refreshCall = undefined;
  cache.skipInstances = cache.skipInstances.filter(
    skipInstance => skipInstance !== instance
  );
}

/**
 * Returns instance that's going to be used when requests are retried
 */
export function getRetryInstance(
  instance: KyInstance,
  options: KyAuthRefreshOptions
): KyInstance {
  return options.retryInstance || instance;
}

/**
 * Resend failed ky request.
 */
export function resendFailedRequest(
  error: any,
  instance: KyInstance
): Promise<Response> {
  // Mark the request to skip auth refresh to avoid infinite loops
  const requestOptions = {
    skipAuthRefresh: true,
  };

  // Extract the URL and options from the original request
  const url = error.response.request.url;
  const options = {
    method: error.response.request.method,
    headers: error.response.request.headers,
    body: error.response.request.body,
    ...requestOptions,
  };

  return instance(url, options);
}
