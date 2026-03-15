# Coolify Status Widget

A widget that displays the status of your Coolify servers and applications/resources.

## Features

- **Server Overview**: List of all servers with their IP addresses and status.
- **Resource Monitoring**: Optional display of applications and databases (resources) running on each server.
- **Status Indicators**: Visual indicators for "Running" and "Offline" states.
- **Read-Only**: Safely monitor your infrastructure without the risk of accidental changes.

## Setup

This widget requires a Coolify API Bearer Token.

1. Log in to your Coolify instance.
2. Go to **Keys & Tokens**.
3. Create a new **API Token**.
4. Use this token and your Coolify API URL (e.g., `https://your-coolify-instance.com/api/v1`) in the widget settings.

## Settings

- **Widget Title**: Customize the display name.
- **API Endpoint**: The full URL to your Coolify API (default: `https://app.coolify.io/api/v1`).
- **Bearer Token**: Your Coolify API authentication token.
- **Include Docker information**: Toggle the display of resources (applications/databases) for each server.
