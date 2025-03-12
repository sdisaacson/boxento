import React, { useState } from 'react';
import { Cloud, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { userDashboardService } from '@/lib/firestoreService';

interface DataMigrationSectionProps {
  className?: string;
}

/**
 * Component for user data migration to Firestore
 */
const DataMigrationSection: React.FC<DataMigrationSectionProps> = ({ className = '' }) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationSuccess, setMigrationSuccess] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  
  const handleMigration = async () => {
    if (!auth.currentUser) {
      setMigrationError('You must be logged in to migrate data');
      return;
    }
    
    setIsMigrating(true);
    setMigrationError(null);
    
    try {
      await userDashboardService.migrateFromLocalStorage();
      setMigrationSuccess(true);
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationError('Failed to migrate data. Please try again.');
    } finally {
      setIsMigrating(false);
    }
  };
  
  // Don't render anything if user is not logged in
  if (!auth.currentUser) {
    return null;
  }
  
  return (
    <div className={`data-migration-section p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm ${className}`}>
      <h3 className="font-semibold text-lg mb-2">Data Migration</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Migrate your dashboard data from this device to your cloud account. This ensures your 
        dashboard layout and widget settings are available on all your devices.
      </p>
      
      <div className="flex flex-col gap-4">
        <button 
          onClick={handleMigration} 
          disabled={isMigrating}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-md transition-colors"
        >
          {isMigrating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Migrating data...</span>
            </>
          ) : (
            <>
              <Cloud className="h-5 w-5" />
              <span>Migrate Data to Cloud</span>
            </>
          )}
        </button>
        
        {migrationSuccess && (
          <div className="success-message bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-3 rounded-md">
            Data successfully migrated to your cloud account! Your dashboard and widget configurations are now 
            synchronized across all your devices.
          </div>
        )}
        
        {migrationError && (
          <div className="error-message bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded-md">
            {migrationError}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataMigrationSection; 