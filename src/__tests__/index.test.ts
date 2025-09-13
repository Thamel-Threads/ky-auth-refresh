import { describe, it, expect, vi, beforeEach } from 'vitest';
import ky from 'ky';
import { createAuthRefreshHook } from '../index.js';

const mockedKy = () => {
  const mock = {
    extend: vi.fn().mockReturnThis(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    head: vi.fn(),
    delete: vi.fn(),
  };
  return mock as any;
};

describe('createAuthRefreshHook', () => {
  it('throws error when no function provided', () => {
    expect(() => createAuthRefreshHook(ky, null as any)).toThrow(
      'refreshAuthCall must be a function'
    );
  });

  it('returns ky instance', () => {
    const mock = mockedKy();
    const result = createAuthRefreshHook(mock, () => Promise.resolve());
    expect(result).toBeDefined();
  });

  it('extends ky instance with hooks', () => {
    const mock = mockedKy();
    createAuthRefreshHook(mock, () => Promise.resolve());
    expect(mock.extend).toHaveBeenCalled();
  });

  it('handles 401 responses by calling refresh function', async () => {
    const mock = mockedKy();
    const refreshFn = vi.fn().mockResolvedValue(undefined);
    
    const client = createAuthRefreshHook(mock, refreshFn, {
      statusCodes: [401]
    });
    
    // Mock the afterResponse hook behavior
    const afterResponseHook = mock.extend.mock.calls[0][0].hooks.afterResponse[0];
    
    const mockRequest = new Request('https://api.example.com/test');
    const mockResponse = new Response(null, { status: 401 });
    
    await afterResponseHook(mockRequest, {}, mockResponse);
    
    expect(refreshFn).toHaveBeenCalled();
  });

  it('does not call refresh function for successful responses', async () => {
    const mock = mockedKy();
    const refreshFn = vi.fn().mockResolvedValue(undefined);
    
    const client = createAuthRefreshHook(mock, refreshFn, {
      statusCodes: [401]
    });
    
    const afterResponseHook = mock.extend.mock.calls[0][0].hooks.afterResponse[0];
    
    const mockRequest = new Request('https://api.example.com/test');
    const mockResponse = new Response(null, { status: 200 });
    
    await afterResponseHook(mockRequest, {}, mockResponse);
    
    expect(refreshFn).not.toHaveBeenCalled();
  });

  it('skips refresh when skipAuthRefresh is true', async () => {
    const mock = mockedKy();
    const refreshFn = vi.fn().mockResolvedValue(undefined);
    
    const client = createAuthRefreshHook(mock, refreshFn, {
      statusCodes: [401]
    });
    
    const afterResponseHook = mock.extend.mock.calls[0][0].hooks.afterResponse[0];
    
    const mockRequest = new Request('https://api.example.com/test');
    const mockResponse = new Response(null, { status: 401 });
    
    await afterResponseHook(mockRequest, { skipAuthRefresh: true }, mockResponse);
    
    expect(refreshFn).not.toHaveBeenCalled();
  });

  it('handles custom status codes', async () => {
    const mock = mockedKy();
    const refreshFn = vi.fn().mockResolvedValue(undefined);
    
    const client = createAuthRefreshHook(mock, refreshFn, {
      statusCodes: [403, 401]
    });
    
    const afterResponseHook = mock.extend.mock.calls[0][0].hooks.afterResponse[0];
    
    const mockRequest = new Request('https://api.example.com/test');
    const mockResponse = new Response(null, { status: 403 });
    
    await afterResponseHook(mockRequest, {}, mockResponse);
    
    expect(refreshFn).toHaveBeenCalled();
  });

  it('prevents multiple simultaneous refresh calls', async () => {
    const mock = mockedKy();
    let refreshCallCount = 0;
    const refreshFn = vi.fn().mockImplementation(async () => {
      refreshCallCount++;
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    const client = createAuthRefreshHook(mock, refreshFn, {
      statusCodes: [401]
    });
    
    const afterResponseHook = mock.extend.mock.calls[0][0].hooks.afterResponse[0];
    
    const mockRequest = new Request('https://api.example.com/test');
    const mockResponse = new Response(null, { status: 401 });
    
    // Call the hook multiple times simultaneously
    const promises = [
      afterResponseHook(mockRequest, {}, mockResponse),
      afterResponseHook(mockRequest, {}, mockResponse),
      afterResponseHook(mockRequest, {}, mockResponse),
    ];
    
    await Promise.all(promises);
    
    // Should only call refresh once despite multiple simultaneous calls
    expect(refreshCallCount).toBe(1);
  });
});