import { WebPlaybackSDK, SpotifyTrack, WebPlaybackTrack } from './types';

// Web Playback SDK script URL
const SPOTIFY_PLAYER_SDK_URL = 'https://sdk.scdn.co/spotify-player.js';

// Type definition for the Spotify Player SDK loader
interface Window {
  onSpotifyWebPlaybackSDKReady?: () => void;
  Spotify?: {
    Player: new (options: {
      name: string;
      getOAuthToken: (callback: (token: string) => void) => void;
      volume?: number;
    }) => WebPlaybackSDK;
  };
}

// Load the Spotify Web Playback SDK script
export const loadSpotifyWebPlaybackSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (document.getElementById('spotify-player')) {
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.id = 'spotify-player';
    script.src = SPOTIFY_PLAYER_SDK_URL;
    script.async = true;

    // Set up callback for when SDK is ready
    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      resolve();
    };

    // Handle errors
    script.onerror = () => {
      reject(new Error('Failed to load Spotify Web Playback SDK'));
    };

    // Add script to document
    document.body.appendChild(script);
  });
};

// Create a new Spotify Web Playback SDK player
export const createSpotifyPlayer = (
  name: string,
  accessToken: string
): Promise<WebPlaybackSDK> => {
  return new Promise((resolve, reject) => {
    if (!(window as any).Spotify) {
      reject(new Error('Spotify Web Playback SDK not loaded'));
      return;
    }

    const player = new (window as any).Spotify.Player({
      name,
      getOAuthToken: (callback: (token: string) => void) => {
        callback(accessToken);
      },
      volume: 0.5
    });

    // Error handling
    player.addListener('initialization_error', ({ message }: { message: string }) => {
      console.error('Spotify Player initialization error:', message);
      reject(new Error(`Spotify Player initialization error: ${message}`));
    });

    player.addListener('authentication_error', ({ message }: { message: string }) => {
      console.error('Spotify Player authentication error:', message);
      reject(new Error(`Spotify Player authentication error: ${message}`));
    });

    player.addListener('account_error', ({ message }: { message: string }) => {
      console.error('Spotify Player account error:', message);
      reject(new Error(`Spotify Player account error: ${message}`));
    });

    player.addListener('playback_error', ({ message }: { message: string }) => {
      console.error('Spotify Player playback error:', message);
    });

    // Ready event
    player.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('Spotify Player ready with device ID:', device_id);
      resolve(player);
    });

    // Not ready event
    player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('Spotify Player device ID has gone offline:', device_id);
    });

    // Connect to the player
    player.connect();
  });
};

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