import { KyInstance } from 'ky';
import type { KyAuthRefreshOptions, KyAuthRefreshCache } from './types.js';
import {
  unsetCache,
  mergeOptions,
  defaultOptions,
  getRetryInstance,
  createRefreshCall,
  resendFailedRequest,
  shouldInterceptError,
  createRequestQueueHook,
} from './utils.js';

export type {
  KyAuthRefreshOptions,
  KyAuthRefreshRequestConfig,
} from './types.js';

/**
 * Creates an authentication refresh hook that binds to any error response.
 * If the response status code is one of the options.statusCodes, hook calls the refreshAuthCall
 * which must return a Promise. While refreshAuthCall is running, all the new requests are intercepted and are waiting
 * for the refresh call to resolve. While running the refreshing call, instance provided is marked as a paused instance
 * which indicates the hook to not intercept any responses from it. This is because you'd otherwise need to mark
 * the specific requests you make by yourself in order to make sure it's not intercepted. This behavior can be
 * turned off, but use it with caution as you need to mark the requests with `skipAuthRefresh` flag yourself in order to
 * not run into hooks loop.
 *
 * @param instance - Ky HTTP client instance
 * @param refreshAuthCall - refresh token call which must return a Promise
 * @param options - options for the hook @see defaultOptions
 * @returns new ky instance with auth refresh functionality
 */
export function createAuthRefreshHook(
  instance: KyInstance,
  refreshAuthCall: (error: any) => Promise<any>,
  options: KyAuthRefreshOptions = {}
): KyInstance {
  if (typeof refreshAuthCall !== 'function') {
    throw new Error(
      '@thamel-threads/ky-auth-refresh requires `refreshAuthCall` to be a function that returns a promise.'
    );
  }

  const cache: KyAuthRefreshCache = {
    skipInstances: [],
    refreshCall: undefined,
    requestQueueInterceptorId: undefined,
  };

  // Merge options with defaults
  const mergedOptions = mergeOptions(defaultOptions, options);

  // Add afterResponse hook to handle authentication errors
  const afterResponseHook = async (
    request: Request,
    requestOptions: any,
    response: Response
  ) => {
    const hookOptions = mergeOptions(mergedOptions, requestOptions);

    // Check if this request should skip auth refresh
    if (requestOptions?.skipAuthRefresh) {
      return response;
    }

    // Only handle error responses
    if (response.ok) {
      return response;
    }

    // Create a mock error object for compatibility with existing logic
    const mockError = {
      response: {
        status: response.status,
        request: request,
      },
      request: request,
      options: requestOptions,
    };

    if (!shouldInterceptError(mockError, hookOptions, instance, cache)) {
      return response;
    }

    if (hookOptions.pauseInstanceWhileRefreshing) {
      cache.skipInstances.push(instance);
    }

    // If refresh call does not exist, create one
    const refreshing = createRefreshCall(mockError, refreshAuthCall, cache);

    // Create hook that will bind all the others requests until refreshAuthCall is resolved
    createRequestQueueHook(instance, cache, hookOptions);

    try {
      await refreshing;
      // Retry the failed request
      const retryInstance = getRetryInstance(instance, hookOptions);
      const retryResponse = await resendFailedRequest(mockError, retryInstance);
      return retryResponse;
    } catch {
      // If refresh fails, return the original response
      return response;
    } finally {
      unsetCache(instance, cache);
    }
  };

  // Create a new ky instance with the afterResponse hook
  return instance.extend({
    hooks: {
      afterResponse: [afterResponseHook],
    },
  });
}

// Default export for backward compatibility
export default createAuthRefreshHook;
