# Website Monitor Widget

A real-time monitoring widget that tracks the reachability and response time of your favorite websites.

## Features

- **Reachability Tracking**: Checks if a website is online (Status 200).
- **Response Time**: Displays the time it took to receive a response in milliseconds.
- **Favicon Support**: Automatically fetches and displays the website's favicon.
- **Visual Indicators**: Clear icons indicating whether a site is "OK" or "Failing".
- **Error Reporting**: Displays specific HTTP errors or network issues if a check fails.
- **Direct Access**: Click on any website name to open it in a new tab.

- **CORS Support**: Uses a proxy to bypass browser cross-origin restrictions.

## Usage

1. Add the widget to your dashboard.
2. Open settings to add websites you want to monitor.
3. Provide a friendly name and the full URL (e.g., `https://example.com`).


## Settings

- **Widget Title**: Change the display name of the monitor.

- **Websites List**: Add or remove websites from the monitoring list.

## Technical Details

This widget uses a local proxy server (`http://localhost:3001/proxy/`) to perform reachability checks from the browser, avoiding CORS issues. Response times include the overhead of the proxy. Favicons are fetched using Google's Favicon service.
