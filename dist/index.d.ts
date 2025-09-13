import { HTTPError, KyInstance, Options } from 'ky';

interface KyAuthRefreshOptions {
    statusCodes?: Array<number>;
    /**
     * Determine whether to refresh, if "shouldRefresh" is configured, The "statusCodes" logic will be ignored
     * @param error HTTPError
     * @returns boolean
     */
    shouldRefresh?(error: HTTPError): boolean;
    retryInstance?: KyInstance;
    interceptNetworkError?: boolean;
    pauseInstanceWhileRefreshing?: boolean;
    onRetry?: (request: Request, options: Options) => Request | Promise<Request>;
}
interface KyAuthRefreshRequestConfig extends Options {
    skipAuthRefresh?: boolean;
}

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
declare function createAuthRefreshHook(instance: KyInstance, refreshAuthCall: (error: any) => Promise<any>, options?: KyAuthRefreshOptions): KyInstance;

export { type KyAuthRefreshOptions, type KyAuthRefreshRequestConfig, createAuthRefreshHook, createAuthRefreshHook as default };
