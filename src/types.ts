import { KyInstance, Options, HTTPError } from 'ky';

export interface KyAuthRefreshOptions {
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

export interface KyAuthRefreshCache {
  skipInstances: KyInstance[];
  refreshCall: Promise<any> | undefined;
  requestQueueInterceptorId: number | undefined;
}

export interface KyAuthRefreshRequestConfig extends Options {
  skipAuthRefresh?: boolean;
}
