import ky from 'ky';
import { createAuthRefreshHook } from '@thamel-threads/ky-auth-refresh';

// Example usage of @thamel-threads/ky-auth-refresh
async function example() {
  console.log('🚀 @thamel-threads/ky-auth-refresh Example\n');

  // Create refresh function
  const refreshAuthLogic = async (failedRequest) => {
    console.log('🔄 Refreshing authentication token...');
    
    // Call your refresh endpoint
    const response = await ky.post('https://api.example.com/auth/refresh');
    const { token } = await response.json();
    
    console.log('✅ New token received:', token);
    
    // Update the failed request with new token
    if (failedRequest.response?.request) {
      failedRequest.response.request.headers.set('Authorization', `Bearer ${token}`);
    }
    
    return Promise.resolve();
  };

  // Create ky instance with auth refresh
  const kyWithAuthRefresh = createAuthRefreshHook(ky, refreshAuthLogic, {
    statusCodes: [401, 403], // Refresh on these status codes
    pauseInstanceWhileRefreshing: true, // Pause instance while refreshing
  });

  try {
    // Make a protected request
    console.log('📡 Making protected request...');
    const response = await kyWithAuthRefresh.get('https://api.example.com/protected');
    const data = await response.json();
    
    console.log('✅ Success! Data:', data);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Example with skipAuthRefresh
  try {
    console.log('\n📡 Making request with skipAuthRefresh...');
    await kyWithAuthRefresh.get('https://api.example.com/public', {
      skipAuthRefresh: true // Skip auth refresh for this request
    });
    
    console.log('✅ Public request successful');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run example
example().catch(console.error);
