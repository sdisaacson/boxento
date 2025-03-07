# Shared Credentials System

Boxento includes a shared credentials system that allows multiple widget instances of the same type to share API keys and other sensitive credentials. This improves user experience by not requiring users to re-enter the same API key for each widget instance.

## How It Works

The shared credentials system stores encrypted API keys and other sensitive data in localStorage. Each credential type has a unique identifier (e.g., "openweathermap-api" for weather widgets). When a widget is configured to use shared credentials, it retrieves its API key from this central store instead of its individual widget configuration.

## Implemented Widgets

The following widgets support shared credentials:

1. **Weather Widget** - Allows sharing OpenWeatherMap API keys between multiple Weather widget instances.
2. **Currency Converter Widget** - Allows sharing Open Exchange Rates API keys between multiple Currency Converter widget instances.

## User Interface

Each widget that supports shared credentials provides a checkbox option in its settings panel to toggle between using a shared API key or a widget-specific key. When the shared option is selected, the widget will:

1. Check if a shared credential already exists for its type
2. Use the existing shared credential if available
3. Allow the user to set or update the shared credential if needed

## Developer Guide

### Adding Shared Credentials to a Widget

To implement shared credentials in a new widget:

1. Import the shared credentials hook:
   ```typescript
   import { useSharedCredential } from '@/lib/sharedCredentials';
   ```

2. Add the `useSharedCredential` property to your widget configuration interface:
   ```typescript
   export interface MyWidgetConfig {
     // ...
     useSharedCredential?: boolean;
     // ...
   }
   ```

3. Use the hook in your widget component:
   ```typescript
   const { 
     credential: sharedApiKey, 
     updateCredential: updateSharedApiKey,
     hasCredential: hasSharedApiKey
   } = useSharedCredential('my-service-credential-type');
   ```

4. Determine which API key to use:
   ```typescript
   const apiKey = localConfig.useSharedCredential ? sharedApiKey : localConfig.apiKey;
   ```

5. Update the widget's settings UI to include the shared credential option:
   ```tsx
   <div className="flex items-center">
     <input
       type="checkbox"
       id="useSharedCredential"
       checked={localConfig.useSharedCredential}
       onChange={(e) => setLocalConfig({...localConfig, useSharedCredential: e.target.checked})}
     />
     <label htmlFor="useSharedCredential">
       Use shared API key
     </label>
   </div>
   
   {localConfig.useSharedCredential ? (
     // Shared API key input
     <input
       type="text"
       value={sharedApiKey || ''}
       onChange={(e) => updateSharedApiKey(e.target.value)}
     />
   ) : (
     // Widget-specific API key input
     <input
       type="text"
       value={localConfig.apiKey || ''}
       onChange={(e) => setLocalConfig({...localConfig, apiKey: e.target.value})}
     />
   )}
   ```

### Credential Types

When implementing a new shared credential type, add it to the `CredentialType` type in `src/lib/sharedCredentials.ts`:

```typescript
export type CredentialType = 
  | 'openweathermap-api'  // Weather widget
  | 'openexchangerates-api'  // Currency converter widget
  | 'your-new-credential-type'  // Your new widget
  | string;  // Allow extension for future widgets
```

## Security Considerations

Shared credentials are encrypted using the same encryption mechanism as individual widget credentials. This provides basic protection against casual inspection but is not suitable for high-security applications. Users should be informed that:

1. API keys are stored in the browser's localStorage with basic encryption
2. These keys are shared between widget instances of the same type
3. Clearing browser data will remove all saved credentials