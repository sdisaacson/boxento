import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog';
import WidgetHeader from '../common/WidgetHeader';
import { GitHubStreakWidgetProps, GitHubStreakWidgetConfig } from './types';

/**
 * Size categories for widget content rendering
 * This enum provides clear naming for different widget dimensions
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
 * GitHub contribution data interface
 */
interface GitHubContributionData {
  username: string;
  currentStreak: number;
  longestStreak: number;
  totalContributions: number;
  contributionsByDay: {
    date: string;
    count: number;
  }[];
  loading: boolean;
  error: string | null;
}

/**
 * GitHubStreakWidget Component
 * 
 * A widget that displays a user's GitHub contribution streak and contribution graph
 * 
 * @param {GitHubStreakWidgetProps} props - Component props
 * @returns {JSX.Element} Widget component
 */
const GitHubStreakWidget: React.FC<GitHubStreakWidgetProps> = ({ width, height, config }) => {
  // Default configuration
  const defaultConfig: GitHubStreakWidgetConfig = {
    title: 'GitHub Streak',
    username: '',
    showContributionGraph: true,
    daysToShow: 30
  };

  // Component state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [localConfig, setLocalConfig] = useState<GitHubStreakWidgetConfig>({
    ...defaultConfig,
    ...config
  });
  
  const [githubData, setGithubData] = useState<GitHubContributionData>({
    username: '',
    currentStreak: 0,
    longestStreak: 0,
    totalContributions: 0,
    contributionsByDay: [],
    loading: false,
    error: null
  });
  
  // Ref for the widget container
  const widgetRef = useRef<HTMLDivElement | null>(null);
  
  // Update local config when props config changes
  useEffect(() => {
    setLocalConfig((prevConfig: GitHubStreakWidgetConfig) => ({
      ...prevConfig,
      ...config
    }));
  }, [config]);
  
  // Fetch GitHub contribution data when username changes
  useEffect(() => {
    const fetchGitHubData = async () => {
      // Skip if no username is provided
      if (!localConfig.username) {
        return;
      }
      
      setGithubData(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        // In a real implementation, this would make an API call to GitHub or a proxy service
        // For now, we'll simulate a response with mock data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for demonstration
        const mockData = {
          username: localConfig.username,
          currentStreak: 7,
          longestStreak: 21,
          totalContributions: 532,
          contributionsByDay: Array.from({ length: 60 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
              date: date.toISOString().split('T')[0],
              count: Math.floor(Math.random() * 8) // Random contribution count 0-7
            };
          }).reverse(),
          loading: false,
          error: null
        };
        
        setGithubData(mockData);
      } catch (error) {
        setGithubData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch GitHub data. Please check the username and try again.'
        }));
      }
    };
    
    fetchGitHubData();
  }, [localConfig.username]);
  
  /**
   * Determines the appropriate size category based on width and height
   * 
   * @param width - Widget width in grid units
   * @param height - Widget height in grid units
   * @returns The corresponding WidgetSizeCategory
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
  
  // Render content based on widget size
  const renderContent = () => {
    const sizeCategory = getWidgetSizeCategory(width, height);
    
    switch (sizeCategory) {
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
      case WidgetSizeCategory.SMALL:
      default:
        return renderSmallView();
    }
  };
  
  /**
   * Render a contribution cell for the GitHub graph
   */
  const renderContributionCell = (count: number, date: string, index: number) => {
    // Color based on contribution count
    let bgColor = 'bg-gray-100 dark:bg-gray-800';
    
    if (count > 0) {
      if (count >= 6) {
        bgColor = 'bg-green-700 dark:bg-green-600';
      } else if (count >= 4) {
        bgColor = 'bg-green-500 dark:bg-green-500';
      } else if (count >= 2) {
        bgColor = 'bg-green-300 dark:bg-green-400';
      } else {
        bgColor = 'bg-green-100 dark:bg-green-300';
      }
    }
    
    return (
      <div
        key={index}
        className={`${bgColor} w-3 h-3 rounded-sm transition-colors`}
        title={`${count} contributions on ${date}`}
      />
    );
  };
  
  // Small view (2x2) - Basic streak info
  const renderSmallView = () => {
    if (!localConfig.username) {
      return (
        <div className="h-full flex flex-col items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Configure your GitHub username in settings
          </p>
        </div>
      );
    }
    
    if (githubData.loading) {
      return (
        <div className="h-full flex flex-col items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      );
    }
    
    if (githubData.error) {
      return (
        <div className="h-full flex flex-col items-center justify-center">
          <p className="text-red-500 text-center text-sm">{githubData.error}</p>
        </div>
      );
    }
    
    return (
      <div className="h-full flex flex-col justify-between">
        <div className="text-center mb-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">Current Streak</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {githubData.currentStreak} days
          </div>
        </div>
        
        <div className="grid grid-cols-2 text-center">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Longest</div>
            <div className="text-lg font-semibold">{githubData.longestStreak}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-lg font-semibold">{githubData.totalContributions}</div>
          </div>
        </div>
      </div>
    );
  };
  
  // Wide small view (3x2)
  const renderWideSmallView = () => {
    if (!localConfig.username || githubData.loading || githubData.error) {
      return renderSmallView();
    }
    
    const recentDays = githubData.contributionsByDay.slice(-14);
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Current Streak</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {githubData.currentStreak} days
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Longest</div>
              <div className="text-lg font-semibold">{githubData.longestStreak}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              <div className="text-lg font-semibold">{githubData.totalContributions}</div>
            </div>
          </div>
        </div>
        
        {localConfig.showContributionGraph && (
          <div className="mt-auto">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last 14 days</div>
            <div className="flex gap-1 justify-between">
              {recentDays.map((day, index) => 
                renderContributionCell(day.count, day.date, index)
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Tall small view (2x3)
  const renderTallSmallView = () => {
    if (!localConfig.username || githubData.loading || githubData.error) {
      return renderSmallView();
    }
    
    const recentDays = githubData.contributionsByDay.slice(-14);
    
    return (
      <div className="h-full flex flex-col">
        <div className="text-center mb-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">Current Streak</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {githubData.currentStreak} days
          </div>
        </div>
        
        <div className="grid grid-cols-2 text-center mb-3">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Longest</div>
            <div className="text-lg font-semibold">{githubData.longestStreak}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-lg font-semibold">{githubData.totalContributions}</div>
          </div>
        </div>
        
        {localConfig.showContributionGraph && (
          <div className="mt-auto">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last 14 days</div>
            <div className="grid grid-cols-7 gap-1">
              {recentDays.map((day, index) => 
                renderContributionCell(day.count, day.date, index)
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Medium view (3x3)
  const renderMediumView = () => {
    if (!localConfig.username || githubData.loading || githubData.error) {
      return renderSmallView();
    }
    
    const recentDays = githubData.contributionsByDay.slice(-28);
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Current Streak</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {githubData.currentStreak} days
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Longest</div>
              <div className="text-xl font-semibold">{githubData.longestStreak}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              <div className="text-xl font-semibold">{githubData.totalContributions}</div>
            </div>
          </div>
        </div>
        
        {localConfig.showContributionGraph && (
          <div className="mt-auto">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last 28 days</div>
            <div className="grid grid-cols-7 gap-1">
              {recentDays.map((day, index) => 
                renderContributionCell(day.count, day.date, index)
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Wide medium view (4x3)
  const renderWideMediumView = () => {
    if (!localConfig.username || githubData.loading || githubData.error) {
      return renderSmallView();
    }
    
    const daysToShow = Math.min(localConfig.daysToShow || 30, githubData.contributionsByDay.length);
    const recentDays = githubData.contributionsByDay.slice(-daysToShow);
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="mr-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">Current Streak</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {githubData.currentStreak} days
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Longest</div>
                <div className="text-xl font-semibold">{githubData.longestStreak}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                <div className="text-xl font-semibold">{githubData.totalContributions}</div>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            @{githubData.username}
          </div>
        </div>
        
        {localConfig.showContributionGraph && (
          <div className="mt-auto">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Last {daysToShow} days
            </div>
            <div className="grid grid-cols-10 gap-1">
              {recentDays.map((day, index) => 
                renderContributionCell(day.count, day.date, index)
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Tall medium view (3x4)
  const renderTallMediumView = () => {
    if (!localConfig.username || githubData.loading || githubData.error) {
      return renderSmallView();
    }
    
    const daysToShow = Math.min(localConfig.daysToShow || 30, githubData.contributionsByDay.length);
    const recentDays = githubData.contributionsByDay.slice(-daysToShow);
    
    return (
      <div className="h-full flex flex-col">
        <div className="text-center mb-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Current Streak</div>
          <div className="text-4xl font-bold text-green-600 dark:text-green-400">
            {githubData.currentStreak} days
          </div>
        </div>
        
        <div className="grid grid-cols-2 text-center gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Longest Streak</div>
            <div className="text-2xl font-semibold">{githubData.longestStreak}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Contributions</div>
            <div className="text-2xl font-semibold">{githubData.totalContributions}</div>
          </div>
        </div>
        
        <div className="text-sm text-center text-gray-500 dark:text-gray-400 mb-2">
          @{githubData.username}
        </div>
        
        {localConfig.showContributionGraph && (
          <div className="mt-auto">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Last {daysToShow} days
            </div>
            <div className="grid grid-cols-7 gap-1">
              {recentDays.map((day, index) => 
                renderContributionCell(day.count, day.date, index)
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Large view (4x4 or larger)
  const renderLargeView = () => {
    if (!localConfig.username || githubData.loading || githubData.error) {
      return renderSmallView();
    }
    
    const daysToShow = Math.min(localConfig.daysToShow || 60, githubData.contributionsByDay.length);
    const recentDays = githubData.contributionsByDay.slice(-daysToShow);
    
    // Calculate streak data
    const weeklyContributions = Array(Math.ceil(daysToShow / 7)).fill(0);
    recentDays.forEach((day, index) => {
      const weekIndex = Math.floor(index / 7);
      if (weekIndex < weeklyContributions.length) {
        weeklyContributions[weekIndex] += day.count;
      }
    });
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="mr-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">Current Streak</div>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                {githubData.currentStreak} days
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Longest Streak</div>
                <div className="text-2xl font-semibold">{githubData.longestStreak}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Contributions</div>
                <div className="text-2xl font-semibold">{githubData.totalContributions}</div>
              </div>
            </div>
          </div>
          
          <div className="text-lg text-gray-500 dark:text-gray-400">
            @{githubData.username}
          </div>
        </div>
        
        {localConfig.showContributionGraph && (
          <div className="flex-grow">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Contribution History (Last {daysToShow} days)
            </div>
            
            <div className="flex flex-col h-full">
              {/* Weekly breakdown */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                {weeklyContributions.map((count, index) => (
                  <div key={index} className="text-center">
                    <div className={`mx-auto w-full h-16 rounded-md bg-gradient-to-t ${
                      count > 20 ? 'from-green-700 to-green-500' : 
                      count > 10 ? 'from-green-500 to-green-300' : 
                      count > 0 ? 'from-green-300 to-green-100' : 
                      'from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800'
                    }`} style={{ 
                      height: `${Math.min(Math.max(count * 3, 10), 64)}px` 
                    }}></div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">W{index+1}</div>
                  </div>
                ))}
              </div>
              
              {/* Daily contribution cells */}
              <div className="mt-auto">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Daily contributions</div>
                <div className="grid grid-cols-14 gap-1">
                  {recentDays.map((day, index) => 
                    renderContributionCell(day.count, day.date, index)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Save settings
  const saveSettings = () => {
    if (config?.onUpdate) {
      config.onUpdate(localConfig);
    }
    setShowSettings(false);
  };
  
  // Settings modal
  const renderSettings = () => {
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>GitHub Streak Widget Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Title setting */}
            <div className="space-y-2">
              <label htmlFor="widget-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Widget Title
              </label>
              <input
                type="text"
                id="widget-title"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={localConfig.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalConfig({
                  ...localConfig, 
                  title: e.target.value
                })}
                placeholder="Widget Title"
              />
            </div>
            
            {/* GitHub username setting */}
            <div className="space-y-2">
              <label htmlFor="github-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                GitHub Username
              </label>
              <input
                type="text"
                id="github-username"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={localConfig.username || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalConfig({
                  ...localConfig, 
                  username: e.target.value
                })}
                placeholder="e.g., octocat"
              />
            </div>
            
            {/* Show contribution graph toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-graph"
                checked={localConfig.showContributionGraph !== false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalConfig({
                  ...localConfig, 
                  showContributionGraph: e.target.checked
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="show-graph" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Show Contribution Graph
              </label>
            </div>
            
            {/* Days to show setting */}
            <div className="space-y-2">
              <label htmlFor="days-to-show" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Days to Show in Graph
              </label>
              <select
                id="days-to-show"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={localConfig.daysToShow || 30}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLocalConfig({
                  ...localConfig, 
                  daysToShow: parseInt(e.target.value, 10)
                })}
              >
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            {config?.onDelete && (
              <button
                className="px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 rounded-lg text-sm font-medium transition-colors"
                onClick={() => {
                  if (config.onDelete) {
                    config.onDelete();
                  }
                }}
                aria-label="Delete this widget"
              >
                Delete Widget
              </button>
            )}
            <button
              type="button"
              onClick={saveSettings}
              className="ml-2 py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save
            </button>
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

export default GitHubStreakWidget; 