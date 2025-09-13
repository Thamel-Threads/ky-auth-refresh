# @thamel-threads/ky-auth-refresh

Automatic token refresh for Ky HTTP client.

## Install

```bash
npm install @thamel-threads/ky-auth-refresh
```

## Usage

```typescript
import ky from 'ky';
import { createAuthRefreshHook } from '@thamel-threads/ky-auth-refresh';

const baseClient = ky.create({
  prefixUrl: 'https://api.example.com',
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

const client = createAuthRefreshHook(baseClient, async () => {
  const newTokens = await refreshTokens();
  accessToken = newTokens.accessToken;
});

// Automatically refreshes on 401
const data = await client.get('protected-endpoint').json();
```

## Options

```typescript
createAuthRefreshHook(instance, refreshAuthCall, {
  statusCodes: [401], // Default: [401]
  onRetry: (request) => {
    // Custom retry logic
    return newRequest;
  }
});
```

## Skip Refresh

```typescript
await client.get('public-endpoint', { 
  skipAuthRefresh: true 
});
```

## License

MIT