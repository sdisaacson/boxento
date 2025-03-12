import { db, auth } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { WidgetConfigStore } from './configManager';
import { LayoutItem } from '@/types';

// Utility to get current user ID safely
const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

// User dashboard data service
export const userDashboardService = {
  // Save the user's dashboard layouts
  saveLayouts: async (layouts: { [key: string]: LayoutItem[] }): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      // Sanitize the layouts object to remove undefined values
      // Firestore doesn't accept undefined values
      const sanitizedLayouts = JSON.parse(JSON.stringify(layouts));
      
      await setDoc(doc(db, 'users', userId, 'dashboard', 'layouts'), { layouts: sanitizedLayouts }, { merge: true });
    } catch (error) {
      console.error('Error saving layouts to Firestore:', error);
      throw error;
    }
  },

  // Load the user's dashboard layouts
  loadLayouts: async (): Promise<{ [key: string]: LayoutItem[] } | null> => {
    const userId = getCurrentUserId();
    if (!userId) return null;
    
    try {
      const docRef = doc(db, 'users', userId, 'dashboard', 'layouts');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data()?.layouts || null;
      }
      return null;
    } catch (error) {
      console.error('Error loading layouts from Firestore:', error);
      throw error;
    }
  },

  // Save a widget configuration
  saveWidgetConfig: async (widgetId: string, config: Record<string, unknown>): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      // Sanitize the config object to remove undefined values
      const sanitizedConfig = JSON.parse(JSON.stringify(config));
      
      await setDoc(
        doc(db, 'users', userId, 'dashboard', 'widget-configs', 'configs', widgetId),
        { config: sanitizedConfig },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving widget config to Firestore:', error);
      throw error;
    }
  },

  // Load a widget configuration
  loadWidgetConfig: async (widgetId: string): Promise<Record<string, unknown> | null> => {
    const userId = getCurrentUserId();
    if (!userId) return null;
    
    try {
      const docRef = doc(db, 'users', userId, 'dashboard', 'widget-configs', 'configs', widgetId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data()?.config || null;
      }
      return null;
    } catch (error) {
      console.error('Error loading widget config from Firestore:', error);
      throw error;
    }
  },

  // Save all widget configurations at once
  saveAllWidgetConfigs: async (configs: WidgetConfigStore): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      // Create a batch of operations for better performance
      const batch = writeBatch(db);
      
      // Add each widget config to the batch
      Object.entries(configs).forEach(([widgetId, config]) => {
        const docRef = doc(db, 'users', userId, 'dashboard', 'widget-configs', 'configs', widgetId);
        batch.set(docRef, { config }, { merge: true });
      });
      
      // Commit the batch
      await batch.commit();
    } catch (error) {
      console.error('Error saving all widget configs to Firestore:', error);
      throw error;
    }
  },

  // Load all widget configurations
  loadAllWidgetConfigs: async (): Promise<WidgetConfigStore | null> => {
    const userId = getCurrentUserId();
    if (!userId) return null;
    
    try {
      const colRef = collection(db, 'users', userId, 'dashboard', 'widget-configs', 'configs');
      const querySnapshot = await getDocs(colRef);
      
      const configs: WidgetConfigStore = {};
      querySnapshot.forEach((doc) => {
        configs[doc.id] = doc.data()?.config || {};
      });
      
      return configs;
    } catch (error) {
      console.error('Error loading all widget configs from Firestore:', error);
      throw error;
    }
  },

  // Save the list of installed widgets
  saveWidgets: async (widgets: Record<string, unknown>[]): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      // Sanitize the widgets array to remove undefined values
      // Firestore doesn't accept undefined values
      const sanitizedWidgets = JSON.parse(JSON.stringify(widgets));
      
      await setDoc(
        doc(db, 'users', userId, 'dashboard', 'widget-list'),
        { widgets: sanitizedWidgets },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving widgets to Firestore:', error);
      throw error;
    }
  },

  // Load the list of installed widgets
  loadWidgets: async (): Promise<Record<string, unknown>[] | null> => {
    const userId = getCurrentUserId();
    if (!userId) return null;
    
    try {
      const docRef = doc(db, 'users', userId, 'dashboard', 'widget-list');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data()?.widgets || null;
      }
      return null;
    } catch (error) {
      console.error('Error loading widgets from Firestore:', error);
      throw error;
    }
  },

  // Delete a widget configuration
  deleteWidgetConfig: async (widgetId: string): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      await deleteDoc(doc(db, 'users', userId, 'dashboard', 'widget-configs', 'configs', widgetId));
    } catch (error) {
      console.error('Error deleting widget config from Firestore:', error);
      throw error;
    }
  },

  // Migrate data from localStorage to Firestore
  migrateFromLocalStorage: async (): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    try {
      // Migrate layouts
      const storedLayouts = localStorage.getItem('boxento-layouts');
      if (storedLayouts) {
        const layouts = JSON.parse(storedLayouts);
        await userDashboardService.saveLayouts(layouts);
      }
      
      // Migrate widgets
      const storedWidgets = localStorage.getItem('boxento-widgets');
      if (storedWidgets) {
        const widgets = JSON.parse(storedWidgets);
        await userDashboardService.saveWidgets(widgets);
      }
      
      // Migrate widget configs
      const storedConfigs = localStorage.getItem('boxento-widget-configs');
      if (storedConfigs) {
        const configs = JSON.parse(storedConfigs);
        await userDashboardService.saveAllWidgetConfigs(configs);
      }
      
      console.log('Migration from localStorage to Firestore completed');
    } catch (error) {
      console.error('Error migrating data from localStorage to Firestore:', error);
      throw error;
    }
  }
}; 