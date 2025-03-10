# YouTube Widget

The YouTube Widget allows users to embed and watch YouTube videos directly within their Boxento dashboard.

## Features

- Embed any YouTube video by URL or video ID
- Responsive layout that adapts to different widget sizes
- Thumbnail previews for smaller widget sizes
- Options for autoplay and video controls
- Automatic YouTube ID extraction from various URL formats

## Usage

1. Add the YouTube Widget to your dashboard
2. Click the settings (gear) icon to configure the widget
3. Paste a YouTube URL or video ID
4. Adjust settings as needed
5. Save your changes

## Configuration Options

| Option | Description |
|--------|-------------|
| Widget Title | Custom title to display in the widget header |
| YouTube Video URL or ID | URL or ID of the YouTube video to embed |
| Autoplay | Automatically start playing the video when loaded (may be blocked by browsers) |
| Show Controls | Show or hide YouTube player controls |

## Responsive Behavior

The YouTube Widget adapts to different sizes:

- **2x2 (Small)**: Shows a thumbnail with a play button
- **3x2 (Wide Small)**: Shows a thumbnail with title
- **2x3 (Tall Small)**: Shows a small embedded player
- **3x3 (Medium) and larger**: Shows a full embedded player with title

## Implementation Details

The widget handles various YouTube URL formats and automatically extracts the video ID. It uses the YouTube Embed API to display videos and provides a clean, responsive interface at different sizes.

## Development

To customize this widget, edit the following files:

- `index.tsx` - Main component logic and UI
- `types.ts` - TypeScript type definitions
- `README.md` - Documentation 