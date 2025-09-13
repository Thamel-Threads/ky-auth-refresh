import { KyInstance, Options } from 'ky';

interface KyAuthRefreshOptions {
    statusCodes?: number[];
    onRetry?: (request: Request) => Request | Promise<Request>;
}
interface KyAuthRefreshRequestConfig extends Options {
    skipAuthRefresh?: boolean;
}
declare function createAuthRefreshHook(instance: KyInstance, refreshAuthCall: () => Promise<void>, options?: KyAuthRefreshOptions): KyInstance;

export { type KyAuthRefreshOptions, type KyAuthRefreshRequestConfig, createAuthRefreshHook, createAuthRefreshHook as default };
