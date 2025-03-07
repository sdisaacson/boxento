# Template Widget

This is a template for creating new widgets in Boxento. It follows all the standard design patterns and structure required for widgets.

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