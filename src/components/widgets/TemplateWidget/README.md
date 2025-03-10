# Template Widget

This template provides a starter implementation for creating new widgets in Boxento. It follows all the standard design patterns and requirements outlined in the [Widget Development Guide](../../../docs/WIDGET_DEVELOPMENT.md).

## Quick Start

1. **Copy this template**: 
   ```bash
   cp -r src/components/widgets/TemplateWidget src/components/widgets/MyNewWidget
   ```

2. **Rename components and update imports**:
   - Rename `TemplateWidgetProps` and `TemplateWidgetConfig` in `types.ts`
   - Update the component name in `index.tsx`
   - Update imports in all files

3. **Register your widget** in `src/components/widgets/index.ts`:
   ```typescript
   // Add to WIDGET_REGISTRY array
   export const WIDGET_REGISTRY: EnhancedWidgetConfig[] = [
     // ... existing widgets
     {
       type: 'my-new-widget',
       name: 'My New Widget',
       icon: 'Icon',
       minWidth: 2,
       minHeight: 2,
       defaultWidth: 2,
       defaultHeight: 2,
       category: 'Category',
       description: 'Description of what my widget does'
     }
   ];

   // Add to getWidgetComponent function
   export const getWidgetComponent = (type: string): React.ComponentType<WidgetProps<any>> | null => {
     switch (type) {
       // ... existing cases
       case 'my-new-widget':
         return MyNewWidget;
       default:
         return null;
     }
   };
   ```

4. **Implement your widget functionality** by updating the content in the render methods.

5. **Test your widget** by adding it to the dashboard.

## Key Features of This Template

- ✅ Complete widget structure with proper container classes
- ✅ Responsive layout handling for different widget sizes
- ✅ Settings dialog with proper form handling and delete button
- ✅ TypeScript types and documentation
- ✅ State management using React hooks

## Core Requirements

All widgets must:

1. **Use the standard structure**:
   ```tsx
   <div className="widget-container h-full flex flex-col">
     <WidgetHeader title="Title" onSettingsClick={handler} />
     <div className="flex-grow p-4 overflow-hidden">
       {/* Widget content */}
     </div>
     {/* Settings dialog */}
   </div>
   ```

2. **Support responsive layouts** based on width/height
3. **Include proper settings** with delete functionality
4. **Support light and dark themes**

## Documentation

For complete widget development documentation, see:

- [Widget Development Guide](../../../docs/WIDGET_DEVELOPMENT.md) - Detailed reference
- Existing widgets in the codebase for examples:
  - `CalendarWidget/`
  - `WeatherWidget/`
  - `QuickLinksWidget/`
  - etc.

## Widget Structure Checklist

Before submitting your widget, verify it meets these requirements:

- [ ] Uses `widget-container` class on the root element
- [ ] Uses `WidgetHeader` component with proper title and settings button
- [ ] Content area has proper padding and overflow handling
- [ ] Implements responsive layouts for different sizes
- [ ] Supports both light and dark themes
- [ ] Includes settings dialog with delete button (where applicable)
- [ ] Uses consistent spacing and styling

## Purpose

The Template Widget serves as:

1. A reference implementation of the widget design system
2. A starting point for developing new widgets
3. A demonstration of responsive layouts and proper widget structure

## How to Use This Template

1. Copy the entire `TemplateWidget` directory
2. Rename the directory to your new widget name (e.g., `MyWidget`)
3. Update the component name, types, and imports in all files
4. Implement your widget's specific functionality

## Features

- Implements the required `widget-container` pattern
- Uses the shared `WidgetHeader` component
- Demonstrates proper responsive layouts based on width/height
- Includes standard settings dialog with delete button
- Follows all spacing, padding, and structural conventions
- Includes TypeScript type definitions

## Widget Structure

The template follows the required widget structure:

```tsx
<div ref={widgetRef} className="widget-container h-full flex flex-col">
  <WidgetHeader 
    title={title} 
    onSettingsClick={handler}
  />
  
  <div className="flex-grow p-4 overflow-hidden">
    {/* Content here */}
  </div>
  
  {/* Settings dialog */}
</div>
```

## Widget Component Checklist

Before submitting your widget based on this template, ensure it meets these requirements:

- [ ] Properly implements responsive layouts
- [ ] Uses consistent padding and spacing
- [ ] Follows accessibility best practices
- [ ] Has appropriate documentation
- [ ] Handles theme switching correctly 
- [ ] Implements appropriate error states 