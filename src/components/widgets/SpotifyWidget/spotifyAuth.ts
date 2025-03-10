import { SpotifyTokenResponse, SpotifyAuthState } from './types';

// Constants
const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
// Get values from environment variables, with fallbacks
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || `${window.location.origin}/spotify-callback`;
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing', 
  'user-read-recently-played',
  'streaming',  // Required for Web Playback SDK
  'user-read-email',
  'user-read-private'
];

/**
 * Opens Spotify authorization popup
 * 
 * @param overrideClientId - Optional client ID to override env variable
 * @returns Promise that resolves with auth code
 */
export const authorizeSpotify = (overrideClientId?: string): Promise<string> => {
  // Use provided client ID or fall back to environment variable
  const clientId = overrideClientId || CLIENT_ID;
  
  if (!clientId) {
    return Promise.reject(new Error('Spotify Client ID is not configured'));
  }
  
  return new Promise((resolve, reject) => {
    // Create and store state parameter for security
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('spotify_auth_state', state);
    
    // Build authorization URL
    const authUrl = new URL(SPOTIFY_AUTH_ENDPOINT);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('scope', SCOPES.join(' '));
    
    // Calculate popup dimensions
    const width = 450;
    const height = 730;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    // Open popup
    const popup = window.open(
      authUrl.toString(),
      'Spotify Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    if (!popup) {
      reject(new Error('Failed to open popup. Please disable popup blocker.'));
      return;
    }
    
    // Poll for redirect and capture code parameter
    const pollTimer = setInterval(() => {
      try {
        // Check if popup was closed by user
        if (popup.closed) {
          clearInterval(pollTimer);
          reject(new Error('Authentication cancelled by user'));
          return;
        }
        
        // Check if we've been redirected to our callback URL
        if (popup.location.href.startsWith(REDIRECT_URI)) {
          clearInterval(pollTimer);
          
          // Parse URL parameters
          const params = new URLSearchParams(popup.location.search);
          const code = params.get('code');
          const returnedState = params.get('state');
          const error = params.get('error');
          
          // Close popup
          popup.close();
          
          // Validate state parameter
          const storedState = localStorage.getItem('spotify_auth_state');
          if (returnedState !== storedState) {
            reject(new Error('State mismatch. Possible CSRF attack.'));
            return;
          }
          
          if (error) {
            reject(new Error(`Authentication error: ${error}`));
            return;
          }
          
          if (!code) {
            reject(new Error('No authorization code returned'));
            return;
          }
          
          resolve(code);
        }
      } catch (e) {
        // Catching cross-domain security errors when polling
        // This error is expected when checking location before redirection
      }
    }, 500);
  });
};

/**
 * Exchange authorization code for access token
 * 
 * @param code - Authorization code from spotify
 * @param overrideClientId - Optional client ID to override env variable
 * @returns Promise with token response
 */
export const exchangeCodeForToken = async (
  code: string,
  overrideClientId?: string
): Promise<SpotifyTokenResponse> => {
  const clientId = overrideClientId || CLIENT_ID;
  
  if (!clientId) {
    throw new Error('Spotify Client ID is not configured');
  }
  
  // In a production app, this would be a server-side call using client_secret
  // For this demo, we're doing it client-side with PKCE (not ideal but functional for demo)
  
  // For demo purposes, we'll use the implicit flow which doesn't require client_secret
  // In production, you'd use a proper backend for this exchange
  
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);
  
  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Token exchange failed: ${errorData.error_description || response.statusText}`);
  }
  
  return await response.json();
};

/**
 * Refresh the access token
 * 
 * @param refreshToken - Refresh token
 * @param overrideClientId - Optional client ID to override env variable
 * @returns Promise with new token response
 */
export const refreshAccessToken = async (
  refreshToken: string,
  overrideClientId?: string
): Promise<SpotifyTokenResponse> => {
  const clientId = overrideClientId || CLIENT_ID;
  
  if (!clientId) {
    throw new Error('Spotify Client ID is not configured');
  }
  
  // In production, this would be a server-side call with client_secret
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  
  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Token refresh failed: ${errorData.error_description || response.statusText}`);
  }
  
  return await response.json();
};

/**
 * Initialize auth state from stored tokens
 * 
 * @returns The current auth state
 */
export const initializeAuthState = (widgetId: string): SpotifyAuthState => {
  try {
    // Try to get stored tokens from localStorage
    const storedAuthJson = localStorage.getItem(`spotify_auth_${widgetId}`);
    
    if (storedAuthJson) {
      const storedAuth = JSON.parse(storedAuthJson) as SpotifyAuthState;
      
      // Check if token is expired
      const now = Date.now();
      if (storedAuth.expiresAt && storedAuth.expiresAt > now) {
        // Valid token
        return {
          ...storedAuth,
          isAuthenticated: true,
          isAuthenticating: false
        };
      } else if (storedAuth.refreshToken) {
        // Token expired but we have refresh token
        return {
          ...storedAuth,
          isAuthenticated: false,
          isAuthenticating: false
        };
      }
    }
  } catch (e) {
    console.error('Error reading stored auth', e);
  }
  
  // Default to unauthenticated state
  return {
    isAuthenticated: false,
    isAuthenticating: false
  };
};

/**
 * Save authentication state to localStorage
 * 
 * @param widgetId - Widget instance ID
 * @param auth - Auth state to save
 */
export const saveAuthState = (widgetId: string, auth: SpotifyAuthState): void => {
  try {
    localStorage.setItem(`spotify_auth_${widgetId}`, JSON.stringify(auth));
  } catch (e) {
    console.error('Error saving auth state', e);
  }
};

/**
 * Clear authentication state
 * 
 * @param widgetId - Widget instance ID
 */
export const clearAuthState = (widgetId: string): void => {
  try {
    localStorage.removeItem(`spotify_auth_${widgetId}`);
  } catch (e) {
    console.error('Error clearing auth state', e);
  }
}; 