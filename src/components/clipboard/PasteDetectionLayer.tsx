import React, { useCallback } from 'react';
import { processUrl, UrlMatchResult } from '@/lib/services/clipboard/urlDetector';
import { toast } from 'sonner';

interface PasteDetectionLayerProps {
  onUrlDetected: (result: UrlMatchResult) => void;
  onUndo: () => void;
  className?: string;
}

/**
 * PasteDetectionLayer Component
 * 
 * Detects and processes URLs pasted onto the dashboard.
 * Currently supports:
 * - YouTube URLs (creates YouTube widget)
 * 
 * Can be extended to support:
 * - Sports websites (creates score widget)
 * - Weather websites (creates weather widget)
 * - And more...
 */
export const PasteDetectionLayer: React.FC<PasteDetectionLayerProps> = ({
  onUrlDetected,
  onUndo,
  className = '',
}) => {
  const handlePaste = useCallback((event: ClipboardEvent) => {
    // Only process paste if it's directly on the dashboard (not in an input/contenteditable)
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Get text from clipboard
    const text = event.clipboardData?.getData('text');
    if (!text) return;

    // Process the text for supported URLs
    const result = processUrl(text);
    if (result) {
      event.preventDefault();
      onUrlDetected(result);
      
      // Show success toast with undo option
      toast.success('Widget created!', {
        description: `A new ${result.type} widget has been created.`,
        action: {
          label: 'Undo',
          onClick: onUndo
        }
      });
    }
  }, [onUrlDetected, onUndo]);

  // Attach paste event listener
  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return (
    <div 
      className={`fixed inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
      role="presentation"
    />
  );
}; 