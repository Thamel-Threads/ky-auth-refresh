# @thamel-threads/ky-auth-refresh

[![npm version](https://img.shields.io/npm/v/@thamel-threads/ky-auth-refresh.svg)](https://www.npmjs.com/package/@thamel-threads/ky-auth-refresh)
[![npm downloads](https://img.shields.io/npm/dm/@thamel-threads/ky-auth-refresh.svg)](https://www.npmjs.com/package/@thamel-threads/ky-auth-refresh)
[![Bundle size](https://img.shields.io/bundlephobia/min/@thamel-threads/ky-auth-refresh)](https://bundlephobia.com/package/@thamel-threads/ky-auth-refresh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Automatic authentication refresh for Ky HTTP client

A lightweight library that provides automatic authentication token refresh functionality for [Ky](https://github.com/sindresorhus/ky) HTTP client. Built with TypeScript 5.x, ESM support, and comprehensive tooling.

## ✨ Features

- 🚀 **TypeScript**: Built with TypeScript 5.x and ESM support
- 🔄 **Automatic**: Seamlessly refreshes authentication tokens
- 🎯 **Type Safe**: Full TypeScript support with strict type checking
- 📦 **Lightweight**: Minimal bundle size with tree-shaking support
- 🔧 **Configurable**: Flexible options for different use cases
- 🧪 **Well Tested**: Comprehensive test coverage with Vitest
- 📚 **Professional Tooling**: ESLint, Prettier, Changesets, and more

## 📦 Installation

```bash
npm install @thamel-threads/ky-auth-refresh ky
# or
yarn add @thamel-threads/ky-auth-refresh ky
# or
pnpm add @thamel-threads/ky-auth-refresh ky
```

## 🚀 Quick Start

```typescript
import ky from 'ky';
import { createAuthRefreshHook } from '@thamel-threads/ky-auth-refresh';

// Create refresh function
const refreshAuthLogic = async (failedRequest) => {
  const response = await ky.post('/auth/refresh');
  const { token } = await response.json();
  
  // Update the failed request with new token
  failedRequest.response.request.headers.set('Authorization', `Bearer ${token}`);
  
  return Promise.resolve();
};

// Create ky instance with auth refresh
const kyWithAuthRefresh = createAuthRefreshHook(ky, refreshAuthLogic, {
  statusCodes: [401, 403],
  pauseInstanceWhileRefreshing: true
});

// Use it like regular ky
const data = await kyWithAuthRefresh.get('/api/protected').json();
```

## 📖 API Reference

### `createAuthRefreshHook(instance, refreshAuthCall, options?)`

Creates a new Ky instance with automatic authentication refresh functionality.

#### Parameters

- `instance` - Ky HTTP client instance
- `refreshAuthCall` - Function that handles token refresh (must return a Promise)
- `options` - Configuration options (optional)

#### Returns

A new Ky instance with authentication refresh functionality.

### Options

```typescript
interface KyAuthRefreshOptions {
  statusCodes?: number[]; // Default: [401]
  shouldRefresh?: (error: HTTPError) => boolean;
  retryInstance?: KyInstance;
  interceptNetworkError?: boolean;
  pauseInstanceWhileRefreshing?: boolean;
  onRetry?: (request: Request, options: Options) => Request | Promise<Request>;
  skipWhileRefreshing?: boolean; // Deprecated
}
```

#### `statusCodes`

Array of HTTP status codes that should trigger a token refresh.

```typescript
{
  statusCodes: [401, 403] // Default: [401]
}
```

#### `shouldRefresh`

Custom function to determine when to refresh tokens.

```typescript
{
  shouldRefresh: (error) => error.response?.status === 401
}
```

#### `pauseInstanceWhileRefreshing`

Pause the instance while refresh is in progress to prevent multiple simultaneous refresh calls.

```typescript
{
  pauseInstanceWhileRefreshing: true // Default: false
}
```

#### `onRetry`

Callback function called before retrying a failed request.

```typescript
{
  onRetry: (request, options) => {
    // Modify request before retry
    return request;
  }
}
```

## 🔧 Advanced Usage

### Skip Authentication Refresh

```typescript
// Skip refresh for specific requests
const response = await kyWithAuthRefresh.get('/api/public', {
  skipAuthRefresh: true
});
```

### Custom Error Handling

```typescript
const kyWithAuthRefresh = createAuthRefreshHook(ky, refreshAuthLogic, {
  shouldRefresh: (error) => {
    // Custom logic to determine when to refresh
    return error.response?.status === 401 && 
           error.response?.data?.code === 'TOKEN_EXPIRED';
  }
});
```

### Multiple Instances

```typescript
const apiClient = createAuthRefreshHook(ky, refreshAuthLogic);
const adminClient = createAuthRefreshHook(ky, adminRefreshLogic);

// Use different instances for different purposes
const userData = await apiClient.get('/api/users').json();
const adminData = await adminClient.get('/api/admin').json();
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:ui
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## 📋 Requirements

- Node.js >= 18.0.0
- Ky >= 1.0.0

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ky](https://github.com/sindresorhus/ky) - The amazing HTTP client this library extends
- [axios-auth-refresh](https://github.com/Flyrell/axios-auth-refresh) - Original inspiration and concept

---

Made with ❤️ and professional tooling
