# Widget Development Guide

This guide explains how to create new widgets for Boxento. Widgets are modular, resizable components that display information or provide functionality on the Boxento dashboard.

## Widget Architecture

Widgets in Boxento follow a consistent architecture:

1. **React Component**: Each widget is a React component that accepts `width`, `height`, and `config` props.
2. **Configuration Object**: Each widget exports a configuration object with metadata about the widget.
3. **Registry**: Widgets are registered in the central registry (`src/components/widgets/index.js`).

## Creating a New Widget

### Step 1: Create the Widget File

Create a new file in the `src/components/widgets` directory. Name it according to its functionality, e.g., `MyWidget.jsx`.

### Step 2: Implement the Widget Component

Here's a template for a basic widget:

```jsx
import { useState, useEffect, useRef } from 'react'
import { Settings, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import WidgetHeader from '../components/widgets/common/WidgetHeader'

/**
 * My Widget Component
 * 
 * [Description of what your widget does]
 * 
 * @param {Object} props - Component props
 * @param {number} props.width - Width of the widget in grid units
 * @param {number} props.height - Height of the widget in grid units
 * @param {Object} props.config - Widget configuration
 * @returns {JSX.Element} Widget component
 */
const MyWidget = ({ width, height, config }) => {
  const [showSettings, setShowSettings] = useState(false)
  const [localConfig, setLocalConfig] = useState(config || {})
  const settingsRef = useRef(null)
  const widgetRef = useRef(null)
  
  // Render different views based on widget size
  const renderContent = () => {
    // Check for different size combinations
    if (width === 2 && height === 2) {
      return renderDefaultView(); // 2x2 default view
    } else if (width > 2 && height === 2) {
      return renderWideView(); // Wide view (e.g., 4x2)
    } else if (width === 2 && height > 2) {
      return renderTallView(); // Tall view (e.g., 2x4)
    } else {
      return renderLargeView(); // Large view (e.g., 4x4, 6x6)
    }
  };

  // Default view for 2x2 layout
  const renderDefaultView = () => {
    return (
      <div className="h-full">
        {/* Default content for 2x2 */}
      </div>
    );
  };

  // Wide view for layouts like 4x2, 6x2
  const renderWideView = () => {
    return (
      <div className="h-full">
        {/* Content for wide layout */}
      </div>
    );
  };

  // Tall view for layouts like 2x4, 2x6
  const renderTallView = () => {
    return (
      <div className="h-full">
        {/* Content for tall layout */}
      </div>
    );
  };

  // Large view for 4x4, 6x6, etc.
  const renderLargeView = () => {
    return (
      <div className="h-full">
        {/* Full content for large view */}
      </div>
    );
  };
  
  // Settings modal
  const renderSettings = () => {
    if (!showSettings) return null;
    
    return createPortal(
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
        onClick={() => setShowSettings(false)}
      >
        <div 
          ref={settingsRef}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-lg max-w-[90vw] max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Widget Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Your settings form here */}
          
          <div className="flex justify-end gap-2 mt-6">
            <button 
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                // Save settings
                setShowSettings(false)
              }}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div ref={widgetRef} className="widget-container h-full flex flex-col">
      <WidgetHeader 
        title="My Widget" 
        onSettingsClick={() => setShowSettings(!showSettings)}
      />
      
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
      
      {/* Settings modal */}
      {renderSettings()}
    </div>
  )
}

// Widget configuration for registration
export const myWidgetConfig = {
  type: 'mywidget', // Unique identifier for this widget type
  name: 'My Widget', // Display name in the widget picker
  description: 'Description of what my widget does', // Description for the widget picker
  defaultSize: { w: 2, h: 2 }, // Default size when added
  minSize: { w: 2, h: 2 }, // Minimum size (must be at least 2x2)
  maxSize: { w: 6, h: 6 } // Maximum size
}

export default MyWidget
```

### Step 3: Register the Widget

Add your widget to the registry in `src/components/widgets/index.js`:

```jsx
// Widget Components
import CalendarWidget, { calendarWidgetConfig } from './CalendarWidget';
import WeatherWidget, { weatherWidgetConfig } from './WeatherWidget';
import WorldClocksWidget, { worldClocksWidgetConfig } from './WorldClocksWidget';
import QuickLinksWidget, { quickLinksWidgetConfig } from './QuickLinksWidget';
import MyWidget, { myWidgetConfig } from './MyWidget'; // Import your widget

// Widget Registry - Map of all available widgets
export const widgetComponents = {
  calendar: CalendarWidget,
  weather: WeatherWidget,
  worldclocks: WorldClocksWidget,
  quicklinks: QuickLinksWidget,
  mywidget: MyWidget // Add your widget
};

// Widget Configurations - Used for the widget picker and defaults
export const widgetConfigs = [
  calendarWidgetConfig,
  weatherWidgetConfig,
  worldClocksWidgetConfig,
  quickLinksWidgetConfig,
  myWidgetConfig // Add your widget config
];

// ... rest of the file
```

## Widget Requirements

### 1. Responsive Design

Widgets must be responsive to different sizes, with a minimum size of 2x2:

- **2x2**: Default view with essential information
- **Wide (e.g., 4x2)**: Horizontal layout with expanded information
- **Tall (e.g., 2x4)**: Vertical layout with expanded information
- **Large (e.g., 4x4, 6x6)**: Full view with detailed information

Note: Widgets cannot be smaller than 2x2 as this is enforced by the application.

### 2. Theme Support

Widgets must support both light and dark themes:

- Use Tailwind's `dark:` prefix for dark mode styles
- Test in both light and dark modes

### 3. Settings

If your widget has configurable options:

- Implement a settings modal using `createPortal`
- Store settings in the widget's config object
- Provide sensible defaults

### 4. Performance

- Avoid unnecessary re-renders
- Use `useEffect` for side effects and cleanup
- Optimize expensive calculations

### 5. Accessibility

- Use semantic HTML
- Add ARIA attributes where appropriate
- Ensure keyboard navigation works for interactive elements

## Testing Your Widget

1. Start the development server: `bun run dev`
2. Add your widget to the dashboard
3. Test different sizes by resizing the widget (minimum 2x2, maximum 6x6)
4. Test in both light and dark modes
5. Test settings functionality

## Submitting Your Widget

1. Commit your changes: `git add src/components/widgets/MyWidget.jsx src/components/widgets/index.js`
2. Create a commit message: `git commit -m "Add MyWidget: Description of what it does"`
3. Push to your fork: `git push origin main`
4. Create a pull request on GitHub

## Examples

For examples, look at the existing widgets:

- `CalendarWidget.jsx`
- `WeatherWidget.jsx`
- `WorldClocksWidget.jsx`
- `QuickLinksWidget.jsx`

These widgets demonstrate best practices for Boxento widget development. 