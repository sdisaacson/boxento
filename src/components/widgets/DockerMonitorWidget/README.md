# Docker Monitor Widget

A widget that displays a list of Docker containers running on your host, using the Docker Remote API.

## Features

- **Container Status**: Visual indicators for "Running" and "Stopped" states.
- **Label-Based Configuration**: Automatically discovers and configures container display using Docker labels.
- **Clickable Links**: Open container-hosted applications directly from the dashboard.
- **Image Info**: Displays the underlying Docker image and full status string.
- **Configurable API**: Point the widget to any Docker Remote API compatible endpoint (proxy recommended).

## Docker Labels

Apply these labels to your containers to customize how they appear in the widget:

- `kanso.name`: The display name for the container (defaults to the Docker container name).
- `kanso.url`: A URL that will be opened when clicking the container name.
- `kanso.description`: A short description or subtitle for the container.

### Example

```yaml
services:
  my-app:
    image: my-app:latest
    labels:
      - "kanso.name=Production App"
      - "kanso.url=https://app.example.com"
      - "kanso.description=Main customer portal"
```

## Setup

This widget requires access to a Docker Remote API proxy. In a typical containerized setup, you would mount `/var/run/docker.sock` to a proxy container (like `tecnativa/docker-socket-proxy`) and point this widget to that proxy's endpoint.

**Note**: Never expose the raw Docker socket directly to the frontend. Always use a secure proxy that limits access to read-only GET requests on the `/containers` endpoint.

## Settings

- **Widget Title**: Customize the display name.
- **API Endpoint**: The URL path to your Docker API proxy (default: `/api/docker`).
- **Refresh Interval**: How often to poll the API for updates.
