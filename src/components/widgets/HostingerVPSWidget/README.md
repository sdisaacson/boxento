# Hostinger VPS Widget

Monitor your Hostinger VPS instances with real-time status, metrics, and historical charts directly on your Boxento dashboard.

## Features

- **VPS Overview**: Display all your VPS instances with status, hostname, and IP addresses
- **Real-time Metrics**: View CPU, RAM, disk usage, and network traffic data
- **Historical Charts**: Line graphs showing metrics over the past 3 hours
- **Responsive Design**: Adapts to different widget sizes (2x2, 4x2, 2x4, 4x4+)
- **Multiple Layouts**: Choose between vertical or horizontal card layouts
- **VPS Selection**: View metrics for all VPS or a specific instance

## Usage

1. Add the Hostinger VPS widget to your dashboard
2. Open settings and enter your Hostinger API token
3. The widget will automatically fetch your VPS list and metrics

### Getting an API Token

1. Go to the [Hostinger API page](https://hpanel.hostinger.com/profile/api)
2. Generate a new API token
3. Copy and paste it into the widget settings

## Settings

| Setting | Description |
|---------|-------------|
| **API Token** | Your Hostinger API authentication token |
| **Layout** | Choose between `Vertical` or `Horizontal` card layout |
| **VPS per row** | When using horizontal layout, configure how many VPS cards display per row (1-10) |

## Responsive Sizing

The widget adapts its display based on size:

- **2x2 (Compact)**: Shows total VPS count and number of running instances
- **2x4 (Tall)**: Lists VPS instances with basic info
- **4x2 (Wide)**: Displays VPS cards in a grid layout
- **4x4+ (Full)**: Complete view with VPS selector, instance details, and metrics charts

## Metrics Displayed

- **CPU Usage** (%): Processor utilization over time
- **RAM Usage** (GB): Memory consumption
- **Disk Space** (GB): Storage usage
- **Outgoing Traffic** (MB): Data sent from the VPS
- **Incoming Traffic** (MB): Data received by the VPS

## Data Refresh

- Data is fetched once when the widget loads
- Use the refresh button in the full view to manually update
- No auto-refresh to minimize API calls

## Requirements

- Valid Hostinger API token
- At least one VPS instance in your Hostinger account
