# YouTube Favorites Widget

Display the most recent videos from one or more YouTube channels (by channel ID).

## Settings

- **Channel IDs**: One or more YouTube `channel_id` values.
- **Videos to list**: How many recent videos to fetch per channel.
- **Videos to display**: How many videos should be visible in the viewport at once.
- **Orientation**:
  - `vertical`: merged list across channels
  - `horizontal`: one column per channel
- **Auto scroll**: smoothly scrolls through the full list; pauses on hover.

## Notes

This widget uses YouTube’s channel uploads RSS feed (`https://www.youtube.com/feeds/videos.xml?channel_id=...`) and fetches through a CORS proxy (same approach as the RSS widget).
