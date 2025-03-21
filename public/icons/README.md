# PWA Icons

For a complete PWA experience, you need to add the following icon files to this directory:

- `icon-192x192.png` - 192x192 pixels icon for Android and other platforms
- `icon-512x512.png` - 512x512 pixels icon for Android and other platforms
- `apple-icon-180.png` - 180x180 pixels icon for iOS

You can generate these icons from your existing favicon using online tools like:
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [App Icon Generator](https://appicon.co/)

## Example Command

If you have Node.js installed, you can use PWA Asset Generator:

```bash
npx pwa-asset-generator public/favicon.svg public/icons --manifest public/manifest.json --padding 10% --background "#3b82f6"
```

This will generate all the necessary icons based on your SVG favicon. 