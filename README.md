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

Use `skipAuthRefresh: true` to disable automatic token refresh for specific requests:

```typescript
// Login requests should not trigger token refresh
await client.post('auth/login', { 
  json: credentials, 
  skipAuthRefresh: true 
});

// Public endpoints that don't require authentication
await client.get('health-check', { skipAuthRefresh: true });
```

### When to use `skipAuthRefresh`

- **Authentication endpoints** (login, logout, refresh) - prevents infinite loops
- **Public endpoints** - no authentication required
- **Manual error handling** - when you want to handle auth errors yourself
- **Testing** - to test specific error responses without triggering refresh

## License

MIT