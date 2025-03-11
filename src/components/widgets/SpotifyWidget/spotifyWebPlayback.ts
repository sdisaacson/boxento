import { WebPlaybackSDK, WebPlaybackState, SpotifyTrack, WebPlaybackTrack } from './types';

declare global {
  interface Window {
    Spotify: {
      Player: new (options: SpotifyPlayerOptions) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

interface SpotifyPlayerOptions {
  name: string;
  getOAuthToken: (callback: (token: string) => void) => void;
  volume?: number;
}

interface SpotifyPlayerCallback {
  device_id: string;
}

interface SpotifyPlayerError {
  message: string;
}

// Extend WebPlaybackSDK to include the actual event listeners we need
interface SpotifyPlayer extends WebPlaybackSDK {
  addListener(event: 'ready' | 'not_ready', callback: (state: SpotifyPlayerCallback) => void): boolean;
  addListener(event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error', callback: (state: SpotifyPlayerError) => void): boolean;
  addListener(event: 'player_state_changed', callback: (state: WebPlaybackState | null) => void): boolean;
}

// Load the Spotify Web Playback SDK script
function loadSpotifyScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    script.onload = () => {
      window.onSpotifyWebPlaybackSDKReady = () => {
        resolve();
      };
    };

    script.onerror = () => {
      reject(new Error('Failed to load Spotify Web Playback SDK'));
    };

    document.body.appendChild(script);
  });
}

// Create a new Spotify Web Playback SDK player
export async function initializeSpotifyPlayer(
  name: string,
  getOAuthToken: (callback: (token: string) => void) => void,
  volume = 1
): Promise<WebPlaybackSDK> {
  // Load the Spotify Web Playback SDK script if not already loaded
  if (!window.Spotify) {
    await loadSpotifyScript();
  }

  return new Promise((resolve, reject) => {
    const player = new window.Spotify.Player({
      name,
      getOAuthToken,
      volume
    });

    // Error handling
    player.addListener('initialization_error', ({ message }: SpotifyPlayerError) => {
      console.error('Failed to initialize Spotify player:', message);
      reject(new Error(message));
    });

    player.addListener('authentication_error', ({ message }: SpotifyPlayerError) => {
      console.error('Failed to authenticate Spotify player:', message);
      reject(new Error(message));
    });

    player.addListener('account_error', ({ message }: SpotifyPlayerError) => {
      console.error('Failed to validate Spotify account:', message);
      reject(new Error(message));
    });

    player.addListener('playback_error', ({ message }: SpotifyPlayerError) => {
      console.error('Failed to perform playback:', message);
    });

    // Ready handling
    player.addListener('ready', ({ device_id }: SpotifyPlayerCallback) => {
      console.log('Spotify player ready with device ID:', device_id);
      resolve(player);
    });

    // Not ready handling
    player.addListener('not_ready', ({ device_id }: SpotifyPlayerCallback) => {
      console.warn('Device has gone offline:', device_id);
    });

    // Connect the player
    player.connect();
  });
}

// Convert Web Playback track to our internal SpotifyTrack format
export const convertWebPlaybackTrack = (track: WebPlaybackTrack): SpotifyTrack => {
  return {
    id: track.id,
    name: track.name,
    artist: track.artists.map(artist => artist.name).join(', '),
    album: track.album.name,
    albumArt: track.album.images[0]?.url,
    duration: 0, // Duration not available from track object
    url: track.uri
  };
}; 