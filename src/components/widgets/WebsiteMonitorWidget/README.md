# Website Monitor Widget

A real-time monitoring widget that tracks the reachability and response time of your favorite websites.

## Features

- **Reachability Tracking**: Checks if a website is online (Status 200).
- **Response Time**: Displays the time it took to receive a response in milliseconds.
- **Favicon Support**: Automatically fetches and displays the website's favicon.
- **Visual Indicators**: Clear icons indicating whether a site is "OK" or "Failing".
- **Error Reporting**: Displays specific HTTP errors or network issues if a check fails.
- **Direct Access**: Click on any website name to open it in a new tab.
- **Customizable Refresh**: Configure how often the widget checks the status.
- **CORS Support**: Uses a proxy to bypass browser cross-origin restrictions.

## Usage

1. Add the widget to your dashboard.
2. Open settings to add websites you want to monitor.
3. Provide a friendly name and the full URL (e.g., `https://example.com`).
4. Adjust the refresh interval as needed (minimum 10 seconds).

## Settings

- **Widget Title**: Change the display name of the monitor.
- **Refresh Interval**: Frequency of reachability checks in seconds.
- **Websites List**: Add or remove websites from the monitoring list.

## Technical Details

This widget uses `https://api.allorigins.win/` as a CORS proxy to perform reachability checks from the browser. Response times include the overhead of the proxy. Favicons are fetched using Google's Favicon service.
