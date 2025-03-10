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
3. Optionally, configure the display options

## Settings

- **Title**: Customize the widget title
- **GitHub Username**: Your GitHub username to track
- **Show Contribution Graph**: Toggle to show/hide the contribution graph
- **Days to Show**: Number of days to display in the contribution graph (14, 30, 60, or 90)

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

- Currently uses mock data for demonstration
- Would typically connect to GitHub's API or a proxy service for real data
- Contribution counting follows GitHub's methodology
- The widget respects GitHub's API rate limits 