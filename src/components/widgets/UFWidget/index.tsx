import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog';
import WidgetHeader from '../common/WidgetHeader';
import { UFWidgetProps, UFWidgetConfig, UFData } from './types';
import { Button } from '../../ui/button';

/**
 * Size categories for widget content rendering
 */
enum WidgetSizeCategory {
  SMALL = 'small',         // 2x2
  WIDE_SMALL = 'wideSmall', // 3x2 
  TALL_SMALL = 'tallSmall', // 2x3
  MEDIUM = 'medium',       // 3x3
  WIDE_MEDIUM = 'wideMedium', // 4x3
  TALL_MEDIUM = 'tallMedium', // 3x4
  LARGE = 'large'          // 4x4
}

/**
 * UF Widget Component
 * 
 * This widget displays the value of UF (Unidad de Fomento) in Chilean Pesos
 * using data from mindicador.cl API.
 * 
 * @param {UFWidgetProps} props - Component props
 * @returns {JSX.Element} Widget component
 */
const UFWidget: React.FC<UFWidgetProps> = ({ width, height, config }) => {
  // Default configuration
  const defaultConfig: UFWidgetConfig = {
    title: 'UF (Chile)',
    showHistory: false,
    refreshInterval: 60 // minutes
  };

  // Component state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [localConfig, setLocalConfig] = useState<UFWidgetConfig>({
    ...defaultConfig,
    ...config
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ufData, setUfData] = useState<UFData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [useFallbackData, setUseFallbackData] = useState<boolean>(false);
  const maxRetries = 3;
  
  // Ref for the widget container
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fallback static UF data 
  const fallbackUfData: UFData = {
    codigo: 'uf',
    nombre: 'Unidad de Fomento (UF)',
    unidad_medida: 'Pesos',
    fecha: new Date().toISOString().split('T')[0],
    valor: 38437.12, // This is a static value that should be updated when deploying
    serie: [
      {
        fecha: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        valor: 38420.05
      },
      {
        fecha: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        valor: 38390.72
      },
      {
        fecha: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
        valor: 38368.23
      }
    ]
  };

  // If using fallback data, set it immediately when component mounts
  useEffect(() => {
    if (useFallbackData && !ufData) {
      setUfData(fallbackUfData);
      setLastUpdated(new Date());
      setLoading(false);
    }
  }, [useFallbackData]);

  // Update local config when props config changes
  useEffect(() => {
    setLocalConfig((prevConfig: UFWidgetConfig) => ({
      ...prevConfig,
      ...config
    }));
  }, [config]);

  // Fetch UF data from API with retry logic
  const fetchUfData = async () => {
    try {
      setError(null);
      setUseFallbackData(false);

      const response = await fetch('https://mindicador.cl/api/uf');
      if (!response.ok) {
        throw new Error('Failed to fetch UF data');
      }

      const data = await response.json();
      setUfData(data);
      setLastUpdated(new Date());
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching UF data:', err);
      
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        // Retry after a delay
        setTimeout(() => {
          fetchUfData();
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        setError('Failed to fetch UF data after multiple attempts');
        setUseFallbackData(true);
      }
    }
  };
  
  // Setup data fetching and refresh timer
  useEffect(() => {
    // Create abort controller for cleanup
    const abortController = new AbortController();
    
    // Fetch data immediately
    fetchUfData().catch(console.error);
    
    // Setup refresh timer with fallback default
    const refreshIntervalMinutes = localConfig.refreshInterval !== undefined 
      ? localConfig.refreshInterval 
      : defaultConfig.refreshInterval || 60;
    
    const refreshIntervalMs = refreshIntervalMinutes * 60 * 1000;
    
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    
    // Set up new timer and store the ID
    const timerId = setInterval(() => {
      fetchUfData().catch(console.error);
    }, refreshIntervalMs);
    refreshTimerRef.current = timerId;
    
    // Cleanup
    return () => {
      // Abort any pending fetch
      abortController.abort();
      
      // Cleanup timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [localConfig.refreshInterval]);
  
  /**
   * Determines the appropriate size category based on width and height
   */
  const getWidgetSizeCategory = (width: number, height: number): WidgetSizeCategory => {
    if (width >= 4 && height >= 4) {
      return WidgetSizeCategory.LARGE;
    } else if (width >= 4 && height >= 3) {
      return WidgetSizeCategory.WIDE_MEDIUM;
    } else if (width >= 3 && height >= 4) {
      return WidgetSizeCategory.TALL_MEDIUM;
    } else if (width >= 3 && height >= 3) {
      return WidgetSizeCategory.MEDIUM;
    } else if (width >= 3 && height >= 2) {
      return WidgetSizeCategory.WIDE_SMALL;
    } else if (width >= 2 && height >= 3) {
      return WidgetSizeCategory.TALL_SMALL;
    } else {
      return WidgetSizeCategory.SMALL;
    }
  };
  
  // Format the UF value with proper thousands separator and 2 decimal places
  const formatUfValue = (value: number | undefined | null): string => {
    if (value === undefined || value === null) {
      return '--';
    }
    return value.toLocaleString('es-CL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  // Format date to DD/MM/YYYY
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
  };
  
  // Render content based on widget size
  const renderContent = () => {
    const sizeCategory = getWidgetSizeCategory(width, height);
    
    switch (sizeCategory) {
      case WidgetSizeCategory.SMALL:
        return renderSmallView();
      case WidgetSizeCategory.WIDE_SMALL:
        return renderWideSmallView();
      case WidgetSizeCategory.TALL_SMALL:
        return renderTallSmallView();
      case WidgetSizeCategory.MEDIUM:
        return renderMediumView();
      case WidgetSizeCategory.WIDE_MEDIUM:
        return renderWideMediumView();
      case WidgetSizeCategory.TALL_MEDIUM:
        return renderTallMediumView();
      case WidgetSizeCategory.LARGE:
        return renderLargeView();
      default:
        return renderSmallView();
    }
  };
  
  // Render small view (2x2)
  const renderSmallView = () => {
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="animate-pulse">Cargando...</div>
        </div>
      );
    }
    
    if (error) {
      return renderErrorView();
    }
    
    if (!ufData || typeof ufData.valor === 'undefined') {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-gray-500 text-sm">No hay datos disponibles</div>
        </div>
      );
    }
    
    return (
      <div className="h-full flex flex-col justify-center items-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          ${formatUfValue(ufData.valor)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formatDate(ufData.fecha)}
        </div>
        {useFallbackData && (
          <div className="text-xs text-amber-500 dark:text-amber-400 mt-1">
            (Valor aproximado)
          </div>
        )}
      </div>
    );
  };
  
  // Render error view with retry button and fallback option
  const renderErrorView = () => {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-red-500 text-sm mb-2">Error al cargar datos</div>
        <div className="text-xs text-gray-500 mb-3">
          {error}
        </div>
        <div className="flex flex-col space-y-2">
          <button 
            onClick={() => fetchUfData()}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
            aria-label="Reintentar cargar datos"
          >
            Reintentar
          </button>
          <button 
            onClick={() => {
              setUseFallbackData(true);
              setUfData(fallbackUfData);
              setLastUpdated(new Date());
              setLoading(false);
              setError(null);
            }}
            className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
            aria-label="Usar datos aproximados"
          >
            Usar valor aproximado
          </button>
        </div>
      </div>
    );
  };
  
  // Render wide small view (3x2 or 4x2)
  const renderWideSmallView = () => {
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="animate-pulse">Cargando...</div>
        </div>
      );
    }
    
    if (error) {
      return renderErrorView();
    }
    
    if (!ufData || typeof ufData.valor === 'undefined') {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-gray-500 text-sm">No hay datos disponibles</div>
        </div>
      );
    }
    
    return (
      <div className="h-full flex justify-between items-center">
        <div className="flex flex-col">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
            UF Chile
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ${formatUfValue(ufData.valor)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(ufData.fecha)}
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <button 
            onClick={() => fetchUfData()}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            Actualizar
          </button>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {lastUpdated && `Última actualización: ${lastUpdated.toLocaleTimeString()}`}
          </div>
        </div>
      </div>
    );
  };
  
  // Render tall small view (2x3 or 2x4)
  const renderTallSmallView = () => {
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="animate-pulse">Cargando...</div>
        </div>
      );
    }
    
    if (error) {
      return renderErrorView();
    }
    
    if (!ufData || typeof ufData.valor === 'undefined') {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-gray-500 text-sm">No hay datos disponibles</div>
        </div>
      );
    }
    
    return (
      <div className="h-full flex flex-col justify-between">
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
            UF Chile
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            ${formatUfValue(ufData.valor)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(ufData.fecha)}
          </div>
        </div>
        
        <div>
          <button 
            onClick={() => fetchUfData()}
            className="w-full text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            Actualizar
          </button>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            {lastUpdated && `Última actualización: ${lastUpdated.toLocaleTimeString()}`}
          </div>
        </div>
      </div>
    );
  };
  
  // Render medium view (3x3)
  const renderMediumView = () => {
    if (loading || error || !ufData) {
      return renderSmallView();
    }
    
    const showHistoricalData = localConfig.showHistory && ufData.serie && ufData.serie.length > 0;
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Unidad de Fomento (UF)
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              ${formatUfValue(ufData.valor)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(ufData.fecha)}
            </div>
          </div>
          
          <button 
            onClick={() => fetchUfData()}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            Actualizar
          </button>
        </div>
        
        {showHistoricalData && (
          <div className="flex-grow overflow-y-auto">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Historial reciente
            </div>
            <div className="space-y-1">
              {ufData.serie.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between text-xs px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded">
                  <span>{formatDate(item.fecha)}</span>
                  <span className="font-medium">${formatUfValue(item.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          {lastUpdated && `Última actualización: ${lastUpdated.toLocaleTimeString()}`}
        </div>
      </div>
    );
  };
  
  // Render wide medium view (4x3)
  const renderWideMediumView = () => {
    if (loading || error || !ufData) {
      return renderMediumView();
    }
    
    const showHistoricalData = localConfig.showHistory && ufData.serie && ufData.serie.length > 0;
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Unidad de Fomento (UF) - Chile
            </div>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              ${formatUfValue(ufData.valor)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Valor al {formatDate(ufData.fecha)}
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <button 
              onClick={() => fetchUfData()}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
            >
              Actualizar
            </button>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {lastUpdated && `Última actualización: ${lastUpdated.toLocaleTimeString()}`}
            </div>
          </div>
        </div>
        
        {showHistoricalData && (
          <div className="flex-grow overflow-y-auto">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Historial de valores
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ufData.serie.slice(0, 10).map((item, index) => (
                <div key={index} className="flex justify-between text-xs px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded">
                  <span>{formatDate(item.fecha)}</span>
                  <span className="font-medium">${formatUfValue(item.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Fuente: mindicador.cl
        </div>
      </div>
    );
  };
  
  // Render tall medium view (3x4)
  const renderTallMediumView = () => {
    if (loading || error || !ufData) {
      return renderMediumView();
    }
    
    const showHistoricalData = localConfig.showHistory && ufData.serie && ufData.serie.length > 0;
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Unidad de Fomento (UF)
            </div>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              ${formatUfValue(ufData.valor)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(ufData.fecha)}
            </div>
          </div>
          
          <button 
            onClick={() => fetchUfData()}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            Actualizar
          </button>
        </div>
        
        {showHistoricalData && (
          <div className="flex-grow overflow-y-auto">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Historial de valores
            </div>
            <div className="space-y-1">
              {ufData.serie.slice(0, 15).map((item, index) => (
                <div key={index} className="flex justify-between text-xs px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded">
                  <span>{formatDate(item.fecha)}</span>
                  <span className="font-medium">${formatUfValue(item.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          {lastUpdated && `Última actualización: ${lastUpdated.toLocaleTimeString()}`}
          <div>Fuente: mindicador.cl</div>
        </div>
      </div>
    );
  };
  
  // Render large view (4x4 or larger)
  const renderLargeView = () => {
    if (loading || error || !ufData) {
      return renderMediumView();
    }
    
    const showHistoricalData = localConfig.showHistory && ufData.serie && ufData.serie.length > 0;
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Unidad de Fomento (UF) - Chile
            </div>
            <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
              ${formatUfValue(ufData.valor)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Valor al {formatDate(ufData.fecha)}
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <button 
              onClick={() => fetchUfData()}
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
            >
              Actualizar
            </button>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {lastUpdated && `Última actualización: ${lastUpdated.toLocaleTimeString()}`}
            </div>
          </div>
        </div>
        
        {showHistoricalData && (
          <div className="flex-grow overflow-y-auto">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Historial de valores
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
              {ufData.serie.slice(0, 20).map((item, index) => (
                <div key={index} className="flex justify-between text-sm px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span>{formatDate(item.fecha)}</span>
                  <span className="font-medium">${formatUfValue(item.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex justify-between items-center">
          <div>Fuente: mindicador.cl</div>
          <div>{lastUpdated && `Actualizado: ${lastUpdated.toLocaleTimeString()}`}</div>
        </div>
      </div>
    );
  };
  
  // Save settings
  const saveSettings = () => {
    if (config?.onUpdate) {
      config.onUpdate(localConfig);
      
      // Re-fetch data if refresh interval has changed
      const configRefreshInterval = config.refreshInterval !== undefined 
        ? config.refreshInterval 
        : defaultConfig.refreshInterval || 60;
        
      if (localConfig.refreshInterval !== configRefreshInterval) {
        // Clear any existing timer
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
        
        // Set up new timer with fallback default
        const refreshIntervalMinutes = localConfig.refreshInterval !== undefined 
          ? localConfig.refreshInterval 
          : defaultConfig.refreshInterval || 60;
        
        const refreshIntervalMs = refreshIntervalMinutes * 60 * 1000;
        
        // Set up new timer and store the ID
        const timerId = setInterval(fetchUfData, refreshIntervalMs);
        refreshTimerRef.current = timerId;
      }
    }
    setShowSettings(false);
  };
  
  // Settings dialog
  const renderSettings = () => {
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>UF Widget Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Title setting */}
            <div>
              <label htmlFor="title-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Widget Title
              </label>
              <input
                id="title-input"
                type="text"
                value={localConfig.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setLocalConfig({...localConfig, title: e.target.value})
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Show history toggle */}
            <div className="flex items-center">
              <input
                id="history-toggle"
                type="checkbox"
                checked={localConfig.showHistory || false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setLocalConfig({...localConfig, showHistory: e.target.checked})
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="history-toggle" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Show Historical Data
              </label>
            </div>
            
            {/* Refresh interval setting */}
            <div>
              <label htmlFor="refresh-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Refresh Interval (minutes)
              </label>
              <input
                id="refresh-input"
                type="number"
                min="1"
                max="1440"
                value={localConfig.refreshInterval || defaultConfig.refreshInterval}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setLocalConfig({...localConfig, refreshInterval: parseInt(e.target.value) || defaultConfig.refreshInterval})
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              {config?.onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (config.onDelete) {
                      config.onDelete();
                    }
                  }}
                  aria-label="Delete this widget"
                >
                  Delete Widget
                </Button>
              )}
              <Button
                type="button"
                onClick={saveSettings}
              >
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Main render
  return (
    <div ref={widgetRef} className="widget-container h-full flex flex-col relative">
      <WidgetHeader 
        title={localConfig.title || defaultConfig.title} 
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="flex-grow p-4 overflow-hidden">
        {renderContent()}
      </div>
      
      {renderSettings()}
    </div>
  );
};

export default UFWidget; 