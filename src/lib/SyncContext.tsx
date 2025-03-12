import React, { createContext, useContext, useState, useEffect, ReactNode, Component, ErrorInfo } from 'react';
import { auth, db } from './firebase';
import { onSnapshot, doc, collection } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface SyncContextProps {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
}

const SyncContext = createContext<SyncContextProps>({
  isSyncing: false,
  lastSyncTime: null,
  syncError: null,
  syncStatus: 'idle'
});

export const useSync = () => useContext(SyncContext);

// Error boundary component to catch errors in SyncProvider
class SyncErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SyncProvider error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Sync Error</h3>
          <p className="text-sm text-red-600 mt-1">
            An error occurred while setting up synchronization. Your data will still be saved locally.
          </p>
          <p className="text-xs text-red-500 mt-2">
            Error details: {this.state.error?.message || 'Unknown error'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Set up listeners for Firestore data changes
  useEffect(() => {
    if (!currentUser) return;
    
    setSyncStatus('syncing');
    setIsSyncing(true);
    
    let layoutsUnsubscribe: () => void = () => {};
    let widgetsUnsubscribe: () => void = () => {};
    let widgetConfigsUnsubscribe: () => void = () => {};
    
    try {
      // Listen for layouts changes
      layoutsUnsubscribe = onSnapshot(
        doc(db, 'users', currentUser.uid, 'dashboard', 'layouts'),
        (doc) => {
          if (doc.exists()) {
            // Update localStorage as a fallback - store direct data, not wrapped in 'layouts'
            localStorage.setItem('boxento-layouts', JSON.stringify(doc.data()));
            
            setLastSyncTime(new Date());
            setSyncStatus('success');
            setIsSyncing(false);
            setSyncError(null);
          }
        },
        (error) => {
          console.error('Error syncing layouts:', error);
          setSyncError(`Error syncing layouts: ${error.message}`);
          setSyncStatus('error');
          setIsSyncing(false);
        }
      );
      
      // Listen for widgets collection changes
      widgetsUnsubscribe = onSnapshot(
        doc(db, 'users', currentUser.uid, 'dashboard', 'widget-list'),
        (doc) => {
          if (doc.exists()) {
            // Update localStorage as a fallback
            localStorage.setItem('boxento-widgets', JSON.stringify(doc.data().widgets));
            
            setLastSyncTime(new Date());
            setSyncStatus('success');
            setIsSyncing(false);
            setSyncError(null);
          }
        },
        (error) => {
          console.error('Error syncing widgets:', error);
          setSyncError(`Error syncing widgets: ${error.message}`);
          setSyncStatus('error');
          setIsSyncing(false);
        }
      );
      
      try {
        // Listen for widget configurations
        widgetConfigsUnsubscribe = onSnapshot(
          collection(db, 'users', currentUser.uid, 'dashboard', 'widget-configs', 'configs'),
          (snapshot) => {
            // Convert the collection to an object
            const configs: Record<string, unknown> = {};
            snapshot.forEach((doc) => {
              configs[doc.id] = doc.data().config;
            });
            
            // Update localStorage as a fallback
            localStorage.setItem('boxento-widget-configs', JSON.stringify(configs));
            
            setLastSyncTime(new Date());
            setSyncStatus('success');
            setIsSyncing(false);
            setSyncError(null);
          },
          (error) => {
            console.error('Error syncing widget configurations:', error);
            setSyncError(`Error syncing widget configurations: ${error.message}`);
            setSyncStatus('error');
            setIsSyncing(false);
          }
        );
      } catch (configError: unknown) {
        const errorMessage = configError instanceof Error ? configError.message : 'Unknown error';
        console.error('Error setting up widget configs listener:', configError);
        setSyncError(`Error setting up sync: ${errorMessage}`);
        setSyncStatus('error');
        setIsSyncing(false);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error setting up Firestore listeners:', error);
      setSyncError(`Error setting up sync: ${errorMessage}`);
      setSyncStatus('error');
      setIsSyncing(false);
    }
    
    // Cleanup listeners
    return () => {
      try {
        layoutsUnsubscribe();
        widgetsUnsubscribe();
        widgetConfigsUnsubscribe();
      } catch (error: unknown) {
        console.error('Error cleaning up Firestore listeners:', error);
      }
    };
  }, [currentUser]);
  
  return (
    <SyncContext.Provider value={{ isSyncing, lastSyncTime, syncError, syncStatus }}>
      {children}
    </SyncContext.Provider>
  );
};

// Export the wrapped provider
export const SafeSyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SyncErrorBoundary>
      <SyncProvider>{children}</SyncProvider>
    </SyncErrorBoundary>
  );
}; 