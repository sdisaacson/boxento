# Progressive Web App (PWA) Support for Boxento

This document outlines the Progressive Web App (PWA) features implemented in Boxento and how to test them.

## Implemented Features

1. **Web App Manifest**: Defines how the app appears when installed on a device
   - File: `public/manifest.json`
   - Configures name, icons, theme colors, and display mode

2. **Service Worker**: Enables offline functionality
   - File: `public/service-worker.js`
   - Caches important assets for offline use
   - Implements fetch strategies for network requests

3. **App Icons**: Various sizes for different platforms
   - Directory: `public/icons/`
   - Includes sizes for Android, iOS, and other platforms

4. **Offline Indicator**: Shows when the user is offline
   - Component: `src/components/OfflineIndicator.tsx`
   - Displays a notification when connection is lost

5. **HTML Meta Tags**: For iOS and other platforms
   - Updated in `index.html`
   - Includes Apple-specific meta tags for better iOS integration

## Testing Your PWA

### Using Chrome DevTools

1. Open your application in Chrome
2. Open DevTools (F12 or Right-click > Inspect)
3. Go to the "Lighthouse" tab
4. Check "Progressive Web App" category and run an audit
5. Review the results and fix any issues

### Testing Offline Functionality

1. Open your application in Chrome
2. Open DevTools and go to the "Application" tab
3. In the "Service Workers" section, check "Offline"
4. Reload the page - it should still work
5. Try different features to see what works offline

### Testing Installation

1. Visit your deployed application
2. In Chrome, you should see an install icon in the address bar
3. Click it to install the app to your device
4. For mobile devices, use "Add to Home Screen" option

## Customizing Your PWA

### Icons

Replace the placeholder icons in `public/icons/` with your own:
- Use the script at `scripts/generate-pwa-icons.sh` to generate icons
- Or use online tools like [RealFaviconGenerator](https://realfavicongenerator.net/)

### Manifest

Edit `public/manifest.json` to customize:
- App name and description
- Theme colors
- Display mode
- Start URL

### Offline Experience

Modify `public/service-worker.js` to:
- Cache additional resources
- Implement different caching strategies
- Add background sync for offline actions

## Production Considerations

Before deploying to production:

1. **Replace Placeholder Icons**: Create proper branded icons
2. **Test on Multiple Devices**: Ensure PWA works on various devices and browsers
3. **Optimize Cache Strategy**: Consider what to cache and for how long
4. **Implement Version Control**: Add versioning to your service worker cache

## Resources

- [Google PWA Documentation](https://web.dev/progressive-web-apps/)
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Workbox Library](https://developers.google.com/web/tools/workbox) (for advanced service worker implementation)
- [PWA Builder](https://www.pwabuilder.com/) (online tool for enhancing PWAs) 