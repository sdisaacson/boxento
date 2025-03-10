# Spotify Widget

The Spotify Widget allows you to display and control your Spotify playback directly from your Boxento dashboard. View currently playing tracks, control playback, and see your recently played tracks.

## Features

- **Current Playback Display**: View the currently playing track with album art, track title, and artist
- **Playback Controls**: Play, pause, skip tracks with a single click
- **Progress Bar**: Visual progress bar showing playback position
- **Recently Played**: View your recently played tracks (in larger widget sizes)
- **Responsive Layout**: Optimized for various widget sizes
- **OAuth Authentication**: Secure Spotify OAuth 2.0 authentication with popup flow
- **Token Management**: Automatic token refresh to maintain seamless connection
- **Web Playback SDK**: Play Spotify directly in your browser with the Web Playback SDK (Premium accounts only)
- **Environment Variables**: Secure credentials storage in environment variables

## Setup

### 1. Environment Variables

Add your Spotify credentials to your `.env` file:

```
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:3000/spotify-callback
```

### 2. Spotify Developer Setup

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new app
3. Add `http://YOUR_DOMAIN/spotify-callback` to the Redirect URIs
4. Save the changes

### 3. Add to Dashboard

1. Add the Spotify Widget to your dashboard
2. Click "Connect to Spotify" to authorize the widget
3. Enjoy your music directly from the dashboard!

## Web Playback SDK

The widget can use Spotify's Web Playback SDK to create a player directly in your browser. This feature:

- Creates a "Boxento Player" device in your Spotify account
- Allows playback control directly from the browser
- Requires a Spotify Premium subscription
- Can be toggled on/off in widget settings

## Settings

- **Widget Title**: Customize the title displayed in the widget header
- **Use Web Playback SDK**: Toggle the browser-based Spotify player (Premium only)
- **Show Playback Controls**: Toggle visibility of playback control buttons
- **Show Recently Played**: Toggle visibility of recently played tracks list

## Responsive Sizing

The widget adapts to different sizes:

- **Small (2x2)**: Shows the currently playing track with basic controls
- **Wide Small (3x2)**: Expands horizontally to show more track information
- **Tall Small (2x3)**: Expands vertically to show recently played tracks
- **Medium (3x3)**: Comprehensive view with current track and recently played
- **Wide Medium (4x3)**: Enhanced view with more space for recently played tracks
- **Tall Medium (3x4)**: Extended view for recently played tracks
- **Large (4x4+)**: Full experience with current track and grid of recently played

## Authentication

The widget uses Spotify's OAuth 2.0 authorization flow:

1. User clicks "Connect to Spotify" in the widget settings
2. Authorization popup opens to the Spotify login/permission page
3. User authorizes the application
4. Spotify redirects back with an authorization code
5. The widget exchanges the code for access and refresh tokens
6. Tokens are securely stored and refreshed automatically

## Security Features

- **Environment Variables**: Spotify Client ID stored in environment variables
- **No Client Secret Exposure**: Client secret is never needed or exposed in the frontend
- **Secure Token Storage**: Tokens stored in localStorage with widget-specific keys
- **Automatic Token Refresh**: Tokens refreshed before expiry
- **CSRF Protection**: State parameter validates authorization responses

## API Integration

The widget interfaces with Spotify's Web API and Web Playback SDK to:
- Fetch currently playing track
- Get playback state
- Control playback (play/pause, next/previous)
- Retrieve recently played tracks history
- Create a playback device in your browser

## Implementation Notes

- Polling frequency is set to 30 seconds to keep playback information updated
- Tokens are refreshed automatically 5 minutes before expiration
- Dark mode compatible with appropriate styling
- Handles authentication, loading, and error states gracefully 