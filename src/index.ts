import { KyInstance, Options } from 'ky';

declare module 'ky' {
  interface Options {
    skipAuthRefresh?: boolean;
  }
}

export interface KyAuthRefreshOptions {
  statusCodes?: number[];
  onRetry?: (request: Request) => Request | Promise<Request>;
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
    requestOptions: Options,
    response: Response
  ) => {
    if (
      requestOptions.skipAuthRefresh ||
      response.ok ||
      !statusCodes.includes(response.status)
    ) {
      return response;
    }

    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAuthCall().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    await refreshPromise;

    try {
      let retryRequest = request;
      if (onRetry) {
        retryRequest = await onRetry(request);
      }
      const newRequest = new Request(retryRequest);
      const kyInstance = instance as any;
      return kyInstance._options.fetch(newRequest, {});
    } catch {
      return response;
    }
  };

  return instance.extend({ hooks: { afterResponse: [afterResponseHook] } });
}

export default createAuthRefreshHook;
