import { KyInstance } from 'ky';

declare module 'ky' {
    interface Options {
        skipAuthRefresh?: boolean;
    }
}
interface KyAuthRefreshOptions {
    statusCodes?: number[];
    onRetry?: (request: Request) => Request | Promise<Request>;
}
declare function createAuthRefreshHook(instance: KyInstance, refreshAuthCall: () => Promise<void>, options?: KyAuthRefreshOptions): KyInstance;

export { type KyAuthRefreshOptions, createAuthRefreshHook, createAuthRefreshHook as default };
