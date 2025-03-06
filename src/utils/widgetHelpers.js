/**
 * Widget Helper Utilities
 * 
 * This file contains reusable helper functions for widgets
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for managing widget settings with portal support
 * 
 * This hook provides stable state management for widget settings modals
 * that need to use React portals, which can be problematic when
 * components are wrapped in error boundaries or when React StrictMode
 * causes double-rendering.
 * 
 * @returns {Object} Hook interface
 * @property {boolean} showSettings - Current setting visibility state
 * @property {Function} toggleSettings - Function to toggle settings visibility
 * @property {Object} settingsRef - Ref to attach to the settings modal
 * @property {Object} settingsButtonRef - Ref to attach to the settings button
 * @property {Object} portalContainer - DOM node to render the portal in 
 */
export const useWidgetSettings = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [portalContainer, setPortalContainer] = useState(null);
  const showSettingsRef = useRef(false);
  const settingsRef = useRef(null);
  const settingsButtonRef = useRef(null);

  // Set portal container on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPortalContainer(document.body);
    }
  }, []);

  // Handle clicks outside the settings modal
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        showSettingsRef.current && 
        settingsRef.current && 
        !settingsRef.current.contains(e.target) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(e.target)
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
  const toggleSettings = () => {
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