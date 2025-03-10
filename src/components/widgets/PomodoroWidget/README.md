# Pomodoro Widget

A feature-rich pomodoro timer widget for Boxento, implementing the popular Pomodoro Technique for time management.

## Purpose

The Pomodoro Widget serves as:

1. A productivity tool that helps users manage their time effectively using the Pomodoro Technique
2. A demonstration of timer-based functionality within the widget system
3. A practical implementation based on the TemplateWidget structure

## Features

- Standard pomodoro timer functionality with focus time, short breaks, and long breaks
- Visual indication of current mode with color coding and descriptive labels
- Responsive layouts for different widget sizes
- Customizable focus time duration, break durations, and long break durations
- Configurable number of cycles before a long break
- Audio notification when a timer completes
- Ability to pause, resume and reset the timer
- Cycle tracking to show progress

## Widget Structure

The widget follows the standard Boxento widget structure:

```tsx
<div ref={widgetRef} className="widget-container h-full flex flex-col">
  <WidgetHeader 
    title={title} 
    onSettingsClick={handler}
  />
  
  <div className="flex-grow p-4 overflow-hidden">
    {/* Timer content */}
  </div>
  
  {/* Settings dialog */}
</div>
```

## Responsive Design

The widget adapts to different sizes:

- Default view (2x2): Minimal view with timer and basic controls
- Wide view (4x2 or larger width): Horizontal layout with timer and controls
- Tall view (2x4 or larger height): Vertical layout with more statistics
- Large view (4x4 or larger): Full featured view with all controls and statistics

## Configuration Options

The widget can be configured with the following settings:

- **Title**: Custom widget title
- **Focus Time Duration**: Length of focused work periods in minutes (default: 25)
- **Short Break Duration**: Length of short breaks in minutes (default: 5)
- **Long Break Duration**: Length of long breaks in minutes (default: 15)
- **Cycles Before Long Break**: Number of focus time cycles before a long break (default: 4)

## About the Pomodoro Technique

The Pomodoro Technique is a time management method developed by Francesco Cirillo in the late 1980s. The technique uses a timer to break work into intervals, traditionally 25 minutes in length (called "focus time" or "pomodoros"), separated by short breaks. After completing a set number of focus time intervals, a longer break is taken. Each interval is known as a "pomodoro", from the Italian word for tomato, after the tomato-shaped kitchen timer that Cirillo used as a university student. 