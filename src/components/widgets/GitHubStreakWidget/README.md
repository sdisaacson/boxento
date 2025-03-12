# GitHub Streak Widget

A widget that displays a user's GitHub contribution streak and contribution graph, allowing you to track your coding consistency and progress.

## Features

- **Current Streak Counter**: Shows your current consecutive days of GitHub contributions
- **Longest Streak**: Displays your longest contribution streak ever
- **Total Contributions**: Shows the total number of contributions over time
- **Contribution Graph**: Visual representation of your contribution activity
- **Responsive Layout**: Adapts to different sizes and orientations
- **Customizable Display**: Configure how many days of history to show

## Usage

1. Add the widget to your dashboard
2. Enter your GitHub username in the widget settings
3. Create a GitHub Personal Access Token (required for API access)
4. Configure other display options as needed

## Creating a Personal Access Token

GitHub's GraphQL API requires authentication, so you'll need to create a Personal Access Token:

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" and select "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Boxento GitHub Widget")
4. Set an expiration date (or choose "No expiration" if preferred)
5. Check only the **read:user** scope (minimum required permission)
6. Click "Generate token" and copy the token value
7. Paste this token in the widget settings

> **Important**: Use a "classic" Personal Access Token, not the newer fine-grained tokens. The token only needs the "read:user" scope to access your public contribution data.

## Settings

- **Title**: Customize the widget title
- **GitHub Username**: Your GitHub username to track
- **Personal Access Token**: Your GitHub API authentication token (required)
- **Show Contribution Graph**: Toggle to show/hide the contribution graph
- **Days to Show**: Number of days to display in the contribution graph

## Responsive Sizing

The widget adapts to different sizes:

- **2x2 (Small)**: Shows basic streak information
- **3x2 (Wide Small)**: Adds a compact contribution graph for recent days
- **2x3 (Tall Small)**: Similar to wide small, with a different layout
- **3x3 (Medium)**: More detailed streak information with a larger contribution graph
- **4x3 (Wide Medium)**: Full contribution data with a horizontally expanded graph
- **3x4 (Tall Medium)**: Full contribution data with a vertically expanded graph
- **4x4+ (Large)**: Comprehensive view with weekly contribution breakdown and detailed graph

## Technical Notes

- Uses GitHub's GraphQL API to fetch real contribution data
- Authentication via personal access token is required for all API requests
- Contribution counting follows GitHub's methodology
- The widget respects GitHub's API rate limits
- Token is stored securely and only used for GitHub API requests 