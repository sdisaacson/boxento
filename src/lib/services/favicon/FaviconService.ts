/**
 * Service for managing dynamic favicon updates
 * 
 * Provides methods to update the favicon based on application state,
 * particularly for the Pomodoro timer functionality.
 */
class FaviconService {
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private link: HTMLLinkElement | null = null;
  private defaultFaviconPath: string = '/favicon.ico';
  private initialized: boolean = false;
  private canvasSupported: boolean = false;
  private themeObserver: MutationObserver | null = null;
  private currentWeatherTemp: number | null = null;

  constructor() {
    // Defer initialization until the service is actually used
    // This prevents issues if the service is imported during SSR
    
    // Set up theme observer if we're in the browser
    if (typeof window !== 'undefined') {
      this.setupThemeObserver();
    }
  }

  /**
   * Initialize the canvas and favicon link elements
   * Called on first use to avoid SSR issues
   */
  private initialize() {
    if (this.initialized) return;
    
    if (typeof window === 'undefined') return;
    
    // Check for canvas support
    this.canvasSupported = (
      typeof document !== 'undefined' && 
      'createElement' in document && 
      'getContext' in document.createElement('canvas')
    );
    
    if (!this.canvasSupported) {
      // Just set up the favicon link without canvas
      this.setupFaviconLink();
      this.initialized = true;
      return;
    }
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = 32;
    this.canvas.height = 32;
    
    const context = this.canvas.getContext('2d');
    if (!context) {
      console.error('Canvas 2D context not available');
      this.canvasSupported = false;
      this.setupFaviconLink();
      this.initialized = true;
      return;
    }
    
    this.ctx = context;
    this.setupFaviconLink();
    this.initialized = true;
  }

  /**
   * Set up the theme observer to watch for theme changes
   */
  private setupThemeObserver() {
    if (typeof document === 'undefined') return;

    // Create a new observer instance
    this.themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          // Theme has changed, update the favicon
          this.updateWithCurrentTime();
        }
      });
    });

    // Start observing the document element for class changes
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  /**
   * Draw a squircle shape on the canvas
   * @param x - Center X coordinate
   * @param y - Center Y coordinate
   * @param size - Size of the squircle
   * @param color - Fill color
   */
  private drawSquircle(x: number, y: number, size: number, color: string) {
    if (!this.ctx) return;

    const radius = size / 2;
    const smoothing = 0.45; // Increased smoothing for more rounded corners (0 = square, 0.5 = very round)

    this.ctx.fillStyle = color;
    this.ctx.beginPath();

    // Top edge
    this.ctx.moveTo(x - radius + radius * smoothing, y - radius);
    this.ctx.lineTo(x + radius - radius * smoothing, y - radius);
    
    // Top right corner
    this.ctx.quadraticCurveTo(
      x + radius, y - radius,
      x + radius, y - radius + radius * smoothing
    );

    // Right edge
    this.ctx.lineTo(x + radius, y + radius - radius * smoothing);
    
    // Bottom right corner
    this.ctx.quadraticCurveTo(
      x + radius, y + radius,
      x + radius - radius * smoothing, y + radius
    );

    // Bottom edge
    this.ctx.lineTo(x - radius + radius * smoothing, y + radius);
    
    // Bottom left corner
    this.ctx.quadraticCurveTo(
      x - radius, y + radius,
      x - radius, y + radius - radius * smoothing
    );

    // Left edge
    this.ctx.lineTo(x - radius, y - radius + radius * smoothing);
    
    // Top left corner
    this.ctx.quadraticCurveTo(
      x - radius, y - radius,
      x - radius + radius * smoothing, y - radius
    );

    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Get the current theme (light or dark)
   * @returns 'light' | 'dark'
   */
  private getCurrentTheme(): 'light' | 'dark' {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  /**
   * Set up the favicon link element
   */
  private setupFaviconLink() {
    // Find existing favicon link
    const existingLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    
    if (existingLink) {
      // Store the default favicon path if we find an existing link
      this.defaultFaviconPath = existingLink.href;
      this.link = existingLink;
    } else {
      // Create new favicon link if none exists
      this.link = document.createElement('link');
      this.link.rel = 'icon';
      this.link.type = 'image/x-icon';
      document.head.appendChild(this.link);
    }
  }

  /**
   * Update favicon for Pomodoro timer
   * 
   * @param timeLeft - Time remaining in seconds
   * @param mode - Current timer mode (work, break, longBreak)
   * @param isActive - Whether the timer is currently running
   */
  updatePomodoroFavicon(timeLeft: number, mode: string, isActive: boolean) {
    this.initialize();
    
    // If canvas is not supported, just use the default favicon
    if (!this.canvasSupported || !this.initialized || !this.ctx || !this.link || !this.canvas) {
      // Just reset to default favicon for browsers without canvas support
      this.resetToDefault();
      return;
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, 32, 32);

    // Set background color based on mode
    let bgColor;
    switch (mode) {
      case 'work':
        bgColor = '#ef4444'; // text-red-500
        break;
      case 'break':
        bgColor = '#22c55e'; // text-green-500
        break;
      case 'longBreak':
        bgColor = '#3b82f6'; // text-blue-500
        break;
      default:
        bgColor = '#ef4444';
    }
    
    // Draw squircle background
    this.drawSquircle(16, 16, 30, bgColor);

    // Format time for display
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    // Draw time text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Apply a small vertical offset for better visual centering
    const verticalOffset = 1;
    
    // For minutes only, display just the number
    if (seconds === 0 || minutes >= 10) {
      this.ctx.font = 'bold 14px Arial';
      this.ctx.fillText(minutes.toString(), 16, 16 + verticalOffset);
    } else {
      // For mixed time, show MM:SS format
      this.ctx.font = 'bold 11px Arial';
      this.ctx.fillText(
        `${minutes}:${seconds.toString().padStart(2, '0')}`,
        16, 
        16 + verticalOffset
      );
    }

    // Draw pause indicator if timer is paused
    if (!isActive && timeLeft > 0) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.fillRect(11, 10, 3, 12);
      this.ctx.fillRect(18, 10, 3, 12);
    }

    // Update the favicon - use try/catch to handle exceptions in some browsers
    try {
      this.link.href = this.canvas.toDataURL('image/x-icon');
    } catch (e) {
      console.error('Error updating favicon:', e);
      this.resetToDefault();
    }
  }

  /**
   * Update the current weather temperature
   * Called by the weather widget when temperature changes
   */
  updateWeatherInfo(temperature: number) {
    this.currentWeatherTemp = temperature;
    
    // Initialize theme observer if it's not already set up
    if (!this.themeObserver) {
      this.setupThemeObserver();
    }
    
    this.updateWithCurrentTime(); // Refresh favicon
  }

  /**
   * Reset favicon to the default
   */
  resetToDefault() {
    if (!this.link) {
      this.initialize();
    }
    
    if (this.link) {
      this.link.href = this.defaultFaviconPath;
    }
  }

  /**
   * Clear weather information
   * Called when weather widget is removed
   */
  clearWeatherInfo() {
    this.currentWeatherTemp = null;
    this.updateWithCurrentTime(); // Refresh favicon
  }

  /**
   * Update favicon with current date or weather
   * Used when no widgets need to display in the favicon
   */
  updateWithCurrentTime() {
    this.initialize();
    
    // If canvas is not supported, just use the default favicon
    if (!this.canvasSupported || !this.initialized || !this.ctx || !this.link || !this.canvas) {
      // Just reset to default favicon for browsers without canvas support
      this.resetToDefault();
      return;
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, 32, 32);

    // Get theme-based colors
    const isDarkTheme = this.getCurrentTheme() === 'dark';
    const bgColor = isDarkTheme ? '#1e293b' : '#ffffff'; // dark: slate-800, light: white
    const textColor = isDarkTheme ? '#ffffff' : '#000000'; // dark: white, light: black
    
    // Draw squircle background
    this.drawSquircle(16, 16, 30, bgColor);
    
    // Draw text
    this.ctx.fillStyle = textColor;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (this.currentWeatherTemp !== null) {
      // Show weather temperature
      const temp = Math.round(this.currentWeatherTemp); // Round to nearest integer
      const text = `${temp}°`;
      
      // Use larger font since we're not showing the unit letter
      this.ctx.font = 'bold 14px Arial';
      
      // Apply a small vertical offset for better visual centering
      const verticalOffset = 1;
      this.ctx.fillText(text, 16, 16 + verticalOffset);
    } else {
      // Show current date
      const now = new Date();
      const date = now.getDate();
      
      this.ctx.font = 'bold 16px Arial';
      const verticalOffset = 1;
      this.ctx.fillText(date.toString(), 16, 16 + verticalOffset);
    }
    
    // Update the favicon - use try/catch to handle exceptions in some browsers
    try {
      this.link.href = this.canvas.toDataURL('image/x-icon');
    } catch (e) {
      console.error('Error updating favicon:', e);
      this.resetToDefault();
    }
  }
}

// Export singleton instance
export const faviconService = new FaviconService(); 