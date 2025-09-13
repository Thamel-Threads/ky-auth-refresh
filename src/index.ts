import { KyInstance, Options } from 'ky';

export interface KyAuthRefreshOptions {
  statusCodes?: number[];
  onRetry?: (request: Request) => Request | Promise<Request>;
}

export interface KyAuthRefreshRequestConfig extends Options {
  skipAuthRefresh?: boolean;
}
export function createAuthRefreshHook(
  instance: KyInstance,
  refreshAuthCall: () => Promise<void>,
  options: KyAuthRefreshOptions = {}
): KyInstance {
  if (typeof refreshAuthCall !== 'function') {
    throw new Error('refreshAuthCall must be a function');
  }

  const { statusCodes = [401], onRetry } = options;
  let isRefreshing = false;
  let refreshPromise: Promise<void> | null = null;

  const afterResponseHook = async (
    request: Request,
    requestOptions: any,
    response: Response
  ) => {
    const opts = requestOptions as KyAuthRefreshRequestConfig;
    if (
      opts?.skipAuthRefresh ||
      response.ok ||
      !statusCodes.includes(response.status)
    ) {
      return response;
    }

    if (isRefreshing && refreshPromise) {
      await refreshPromise;
    } else if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAuthCall().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
      await refreshPromise;
    }

    try {
      const retryRequest = onRetry ? await onRetry(request) : request;
      return instance(retryRequest.url, {
        method: retryRequest.method,
        headers: retryRequest.headers,
        body: retryRequest.body,
        skipAuthRefresh: true,
      } as KyAuthRefreshRequestConfig);
    } catch {
      return response;
    }
  };

  return instance.extend({ hooks: { afterResponse: [afterResponseHook] } });
}

export default createAuthRefreshHook;
