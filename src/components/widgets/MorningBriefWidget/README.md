# Morning Brief Widget

The Morning Brief widget fetches and displays HTML content from a remote URL, designed to show daily morning briefings, news summaries, or any custom HTML content.

## Features

- Fetches HTML content from a configurable URL
- Displays content in an isolated iframe for security
- Auto-refresh capability with configurable interval
- Loading and error states
- Last updated timestamp

## Usage

1. Add the Morning Brief widget to your dashboard
2. Configure the URL pointing to your HTML content (defaults to `https://storage.sisaacson.io/morning-briefs/morning-brief.html`)
3. Optionally set an auto-refresh interval in minutes

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Widget Title | Display title for the widget | "Morning Brief" |
| Content URL | URL to fetch HTML content from | `https://storage.sisaacson.io/morning-briefs/morning-brief.html` |
| Refresh Interval | Auto-refresh interval in minutes (0 to disable) | 0 |

## Responsive Sizing

The Morning Brief widget adapts to different sizes:

- **2x2**: Compact view with scrollable content
- **Larger sizes**: More space for content display

## Content Requirements

The widget displays HTML content in an iframe with the following sandbox permissions:
- `allow-scripts` - Allows JavaScript execution
- `allow-same-origin` - Allows same-origin requests

Ensure your HTML content is designed to be displayed in an iframe and doesn't require additional permissions.
