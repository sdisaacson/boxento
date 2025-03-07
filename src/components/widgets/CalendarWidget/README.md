# Calendar Widget with Google Calendar Integration

This component provides a calendar widget with Google Calendar integration using OAuth 2.0. Users can connect their Google Calendar accounts to display their events in the widget.

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Make note of your project ID

### 2. Enable the Google Calendar API

1. In your Google Cloud project, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API" and select it
3. Click "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" and select "OAuth client ID"
3. Select "Web application" as the application type
4. Give your client a name (e.g., "Boxento Calendar Widget")

### 4. Configure Authorized JavaScript Origins and Redirect URIs

For development:
- Add `http://localhost:3000` (or your local development URL) to "Authorized JavaScript origins"
- Add `http://localhost:3000` (or your local development URL) to "Authorized redirect URIs"

For production:
- Add your production domain (e.g., `https://yourdomain.com`) to "Authorized JavaScript origins"
- Add your production domain (e.g., `https://yourdomain.com`) to "Authorized redirect URIs"

### 5. Set Up Environment Variables

1. Copy the `.env.sample` file to `.env.local`
2. Replace the placeholder values with your actual Google OAuth credentials:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your-client-secret
```

## Security Considerations

The current implementation has the following security limitations:

1. **Client-side token exchange**: The OAuth token exchange is performed client-side, which is not secure for production environments.
2. **Client secret exposure**: The client secret is stored in a client-side environment variable, which can be exposed to users.
3. **LocalStorage token storage**: Tokens are stored in localStorage, which is vulnerable to XSS attacks.

### Recommended Production Setup

For a production environment, consider implementing the following:

1. **Server-side token exchange**: Handle the OAuth flow on your server instead of the client.
2. **Secure token storage**: Store tokens in HttpOnly cookies or server-side sessions.
3. **Proper token refresh mechanism**: Implement a secure token refresh mechanism on your server.

Example server-side implementation:

1. Create a server endpoint to initiate the OAuth flow (e.g., `/api/auth/google/login`)
2. Create a callback endpoint to handle the OAuth response (e.g., `/api/auth/google/callback`)
3. Store tokens securely on the server or in HttpOnly cookies
4. Create API endpoints to fetch calendar data using the stored tokens

## Usage

The Calendar Widget can be used with the following props:

```tsx
<CalendarWidget 
  width={3} 
  height={3} 
  config={{
    defaultView: 'month',
    startDay: 'monday',
    showWeekNumbers: true
  }} 
/>
```

Refer to the `types.ts` file for all available configuration options.
