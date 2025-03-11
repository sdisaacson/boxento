import { WidgetProps } from '@/types';

// Web Playback SDK Types
export interface WebPlaybackSDK {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: string, callback: (state: WebPlaybackState | null) => void): boolean;
  removeListener(event: string, callback?: (state: WebPlaybackState | null) => void): boolean;
  getCurrentState(): Promise<WebPlaybackState | null>;
  setName(name: string): Promise<void>;
  getVolume(): Promise<number>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  togglePlay(): Promise<void>;
  seek(position_ms: number): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
}

export interface WebPlaybackState {
  context: {
    uri: string;
    metadata?: Record<string, unknown>;
  };
  disallows: {
    pausing?: boolean;
    peeking_next?: boolean;
    peeking_prev?: boolean;
    resuming?: boolean;
    seeking?: boolean;
    skipping_next?: boolean;
    skipping_prev?: boolean;
  };
  duration: number;
  paused: boolean;
  position: number;
  repeat_mode: number;
  shuffle: boolean;
  track_window: {
    current_track: WebPlaybackTrack;
    previous_tracks: WebPlaybackTrack[];
    next_tracks: WebPlaybackTrack[];
  };
}

export interface WebPlaybackTrack {
  uri: string;
  id: string;
  type: string;
  media_type: string;
  name: string;
  is_playable: boolean;
  album: {
    uri: string;
    name: string;
    images: { url: string }[];
  };
  artists: {
    uri: string;
    name: string;
  }[];
}

/**
 * Spotify authentication state
 */
export interface SpotifyAuthState {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
}

/**
 * Configuration options for the Spotify widget
 * 
 * @interface SpotifyWidgetConfig
 * @property {string} [id] - Unique identifier for the widget instance
 * @property {string} [title] - Title to display in the widget header
 * @property {SpotifyAuthState} [auth] - Authentication state for Spotify API
 * @property {string} [clientId] - Optional override for the Spotify API client ID from env
 * @property {boolean} [showControls] - Whether to show playback controls
 * @property {boolean} [showRecentlyPlayed] - Whether to show recently played tracks
 * @property {boolean} [useWebPlaybackSDK] - Whether to use the Web Playback SDK
 */
export interface SpotifyWidgetConfig {
  id?: string;
  title?: string;
  auth?: SpotifyAuthState;
  clientId?: string;
  showControls?: boolean;
  showRecentlyPlayed?: boolean;
  useWebPlaybackSDK?: boolean;
  onUpdate?: (config: SpotifyWidgetConfig) => void;
  onDelete?: () => void;
}

/**
 * Props for the Spotify widget component
 * 
 * @type SpotifyWidgetProps
 */
export type SpotifyWidgetProps = WidgetProps<SpotifyWidgetConfig>;

/**
 * Spotify track information
 */
export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt?: string;
  duration: number;
  url: string;
}

/**
 * Current playback state
 */
export interface PlaybackState {
  isPlaying: boolean;
  currentTrack?: SpotifyTrack;
  progress?: number;
  device?: string;
}

/**
 * Spotify OAuth access token response
 */
export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

/**
 * Spotify error response
 */
export interface SpotifyErrorResponse {
  error: string;
  error_description: string;
} 