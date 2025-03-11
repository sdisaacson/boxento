/**
 * Widget Helper Utilities
 * 
 * This file contains reusable helper functions for widgets
 */

import { useEffect, useRef, useState, RefObject, MutableRefObject } from 'react';

interface WidgetSettingsHook {
  showSettings: boolean;
  showSettingsRef: MutableRefObject<boolean>;
  toggleSettings: () => void;
  settingsRef: RefObject<HTMLDivElement | null>;
  settingsButtonRef: RefObject<HTMLButtonElement | null>;
  portalContainer: HTMLElement | null;
}

/**
 * Custom hook for managing widget settings with portal support
 * 
 * This hook provides stable state management for widget settings modals
 * that need to use React portals, which can be problematic when
 * components are wrapped in error boundaries or when React StrictMode
 * causes double-rendering.
 */
export const useWidgetSettings = (): WidgetSettingsHook => {
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const showSettingsRef = useRef<boolean>(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);

  // Set portal container on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPortalContainer(document.body);
    }
  }, []);

  // Handle clicks outside the settings modal
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        showSettingsRef.current && 
        settingsRef.current && 
        !settingsRef.current.contains(e.target as Node) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(e.target as Node)
      ) {
        showSettingsRef.current = false;
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    showSettingsRef.current = showSettings;
  }, [showSettings]);

  // Toggle settings with ref tracking for stability
  const toggleSettings = (): void => {
    const newValue = !showSettingsRef.current;
    showSettingsRef.current = newValue;
    
    // Use setTimeout to ensure the state update happens outside
    // of any ongoing React updates
    setTimeout(() => {
      setShowSettings(newValue);
    }, 0);
  };

  return {
    showSettings,
    showSettingsRef,
    toggleSettings,
    settingsRef,
    settingsButtonRef,
    portalContainer
  };
};