import React, { useState, useEffect, useRef } from 'react'
import { Plus, Moon, Sun, Cloud, Loader2, AlertCircle } from 'lucide-react'
// Import GridLayout components - direct imports to avoid runtime issues

// @ts-expect-error - The types don't correctly represent the module structure
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { getWidgetComponent, getWidgetConfigByType, WIDGET_REGISTRY } from '@/components/widgets'
import { 
  WidgetConfig, 
  Widget,
  LayoutItem
} from '@/types'
import WidgetErrorBoundary from '@/components/widgets/common/WidgetErrorBoundary'
import WidgetSelector from '@/components/widgets/common/WidgetSelector'
import { configManager } from '@/lib/configManager'
import { UserMenuButton } from '@/components/auth/UserMenuButton'
import { auth } from '@/lib/firebase'
import { userDashboardService } from '@/lib/firestoreService'
import { useSync } from '@/lib/SyncContext'
import { Button } from './components/ui/button'

interface WidgetCategory {
  [category: string]: WidgetConfig[];
}

// Define breakpoints
const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

// Create responsive grid layout with width provider - once, outside the component
// This is important for performance as it prevents recreation on each render
const ResponsiveReactGridLayout = WidthProvider(Responsive);

function App() {
  // Add a class to the body for dark mode background
  useEffect(() => {
    document.body.className = 'bg-gray-50 dark:bg-slate-900 min-h-screen';
    return () => {
      document.body.className = '';
    };
  }, []);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      // Check system preference if no theme is set
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme as 'light' | 'dark';
      
      // Use system preference as default if available
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return 'light'
  })
  
  const [layouts, setLayouts] = useState<{ [key: string]: LayoutItem[] }>(() => {
    if (typeof window !== 'undefined') {
      try {
        // Try to load saved layouts
        const savedLayouts = localStorage.getItem('boxento-layouts');
        if (savedLayouts) {
          const parsedLayouts = JSON.parse(savedLayouts);
          
          // Validate all breakpoint layouts
          const validatedLayouts: { [key: string]: LayoutItem[] } = {};
          
          // Ensure all breakpoints have layouts with minimum dimensions
          Object.keys(breakpoints).forEach(breakpoint => {
            if (!parsedLayouts[breakpoint] || !Array.isArray(parsedLayouts[breakpoint])) {
              validatedLayouts[breakpoint] = []; // Default to empty layout
            } else {
              // Validate each layout item
              validatedLayouts[breakpoint] = parsedLayouts[breakpoint].map((item: LayoutItem) => ({
                ...item,
                w: Math.max(item.w, 2),
                h: Math.max(item.h, 2),
                minW: Math.max(item.minW || 1, 2),
                minH: Math.max(item.minH || 1, 2)
              }));
            }
          });
          
          return validatedLayouts;
        }
      } catch (error) {
        console.error('Error initializing layouts:', error);
      }
    }
    
    // Default layout for all breakpoints with default widgets
    const defaultLayout = {
      lg: [
        { i: 'default-todo', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
        { i: 'default-weather', x: 3, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-quick-links', x: 5, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        { i: 'default-notes', x: 8, y: 0, w: 3, h: 3, minW: 2, minH: 2 }
      ],
      md: [
        { i: 'default-todo', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
        { i: 'default-weather', x: 3, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-quick-links', x: 5, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        { i: 'default-notes', x: 0, y: 3, w: 3, h: 3, minW: 2, minH: 2 }
      ],
      sm: [
        { i: 'default-todo', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
        { i: 'default-weather', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        { i: 'default-quick-links', x: 0, y: 3, w: 3, h: 2, minW: 2, minH: 2 },
        { i: 'default-notes', x: 3, y: 3, w: 3, h: 3, minW: 2, minH: 2 }
      ],
      xs: [
        { i: 'default-todo', x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-weather', x: 0, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-quick-links', x: 0, y: 4, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-notes', x: 0, y: 6, w: 2, h: 3, minW: 2, minH: 2 }
      ],
      xxs: [
        { i: 'default-todo', x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-weather', x: 0, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-quick-links', x: 0, y: 4, w: 2, h: 2, minW: 2, minH: 2 },
        { i: 'default-notes', x: 0, y: 6, w: 2, h: 3, minW: 2, minH: 2 }
      ]
    };
    return defaultLayout;
  });
  
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    if (typeof window !== 'undefined') {
      const savedWidgets = localStorage.getItem('boxento-widgets')
      const widgetsFromStorage = savedWidgets ? JSON.parse(savedWidgets) : []
      
      // Only use default widgets if we're not logged in and no widgets in storage
      if (widgetsFromStorage.length === 0 && !auth.currentUser) {
        // Add default widgets if no widgets exist and user is not logged in
        return [
          {
            id: 'default-todo',
            type: 'todo',
            config: getWidgetConfigByType('todo') || {}
          },
          {
            id: 'default-weather',
            type: 'weather',
            config: getWidgetConfigByType('weather') || {}
          },
          {
            id: 'default-quick-links',
            type: 'quick-links',
            config: getWidgetConfigByType('quick-links') || {}
          },
          {
            id: 'default-notes',
            type: 'notes',
            config: getWidgetConfigByType('notes') || {}
          }
        ];
      }
      
      // Load each widget's configuration from configManager
      return widgetsFromStorage.map((widget: Widget) => {
        if (widget.id) {
          const savedConfig = configManager.getWidgetConfig(widget.id);
          if (savedConfig) {
            return {
              ...widget,
              config: {
                ...widget.config,
                ...savedConfig
              }
            };
          }
        }
        return widget;
      });
    }
    return []
  })
  
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth - 40 : 1200)
  const [widgetSelectorOpen, setWidgetSelectorOpen] = useState<boolean>(false)
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('lg')
  const widgetCategories: WidgetCategory = (() => {
    // Group widgets by category
    const categories: WidgetCategory = {};
    
    WIDGET_REGISTRY.forEach(widget => {
      const category = widget.category || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(widget);
    });
    
    return categories;
  })();
  
  // Save widgets and layout to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('boxento-widgets', JSON.stringify(widgets))
      
      // Save each widget's configuration separately using configManager
      widgets.forEach(widget => {
        if (widget.config && widget.id) {
          // Extract config without function properties
          const { ...configToSave } = widget.config;
          
          // Remove function properties that shouldn't be serialized
          delete configToSave.onDelete;
          delete configToSave.onUpdate;
          
          configManager.saveWidgetConfig(widget.id, configToSave);
        }
      });
      
      // Save widgets to Firestore when user is logged in
      if (auth.currentUser) {
        // Use a debounce pattern to prevent too many Firestore writes
        if (layoutUpdateTimeout.current !== null) {
          clearTimeout(layoutUpdateTimeout.current);
        }
        
        layoutUpdateTimeout.current = window.setTimeout(async () => {
          try {
            // Save widget metadata to Firestore (without configs)
            await userDashboardService.saveWidgets(widgets);
            console.log('Saved widget metadata to Firestore');
            
            // Config is saved individually above using configManager.saveWidgetConfig
          } catch (error) {
            console.error('Error saving widgets to Firestore:', error);
          }
        }, 500); // 500ms debounce for Firestore updates
      }
    }
  }, [widgets])
  
  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
    }
  }, [theme])
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const bodyPadding = 40; // Account for any potential body margin/padding
      setWindowWidth(window.innerWidth - bodyPadding);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Listen for resize events to update the breakpoint
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      let newBreakpoint = 'lg';
      
      // Find which breakpoint we're in
      for (const bp of Object.keys(breakpoints).sort((a, b) => 
        breakpoints[b as keyof typeof breakpoints] - breakpoints[a as keyof typeof breakpoints])) {
        if (width >= breakpoints[bp as keyof typeof breakpoints]) {
          newBreakpoint = bp;
          break;
        }
      }
      
      if (newBreakpoint !== currentBreakpoint) {
        setCurrentBreakpoint(newBreakpoint);
        console.log('Breakpoint changed to:', newBreakpoint);
      }
    };
    
    // Initial check
    updateBreakpoint();
    
    // Add listener
    window.addEventListener('resize', updateBreakpoint);
    
    // Clean up
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, [currentBreakpoint]);
  
  // Calculate row height based on window width to ensure square widgets
  const calculateRowHeight = (): number => {
    // Calculate the column width based on available width
    // Total usable width = windowWidth - (containerPadding * 2) - (margin * (cols - 1))
    const totalPadding = 40; // containerPadding (20px * 2)
    const totalMargins = 10 * (12 - 1); // margin (10px) * (cols - 1)
    const usableWidth = windowWidth - totalPadding - totalMargins;
    
    // Calculate column width (each column should be square)
    const columnWidth = usableWidth / 12;
    
    // Return the column width as row height to ensure squares
    // Apply responsiveness scaling similar to before
    if (windowWidth < 600) {
      return columnWidth * 0.8; // Smaller on mobile
    } else if (windowWidth < 1200) {
      return columnWidth * 0.9; // Slightly smaller on tablets
    } else {
      return columnWidth; // Default for desktop
    }
  };
  
  const rowHeight = calculateRowHeight();
  
  const toggleTheme = (): void => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  // Update addWidget function to work with ResponsiveReactGridLayout
  const addWidget = (type: string): void => {
    // Generate unique ID for this widget instance
    const widgetId = `${type}-${Date.now()}`;
    
    // Create new widget instance
    const newWidget: Widget = {
      id: widgetId,
      type,
      config: getWidgetConfigByType(type) || {}
    };
    
    // Add new widget to state
    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);
    
    // For each breakpoint, create a layout item
    const updatedLayouts = { ...layouts };
    
    // For each breakpoint, add a layout item
    Object.keys(breakpoints).forEach((breakpoint) => {
      if (!updatedLayouts[breakpoint]) {
        updatedLayouts[breakpoint] = [];
      }
      
      // Calculate column count for this breakpoint
      const colCount = cols[breakpoint as keyof typeof cols];
      
      // Create default layout item based on the breakpoint
      const isMobile = breakpoint === 'xs' || breakpoint === 'xxs';
      const defaultItem = createDefaultLayoutItem(
        widgetId, 
        updatedLayouts[breakpoint].length, 
        colCount,
        breakpoint
      );
      
      // If on mobile, force 2x2 grid size
      if (isMobile) {
        defaultItem.w = 2;
        defaultItem.h = 2;
        defaultItem.maxW = 2;
        defaultItem.maxH = 2;
      }
      
      updatedLayouts[breakpoint].push(defaultItem);
    });
    
    // Update layout state
    setLayouts(updatedLayouts);
    
    // If user is logged in, save widgets and layouts to Firestore
    if (auth.currentUser) {
      (async () => {
        try {
          // Save the updated widget list to Firestore
          await userDashboardService.saveWidgets(updatedWidgets);
          await userDashboardService.saveLayouts(updatedLayouts);
          console.log('Saved new widget to Firestore:', widgetId);
        } catch (error) {
          console.error('Error saving new widget to Firestore:', error);
        }
      })();
    }
    
    // Close the widget selector if it's open
    if (widgetSelectorOpen) {
      setWidgetSelectorOpen(false);
    }
  };
  
  const deleteWidget = async (widgetId: string): Promise<void> => {
    // Remove widget config from storage using the updated configManager
    await configManager.clearConfig(widgetId);
    
    // Remove widget from state
    const updatedWidgets = widgets.filter(widget => widget.id !== widgetId);
    setWidgets(updatedWidgets);
    
    // Remove layout item from all breakpoints
    const newLayouts = { ...layouts };
    Object.keys(newLayouts).forEach(breakpoint => {
      newLayouts[breakpoint] = newLayouts[breakpoint].filter(item => item.i !== widgetId);
    });
    setLayouts(newLayouts);
    
    // Save to localStorage as fallback
    localStorage.setItem('boxento-widgets', JSON.stringify(updatedWidgets));
    
    // If user is logged in, save to Firestore
    if (auth.currentUser) {
      try {
        await userDashboardService.saveWidgets(updatedWidgets);
        await userDashboardService.saveLayouts(newLayouts);
      } catch (error) {
        console.error('Error saving to Firestore after widget deletion:', error);
      }
    }
  };
  
  // Add this near the top of the App component along with other state variables
  const layoutUpdateTimeout = React.useRef<number | null>(null);
  
  // Update handleLayoutChange function to handle all responsive layouts
  const handleLayoutChange = (currentLayout: LayoutItem[], allLayouts?: { [key: string]: LayoutItem[] }): void => {
    const validatedLayout = currentLayout.map(item => ({
      ...item,
      w: Math.max(item.w, 2), // Minimum width of 2
      h: Math.max(item.h, 2)  // Minimum height of 2
    }));

    // If we have all layouts from the responsive grid
    if (allLayouts) {
      // Use a timeout to debounce the layout update to prevent excessive state updates
      if (layoutUpdateTimeout.current !== null) {
        clearTimeout(layoutUpdateTimeout.current);
      }
      layoutUpdateTimeout.current = window.setTimeout(async () => {
        // Create a validated copy to prevent mutating the input
        const validatedLayouts = { ...allLayouts };
        
        // Ensure all breakpoints have layouts
        Object.keys(breakpoints).forEach(breakpoint => {
          if (!validatedLayouts[breakpoint]) {
            validatedLayouts[breakpoint] = validatedLayout;
          }
          
          // Enforce minimum sizes on all layouts
          validatedLayouts[breakpoint] = validatedLayouts[breakpoint].map(item => {
            return {
              ...item,
              w: Math.max(item.w, 2),
              h: Math.max(item.h, 2)
            };
          });
        });
        
        // Update layout state
        setLayouts(validatedLayouts);
        
        // Save to localStorage as fallback
        localStorage.setItem('boxento-layouts', JSON.stringify(validatedLayouts));
        
        // If user is logged in, save to Firestore
        if (auth.currentUser) {
          try {
            await userDashboardService.saveLayouts(validatedLayouts);
          } catch (error) {
            console.error('Error saving layouts to Firestore:', error);
          }
        }
      }, 100); // 100ms debounce
    } else {
      // If we only have the current layout, update only the current breakpoint
      const updatedLayouts = { ...layouts };
      updatedLayouts[currentBreakpoint] = validatedLayout;
      setLayouts(updatedLayouts);
      localStorage.setItem('boxento-layouts', JSON.stringify(updatedLayouts));
      
      // Save to Firestore if user is logged in
      if (auth.currentUser) {
        (async () => {
          try {
            await userDashboardService.saveLayouts(updatedLayouts);
          } catch (error) {
            console.error('Error saving layouts to Firestore:', error);
          }
        })();
      }
    }
  };
  
  /**
   * Updates a widget's configuration
   * @param widgetId ID of the widget to update
   * @param newConfig New configuration object
   */
  const updateWidgetConfig = (widgetId: string, newConfig: Record<string, unknown>): void => {
    // Update widget in state
    setWidgets(widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, config: { ...widget.config, ...newConfig } }
        : widget
    ));
    
    // Save to configManager - excluding function properties
    const { ...configToSave } = newConfig as { 
      onDelete?: () => void; 
      onUpdate?: (config: Record<string, unknown>) => void;
      [key: string]: unknown;
    };
    
    // Remove function properties that shouldn't be serialized
    delete configToSave.onDelete;
    delete configToSave.onUpdate;
    
    configManager.saveWidgetConfig(widgetId, configToSave);
  };

  const renderWidget = (widget: Widget, isMobileView = false): React.ReactNode => {
    const WidgetComponent = getWidgetComponent(widget.type);
    
    if (!WidgetComponent) {
      return (
        <div className="widget-error">
          <p>Widget type "{widget.type}" not found</p>
        </div>
      );
    }
    
    // Check if we're in the middle of layout initialization
    if (!isLayoutReady && layouts && Object.keys(layouts).length > 0) {
      // If layouts are still initializing, use a temporary rendering with default dimensions
      return (
        <WidgetErrorBoundary children={
          <WidgetComponent
            width={isMobileView ? 2 : 3}
            height={isMobileView ? 2 : 3}
            config={{
              ...widget.config,
              onDelete: () => deleteWidget(widget.id),
              onUpdate: (newConfig: Record<string, unknown>) => updateWidgetConfig(widget.id, newConfig)
            }}
          />
        } />
      );
    }
    
    // Find layout item for this widget
    const layoutItem = layouts[currentBreakpoint]?.find(item => item.i === widget.id);
    
    if (!layoutItem) {
      // Silently create a temporary layout item for this widget
      // This prevents the warning while still ensuring proper display
      
      // Create a default layout item based on the current breakpoint
      const defaultWidth = isMobileView ? 2 : 3;
      const defaultHeight = isMobileView ? 2 : 3;
      
      // Return widget with these default dimensions
      return (
        <WidgetErrorBoundary children={
          <WidgetComponent
            width={defaultWidth}
            height={defaultHeight}
            config={{
              ...widget.config,
              onDelete: () => deleteWidget(widget.id),
              onUpdate: (newConfig: Record<string, unknown>) => updateWidgetConfig(widget.id, newConfig)
            }}
          />
        } />
      );
    }
    
    // Use the layout item dimensions for the widget
    return (
      <WidgetErrorBoundary children={
        <WidgetComponent
          width={isMobileView ? 2 : layoutItem.w}
          height={isMobileView ? 2 : layoutItem.h}
          config={{
            ...widget.config,
            onDelete: () => deleteWidget(widget.id),
            onUpdate: (newConfig: Record<string, unknown>) => updateWidgetConfig(widget.id, newConfig)
          }}
        />
      } />
    );
  };
  
  // Add state to track dragging direction and current dragged widget
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const lastMousePos = useRef<{ x: number, y: number } | null>(null);
  const dragThreshold = 5; // Minimum mouse movement to determine direction
  
  // Update drag handlers to track direction
  const handleDragStart = (_layout: LayoutItem[], _oldItem: LayoutItem, newItem: LayoutItem, _placeholder: LayoutItem, event: MouseEvent): void => {
    // Add a class to the body to indicate we're dragging
    document.body.classList.add('dragging');
    document.body.classList.add('react-grid-layout--dragging');
    
    // Store the widget ID being dragged
    setDraggedWidgetId(newItem.i);
    
    // Initialize mouse position
    lastMousePos.current = { x: event.clientX, y: event.clientY };
    
    // Reset direction at start
    setDragDirection(null);
    
    // Log for debugging
    console.log('Drag started');
  };
  
  const handleDrag = (_layout: LayoutItem[], _oldItem: LayoutItem, _newItem: LayoutItem, _placeholder: LayoutItem, event: MouseEvent): void => {
    // Skip if no mouse position
    if (!lastMousePos.current) return;
    
    // Calculate direction based on mouse movement
    const deltaX = event.clientX - lastMousePos.current.x;
    
    // Only change direction if movement is significant
    if (Math.abs(deltaX) > dragThreshold) {
      const newDirection = deltaX < 0 ? 'left' : 'right';
      
      // Only update if direction changed
      if (newDirection !== dragDirection) {
        setDragDirection(newDirection);
      }
      
      // Update last position
      lastMousePos.current = { x: event.clientX, y: event.clientY };
    }
  };
  
  const handleDragStop = (): void => {
    // Apply rebound class before removing direction class
    if (draggedWidgetId) {
      // Find the widget that was being dragged by ID
      const widgetElement = document.querySelector(`.react-grid-item[data-grid*="i:${draggedWidgetId}"]`);
      if (widgetElement) {
        widgetElement.classList.add('drag-rebound');
        
        // Remove rebound class after animation completes
        setTimeout(() => {
          widgetElement.classList.remove('drag-rebound');
        }, 500); // Match the animation duration in CSS
      }
    }
    
    // Reset direction and dragged widget
    setDragDirection(null);
    setDraggedWidgetId(null);
    
    // Reset last mouse position
    lastMousePos.current = null;
    
    // Remove classes
    document.body.classList.remove('dragging');
    document.body.classList.remove('react-grid-layout--dragging');
    
    // Force save the current layout state to ensure it's preserved
    const currentLayoutSnapshot = { ...layouts };
    localStorage.setItem('boxento-layouts', JSON.stringify(currentLayoutSnapshot));
    
    // If user is logged in, save to Firestore
    if (auth.currentUser) {
      (async () => {
        try {
          await userDashboardService.saveLayouts(currentLayoutSnapshot);
        } catch (error) {
          console.error('Error saving layouts to Firestore after drag:', error);
        }
      })();
    }
    
    // Log for debugging
    console.log('Drag completed, layout saved');
  };
  
  // Apply drag direction classes to the dragged widget
  useEffect(() => {
    if (draggedWidgetId && dragDirection) {
      // Find the dragged widget element
      const widgetElement = document.querySelector(`.react-grid-item[data-grid*="i:${draggedWidgetId}"].react-draggable-dragging`);
      
      if (widgetElement) {
        // Remove any existing direction classes
        widgetElement.classList.remove('dragging-left', 'dragging-right');
        
        // Add the appropriate direction class
        widgetElement.classList.add(`dragging-${dragDirection}`);
      }
    }
  }, [draggedWidgetId, dragDirection]);
  
  const handleResizeStart = (): void => {
    document.body.classList.add('react-grid-layout--resizing');
  };
  
  const handleResizeStop = (): void => {
    document.body.classList.remove('react-grid-layout--resizing');
    
    // Force save after resize
    const currentLayoutSnapshot = { ...layouts };
    localStorage.setItem('boxento-layouts', JSON.stringify(currentLayoutSnapshot));
  };
  
  const toggleWidgetSelector = (): void => {
    setWidgetSelectorOpen(!widgetSelectorOpen);
  }
  
  // Handle escape key to close any open modals
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Close any open modals
        if (widgetSelectorOpen) {
          setWidgetSelectorOpen(false);
        }
        // Add other modal closing logic here if needed in the future
      }
    };
    
    // Add event listener
    document.addEventListener('keydown', handleEscapeKey);
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [widgetSelectorOpen]);

  // Add this function to create a default layout for a widget
  const createDefaultLayoutItem = (
    widgetId: string, 
    index: number, 
    colCount: number,
    breakpoint: string
  ): LayoutItem => {
    // For desktop layouts (lg, md), create a grid layout
    if (breakpoint === 'lg' || breakpoint === 'md') {
      // Calculate a grid position that works well with vertical compacting
      // Place widgets side by side in rows of 4 (for lg screens)
      const maxItemsPerRow = Math.max(1, Math.floor(colCount / 3)); // 4 items per row for 12 cols
      const col = index % maxItemsPerRow;
      const row = Math.floor(index / maxItemsPerRow);
      
      return {
        i: widgetId,
        x: col * 3,
        y: row * 3,   // Ensure sufficient y-spacing for vertical compacting
        w: 3,         // Default width for desktop
        h: 3,         // Default height for desktop
        minW: 2,
        minH: 2
      };
    } 
    // For medium tablet layouts
    else if (breakpoint === 'sm') {
      // For tablet, use 2 items per row
      const itemsPerRow = 2;
      const col = index % itemsPerRow;
      const row = Math.floor(index / itemsPerRow);
      
      return {
        i: widgetId,
        x: col * 3,
        y: row * 3,
        w: 3,
        h: 3,
        minW: 2,
        minH: 2
      };
    }
    // For mobile layouts (xs, xxs), force 2x2 grid size and stack vertically
    else {
      return {
        i: widgetId,
        x: 0,         // Stack in a single column
        y: index * 2, // Position vertically based on index with a gap
        w: 2,         // Enforce 2x2 grid size for all widgets on mobile
        h: 2,         // Enforce 2x2 grid size for all widgets on mobile
        minW: 2,
        minH: 2,
        maxW: 2,      // Add maximum width constraint for mobile
        maxH: 2       // Add maximum height constraint for mobile
      };
    }
  };

  // In the useEffect that runs on app initialization, add this:
  // Ensure layouts exist for all widgets
  useEffect(() => {
    // Only run this if we have widgets but missing or empty layouts
    if (widgets.length > 0 && 
        (!layouts || 
         Object.keys(layouts).length === 0 || 
         Object.values(layouts).some(layout => layout.length === 0))) {
      
      console.log('Creating default layouts for widgets');
      
      // Create layouts for all breakpoints
      const newLayouts: { [key: string]: LayoutItem[] } = {};
      
      // For each breakpoint, create layout items for all widgets
      Object.keys(breakpoints).forEach(breakpoint => {
        const colsForBreakpoint = cols[breakpoint as keyof typeof cols];
        
        // Create layout items for each widget, using smart positioning based on breakpoint
        newLayouts[breakpoint] = widgets.map((widget, index) => 
          createDefaultLayoutItem(widget.id, index, colsForBreakpoint, breakpoint)
        );
      });
      
      // Update layouts state
      setLayouts(newLayouts);
      console.log('Default layouts created');
    }
  }, [widgets, layouts, breakpoints, cols]);

  // Instead of memoized widgets, we'll optimize in a different way
  const renderWidgetItems = () => {
    return widgets.map(widget => {
      // Find the layout data for this widget to pass as data-grid
      const layoutItem = layouts[currentBreakpoint]?.find(item => item.i === widget.id);
      
      // Always provide explicit positioning values
      const isMobile = currentBreakpoint === 'xs' || currentBreakpoint === 'xxs';
      
      // If no layout item is found, create a temporary one with default values
      // This prevents console warnings and ensures consistent rendering
      const defaultWidth = isMobile ? 2 : 3;
      const defaultHeight = isMobile ? 2 : 3;
      
      // For mobile, ensure widgets have appropriate height
      const dataGrid = {
        i: widget.id,
        x: layoutItem?.x ?? 0,
        y: layoutItem?.y ?? 0,
        w: layoutItem?.w ?? defaultWidth,
        h: isMobile ? 5 : (layoutItem?.h ?? defaultHeight),
        minW: layoutItem?.minW ?? 2,
        minH: isMobile ? 3 : (layoutItem?.minH ?? 2)
      };
      
      // Add different classes based on screen size
      const isTablet = currentBreakpoint === 'sm';
      const sizeClass = isMobile ? 'mobile-widget' : isTablet ? 'tablet-widget' : 'desktop-widget';
      
      return (
        <div 
          key={widget.id} 
          className={`widget-wrapper ${sizeClass}`} 
          data-grid={dataGrid}
          data-breakpoint={currentBreakpoint}
          style={isMobile ? { marginBottom: '16px', height: 'auto' } : undefined}
        >
          {renderWidget(widget, isMobile)}
        </div>
      );
    });
  };

  // Add debug logging for layout issues
  useEffect(() => {
    // Log layout information when the app starts
    console.log('Initial state - current breakpoint:', currentBreakpoint);
    
    // Check if layouts are properly defined for all breakpoints
    const missingLayouts = Object.keys(breakpoints).filter(bp => 
      !layouts[bp] || !Array.isArray(layouts[bp])
    );
    
    if (missingLayouts.length > 0) {
      console.warn(`Missing layouts for breakpoints: ${missingLayouts.join(', ')}`);
    }
    
    // Check if widgets have corresponding layout items
    const widgetsWithoutLayout = widgets.filter(widget => 
      !layouts[currentBreakpoint]?.some(item => item.i === widget.id)
    );
    
    if (widgetsWithoutLayout.length > 0) {
      console.warn(`Widgets without layout items: ${widgetsWithoutLayout.map(w => w.id).join(', ')}`);
    }
  }, [layouts, widgets, currentBreakpoint]);

  // Clean up orphaned layout items (layouts without corresponding widgets)
  useEffect(() => {
    // Only run cleanup if we have both widgets and layouts
    if (widgets.length > 0 && layouts && Object.keys(layouts).length > 0) {
      // Check if there are any orphaned layout items
      let hasOrphanedItems = false;
      const widgetIds = new Set(widgets.map(w => w.id));
      const cleanedLayouts = { ...layouts };
      
      // For each breakpoint, filter out layout items without a corresponding widget
      Object.keys(cleanedLayouts).forEach(breakpoint => {
        const originalLength = cleanedLayouts[breakpoint]?.length || 0;
        
        if (cleanedLayouts[breakpoint] && Array.isArray(cleanedLayouts[breakpoint])) {
          cleanedLayouts[breakpoint] = cleanedLayouts[breakpoint].filter(item => 
            widgetIds.has(item.i)
          );
          
          // Check if we removed any items
          if (cleanedLayouts[breakpoint].length < originalLength) {
            hasOrphanedItems = true;
          }
        }
      });
      
      // If we found orphaned items, update the layouts
      if (hasOrphanedItems) {
        console.log('Cleaning up orphaned layout items');
        setLayouts(cleanedLayouts);
        localStorage.setItem('boxento-layouts', JSON.stringify(cleanedLayouts));
      }
    }
  }, [widgets, layouts]);

  // Inside the App function component, add a special mobile view renderer
  const renderMobileLayout = () => {
    return (
      <div className="mobile-widget-list">
        {widgets.map(widget => (
          <div 
            key={widget.id} 
            className="mobile-widget-item"
          >
            {renderWidget(widget, true)}
          </div>
        ))}
      </div>
    );
  };

  // Add a loading state to control initial render
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  
  // Add effect to handle initial layout loading
  useEffect(() => {
    // Only show the grid once we have layouts and we're sure the measurements are done
    if (layouts && Object.keys(layouts).length > 0 && widgets.length > 0) {
      // Check if all widgets have layout items before marking layout as ready
      let allWidgetsHaveLayouts = true;
      
      // Check if all widgets have layout items for the current breakpoint
      if (currentBreakpoint) {
        for (const widget of widgets) {
          if (!layouts[currentBreakpoint]?.some(item => item.i === widget.id)) {
            allWidgetsHaveLayouts = false;
            console.log(`Widget ${widget.id} is missing a layout item for breakpoint ${currentBreakpoint}`);
            break;
          }
        }
      }
      
      // Add a longer delay if not all widgets have layouts yet
      const delay = allWidgetsHaveLayouts ? 300 : 500;
      
      // Short delay to ensure the layout calculations are complete
      const timer = setTimeout(() => {
        setIsLayoutReady(true);
        console.log('Layout is now ready for rendering');
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [layouts, widgets, currentBreakpoint]);

  // Add state for tracking user
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  
  // Get sync status from context
  const { isSyncing, syncStatus } = useSync();
  
  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in, load their data from Firestore
        await loadUserData();
      } else {
        // User is signed out, load from localStorage
        loadLocalData();
      }
      
      setIsDataLoaded(true);
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);
  
  // Function to load user data from Firestore
  const loadUserData = async (): Promise<void> => {
    try {
      let userHasFirestoreData = false;
      
      // Migrate any legacy layout data structure first
      await userDashboardService.migrateLayoutDataStructure();
      
      // Load widgets first - we'll use them to validate layouts
      try {
        // 1. Load widget metadata first (without configs)
        const firestoreWidgets = await userDashboardService.loadWidgets();
        
        if (firestoreWidgets !== null && firestoreWidgets !== undefined) {
          console.log('Loaded widget metadata from Firestore:', firestoreWidgets);
          
          // 2. Load all widget configurations
          const allConfigs = await configManager.getConfigs(true);
          
          // 3. Merge the widget metadata with their respective configurations
          const typedWidgets = Array.isArray(firestoreWidgets) ? firestoreWidgets.map(widget => {
            const widgetId = widget.id as string;
            return {
              id: widgetId || '',
              type: widget.type as string || '',
              config: widgetId ? (allConfigs[widgetId] || {}) : {}
            } as Widget;
          }) : [];
          
          // 4. Set the merged widgets in state
          setWidgets(typedWidgets);
          userHasFirestoreData = true;
          
          // 5. IMPORTANT: Before loading layouts, validate and fix them based on the widgets
          // This ensures all widgets have layouts for all breakpoints
          console.log('Validating layouts to ensure they match widgets...');
          const validatedLayouts = await userDashboardService.validateAndFixLayouts(
            typedWidgets.map(w => ({ id: w.id, type: w.type }))
          );
          
          // 6. Set the validated layouts in state
          setLayouts(validatedLayouts);
          console.log('Set validated layouts:', validatedLayouts);
          
          // Also update localStorage to match Firestore state
          localStorage.setItem('boxento-widgets', JSON.stringify(typedWidgets));
          localStorage.setItem('boxento-layouts', JSON.stringify(validatedLayouts));
        } else if (!userHasFirestoreData) {
          // Only fall back to localStorage if we haven't found any Firestore data yet
          const localWidgets = loadLocalWidgets();
          if (localWidgets && localWidgets.length > 0) {
            setWidgets(localWidgets);
            
            // Load layouts for these widgets
            const localLayouts = loadLocalLayouts();
            if (localLayouts && Object.keys(localLayouts).length > 0) {
              setLayouts(localLayouts);
            }
            
            // Migrate to Firestore - with new separation of concerns
            try {
              await userDashboardService.saveWidgets(localWidgets);
              
              // Also save each widget's configuration separately
              for (const widget of localWidgets) {
                if (widget.id && widget.config) {
                  const { ...configToSave } = widget.config as Record<string, unknown>;
                  delete configToSave.onDelete;
                  delete configToSave.onUpdate;
                  await configManager.saveWidgetConfig(widget.id, configToSave);
                }
              }
            } catch (migrationError) {
              console.error('Error migrating widgets to Firestore:', migrationError);
              // Continue with local data even if migration fails
            }
          }
        }
      } catch (widgetError) {
        console.error('Error loading widgets from Firestore:', widgetError);
        // Only fall back to localStorage if we haven't loaded Firestore data
        if (!userHasFirestoreData) {
          const localWidgets = loadLocalWidgets();
          if (localWidgets) setWidgets(localWidgets);
          
          const localLayouts = loadLocalLayouts();
          if (localLayouts) setLayouts(localLayouts);
        }
      }
    } catch (error) {
      console.error('Error loading user data from Firestore:', error);
      // Fallback to localStorage
      loadLocalData();
    }
  };
  
  // Function to load from localStorage
  const loadLocalData = () => {
    const localLayouts = loadLocalLayouts();
    if (localLayouts) setLayouts(localLayouts);
    
    const localWidgets = loadLocalWidgets();
    if (localWidgets) setWidgets(localWidgets);
  };
  
  // Helper to load layouts from localStorage
  const loadLocalLayouts = () => {
    try {
      const savedLayouts = localStorage.getItem('boxento-layouts');
      if (savedLayouts) {
        return JSON.parse(savedLayouts);
      }
    } catch (error) {
      console.error('Error loading layouts from localStorage:', error);
    }
    return null;
  };
  
  // Helper to load widgets from localStorage
  const loadLocalWidgets = () => {
    try {
      const savedWidgets = localStorage.getItem('boxento-widgets');
      if (savedWidgets) {
        const parsedWidgets = JSON.parse(savedWidgets);
        // If we have widgets in localStorage, use them
        if (Array.isArray(parsedWidgets) && parsedWidgets.length > 0) {
          return parsedWidgets;
        }
      }
      
      // If there are no widgets in localStorage and user is not logged in,
      // return default widgets
      if (!auth.currentUser) {
        return [
          {
            id: 'default-todo',
            type: 'todo',
            config: getWidgetConfigByType('todo') || {}
          },
          {
            id: 'default-weather',
            type: 'weather',
            config: getWidgetConfigByType('weather') || {}
          },
          {
            id: 'default-quick-links',
            type: 'quick-links',
            config: getWidgetConfigByType('quick-links') || {}
          },
          {
            id: 'default-notes',
            type: 'notes',
            config: getWidgetConfigByType('notes') || {}
          }
        ];
      }
      
      // For logged in users with no widgets, return an empty array
      return [];
    } catch (error) {
      console.error('Error loading widgets from localStorage:', error);
      return auth.currentUser ? [] : [
        {
          id: 'default-todo',
          type: 'todo',
          config: getWidgetConfigByType('todo') || {}
        },
        {
          id: 'default-weather',
          type: 'weather',
          config: getWidgetConfigByType('weather') || {}
        },
        {
          id: 'default-quick-links',
          type: 'quick-links',
          config: getWidgetConfigByType('quick-links') || {}
        },
        {
          id: 'default-notes',
          type: 'notes',
          config: getWidgetConfigByType('notes') || {}
        }
      ];
    }
  };

  // Only render the UI when data is loaded
  if (!isDataLoaded) {
    return (
      <div className="flex h-screen items-center justify-center dark:bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  // In the app header, add a sync status indicator
  return (
    <div className={`app ${theme === 'dark' ? 'dark' : ''}`} data-theme={theme}>
      <div className="fixed top-0 z-50 w-full dark:bg-slate-900/90 backdrop-blur-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-black dark:text-white">Boxento</h1>
          
          <div className="flex items-center space-x-4">
            {/* Sync indicator - only show when user is logged in */}
            {auth.currentUser && (
              <div className="flex items-center">
                {isSyncing ? (
                  <Loader2 className="h-5 w-5 mr-1 text-blue-500 animate-spin" />
                ) : syncStatus === 'success' ? (
                  <Cloud className="h-5 w-5 mr-1 text-green-500" />
                ) : syncStatus === 'error' ? (
                  <AlertCircle className="h-5 w-5 mr-1 text-red-500" />
                ) : (
                  <Cloud className="h-5 w-5 mr-1 text-gray-500" />
                )}
                <span className="text-sm hidden md:inline">
                  {isSyncing ? 'Syncing...' : 
                   syncStatus === 'success' ? 'Synced' : 
                   syncStatus === 'error' ? 'Sync error' : 
                   'Offline'}
                </span>
              </div>
            )}

            <Button
              onClick={toggleWidgetSelector}
              aria-label="Add widget"
              className="rounded-full bg-gray-500 text-white"
            >
              <Plus className="h-5 w-5" />
              Add Widget
            </Button>

            <Button
              onClick={toggleTheme}
              className="rounded-full bg-gray-500 text-white"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <UserMenuButton />
            
          </div>
        </div>
      </div>
      
      <div className="min-h-screen dark:bg-gray-900 text-gray-900 dark:text-white overflow-x-hidden">
        <main className="pt-16 md:pt-20">
          <WidgetSelector 
            isOpen={widgetSelectorOpen}
            onClose={toggleWidgetSelector}
            onAddWidget={addWidget}
            widgetRegistry={WIDGET_REGISTRY}
            widgetCategories={widgetCategories}
          />
          
          <div className="max-w-[1600px] mx-auto">
            <div className="mobile-view-container">
              <div className="mobile-view">
                {renderMobileLayout()}
              </div>
            </div>
            
            <div className="desktop-view-container">
              {/* Add a conditional rendering with opacity transition */}
              <div className={`transition-opacity duration-300 ${isLayoutReady ? 'opacity-100' : 'opacity-0'}`}>
                <ResponsiveReactGridLayout
                  className="layout"
                  layouts={layouts}
                  breakpoints={breakpoints}
                  cols={cols}
                  rowHeight={rowHeight}
                  onLayoutChange={handleLayoutChange}
                  onBreakpointChange={(newBreakpoint: string, newCols: number) => {
                    if (newBreakpoint !== currentBreakpoint) {
                      console.log('Breakpoint changed:', newBreakpoint, newCols);
                      setCurrentBreakpoint(newBreakpoint);
                    }
                  }}
                  onDragStart={handleDragStart}
                  onDrag={handleDrag}
                  onDragStop={handleDragStop}
                  onResizeStart={handleResizeStart}
                  onResizeStop={handleResizeStop}
                  margin={[10, 10]}
                  containerPadding={[10, 10]}
                  draggableHandle=".widget-drag-handle"
                  draggableCancel=".settings-button"
                  useCSSTransforms={true}
                  measureBeforeMount={false}
                  compactType="vertical"
                  verticalCompact={true}
                  preventCollision={false}
                  isResizable={true}
                  isDraggable={true}
                  isBounded={false}
                  autoSize={true}
                  transformScale={1}
                  style={{ width: '100%', minHeight: '100%' }}
                >
                  {renderWidgetItems()}
                </ResponsiveReactGridLayout>
              </div>
              {/* Add a loading indicator that shows only during initial layout calculation */}
              {!isLayoutReady && widgets.length > 0 && (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2">Setting up your dashboard...</span>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App