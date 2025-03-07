import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch errors in widget rendering
 * 
 * Provides a fallback UI when a widget fails to render due to an error
 * 
 * @component
 */
class WidgetErrorBoundary extends React.Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Widget error:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
          <AlertTriangle className="mb-2" size={24} aria-hidden="true" />
          <h3 className="text-sm font-medium mb-1">Widget Error</h3>
          <p className="text-xs text-center">
            {this.state.error?.message || "An error occurred while rendering this widget"}
          </p>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default WidgetErrorBoundary; 