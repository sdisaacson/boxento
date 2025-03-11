import { SpotifyTrack, PlaybackState } from './types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Formats API errors from Spotify
 */
class SpotifyApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'SpotifyApiError';
    this.status = status;
  }
}

/**
 * Makes an authenticated request to the Spotify API
 * 
 * @param endpoint - API endpoint path
 * @param accessToken - Spotify access token
 * @param options - Fetch options
 * @returns Response data
 */
async function spotifyApiRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${SPOTIFY_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    let errorMessage = `Spotify API error: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.error && errorData.error.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // Parsing error body failed, use default message
    }
    
    throw new SpotifyApiError(errorMessage, response.status);
  }
  
  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return {} as T;
  }
  
  return await response.json();
}

interface SpotifyArtist {
  id: string;
  name: string;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
}

interface SpotifyTrackItem {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyPlaybackResponse {
  is_playing: boolean;
  item?: SpotifyTrackItem;
  progress_ms?: number;
  device?: {
    id: string;
    name: string;
    type: string;
    volume_percent: number;
  };
}

/**
 * Fetches the user's current playback state
 * 
 * @param accessToken - Spotify access token
 * @returns Current playback state
 */
export async function getCurrentPlayback(accessToken: string): Promise<PlaybackState> {
  try {
    const data = await spotifyApiRequest<SpotifyPlaybackResponse>(
      '/me/player',
      accessToken
    );
    
    // If no active playback
    if (!data || Object.keys(data).length === 0) {
      return { isPlaying: false };
    }
    
    // Format response into our PlaybackState interface
    const track: SpotifyTrack = {
      id: data.item?.id || '',
      name: data.item?.name || 'Unknown Track',
      artist: data.item?.artists.map(a => a.name).join(', ') || 'Unknown Artist',
      album: data.item?.album.name || 'Unknown Album',
      albumArt: data.item?.album.images[0]?.url,
      duration: data.item?.duration_ms || 0,
      url: data.item?.external_urls?.spotify || ''
    };

    return {
      isPlaying: data.is_playing,
      currentTrack: track,
      progress: data.progress_ms || 0,
      device: data.device?.name
    };
  } catch (error) {
    console.error('Error getting current playback:', error);
    throw error;
  }
}

interface SpotifyRecentlyPlayedResponse {
  items: Array<{
    track: {
      id: string;
      name: string;
      artists: SpotifyArtist[];
      album: SpotifyAlbum;
      duration_ms: number;
      external_urls: {
        spotify: string;
      };
    };
  }>;
}

/**
 * Fetches the user's recently played tracks
 * 
 * @param accessToken - Spotify access token
 * @param limit - Number of tracks to return (max 50)
 * @returns Array of recently played tracks
 */
export async function getRecentlyPlayed(
  accessToken: string,
  limit: number = 10
): Promise<SpotifyTrack[]> {
  try {
    const data = await spotifyApiRequest<SpotifyRecentlyPlayedResponse>(
      `/me/player/recently-played?limit=${limit}`,
      accessToken
    );
    
    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }
    
    return data.items.map(item => ({
      id: item.track.id || '',
      name: item.track.name || 'Unknown Track',
      artist: item.track.artists.map(a => a.name).join(', ') || 'Unknown Artist',
      album: item.track.album.name || 'Unknown Album',
      albumArt: item.track.album.images[0]?.url,
      duration: item.track.duration_ms || 0,
      url: item.track.external_urls.spotify || ''
    }));
  } catch (error) {
    if (error instanceof SpotifyApiError && error.status === 401) {
      // Token expired
      throw new Error('Authentication token expired');
    }
    throw error;
  }
}

/**
 * Controls playback (play/pause)
 */
export async function controlPlayback(
  accessToken: string,
  play: boolean
): Promise<void> {
  const endpoint = play ? '/me/player/play' : '/me/player/pause';
  
  try {
    await spotifyApiRequest(
      endpoint,
      accessToken,
      { method: 'PUT' }
    );
  } catch (error) {
    if (error instanceof SpotifyApiError && error.status === 401) {
      throw new Error('Authentication token expired');
    }
    throw error;
  }
}

/**
 * Skip to next track
 */
export async function skipToNext(accessToken: string): Promise<void> {
  try {
    await spotifyApiRequest(
      '/me/player/next',
      accessToken,
      { method: 'POST' }
    );
  } catch (error) {
    if (error instanceof SpotifyApiError && error.status === 401) {
      throw new Error('Authentication token expired');
    }
    throw error;
  }
}

/**
 * Skip to previous track
 */
export async function skipToPrevious(accessToken: string): Promise<void> {
  try {
    await spotifyApiRequest(
      '/me/player/previous',
      accessToken,
      { method: 'POST' }
    );
  } catch (error) {
    if (error instanceof SpotifyApiError && error.status === 401) {
      throw new Error('Authentication token expired');
    }
    throw error;
  }
} 