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
      // Create a new Request object and use Ky's internal fetch to avoid URL processing
      const newRequest = new Request(retryRequest.url, {
        method: retryRequest.method,
        headers: retryRequest.headers,
        body: retryRequest.body,
      });
      
      // Use Ky's internal fetch method to preserve all Ky functionality
      const kyInstance = instance as any;
      return kyInstance._options.fetch(newRequest, {});
    } catch {
      return response;
    }
  };

  return instance.extend({ hooks: { afterResponse: [afterResponseHook] } });
}

export default createAuthRefreshHook;
