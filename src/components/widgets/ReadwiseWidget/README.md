# Readwise Widget

A clean, modern widget that displays random highlights from your Readwise account. The widget connects to the Readwise API to fetch and display interesting quotes, notes, and highlights from your reading collection.

## Design Philosophy

The Readwise widget follows these design principles:

- **Simplicity**: Clean interface focused on presenting highlights without distraction
- **Adaptability**: Responsive design that adjusts content presentation based on widget size
- **Practicality**: Easy access to your reading highlights for reflection and review
- **Personalization**: Configurable display options to match your preferences

## Features

- Display random highlights from your Readwise account
- Automatic or manual refresh to see different highlights
- View highlight text, notes, book information, and tags
- Configurable refresh intervals for automated cycling through highlights
- Toggle display of book information and tags
- Clean, accessible design that works well in both light and dark modes
- Responsive layout that adapts to different widget sizes

## Usage

The Readwise widget can be added to your dashboard through the widget picker. Once added:

1. Configure the widget with your Readwise API token (you'll need to get this from [Readwise](https://readwise.io/access_token))
2. Adjust settings such as refresh interval, display of book info, and tags
3. View highlights that automatically refresh based on your settings
4. Manually refresh to see a new highlight by clicking the refresh button

## Settings

The Readwise widget provides customization options through its settings panel:

- **Title**: Change the widget header text
- **API Token**: Your personal Readwise API token for authentication
- **Refresh Interval**: How often the widget should automatically display a new highlight (in minutes)
- **Show Book Information**: Toggle display of book title and author
- **Show Tags**: Toggle display of tags associated with highlights

## Implementation Details

### File Structure

- `index.tsx`: Main component implementing the widget functionality
- `types.ts`: TypeScript type definitions for the widget
- `README.md`: Documentation (this file)

### API Integration

The widget uses the [Readwise API](https://readwise.io/api_deets) to fetch highlights:

1. Authentication is done via API token
2. Highlights are fetched from the `/api/v2/highlights/` endpoint
3. Book information is retrieved when needed from the `/api/v2/books/{book_id}/` endpoint

### State Management

The widget maintains its state in the following ways:

1. Local state for UI interactions and API data using React's `useState` hook
2. Persisted configuration through the widget's config object and `onUpdate` callback
3. Automatic refresh handled by `useEffect` with cleanup for intervals

### Responsive Design

The widget adapts to different sizes with specialized views:

- **Small (2x2)**: Displays just the highlight text
- **Wide Small (3x2)**: Adds book title under the highlight
- **Tall Small (2x3)**: Adds book title and author information
- **Medium (3x3)**: Includes note preview and tags
- **Wide Medium (4x3)**: Adds a dedicated refresh button panel
- **Tall Medium (3x4)**: Shows more of the highlight text and note
- **Large (4x4+)**: Full-featured view with all highlight details

## One-Shot Development Checklist

For successful one-shot widget development, ensure:

- [x] Widget follows the project's component pattern
- [x] All required files are created (index.tsx, types.ts, README.md)
- [x] Widget is properly exported and registered in the widget registry
- [x] Widget handles both light and dark themes
- [x] Widget responds appropriately to resizing
- [x] Widget maintains state correctly (local and persistent)
- [x] Documentation is complete with features, usage, and implementation details

## Lessons Learned

During implementation, several key considerations were identified:

1. **API Rate Limiting**: The Readwise API has rate limits (240 requests per minute for most endpoints, 20 per minute for the highlights/books list endpoints). The widget is designed to minimize API calls.

2. **Error Handling**: Comprehensive error handling is implemented to deal with API failures, authentication issues, and empty responses.

3. **Loading States**: Clear loading states are shown during API calls to provide feedback to the user.

4. **Adaptive Content Display**: Content is carefully truncated and formatted based on widget size to maintain readability.

5. **Responsive Typography**: Font sizes are adjusted based on widget size to maintain readability.

6. **Automatic Refresh**: Using `setInterval` with proper cleanup in `useEffect` to prevent memory leaks.

7. **Token Security**: The API token is stored securely in the widget configuration and never exposed in the UI.

8. **Progressive Enhancement**: The widget displays more information as its size increases, prioritizing the most important content in smaller sizes.

## API Documentation

For more information about the Readwise API used by this widget, visit:
- [Readwise API Documentation](https://readwise.io/api_deets)
- [Readwise Access Token Page](https://readwise.io/access_token)

### Key Endpoints Used

- `GET /api/v2/highlights/`: Fetches highlights with pagination and filtering options
- `GET /api/v2/books/{book_id}/`: Retrieves book details for a specific book 