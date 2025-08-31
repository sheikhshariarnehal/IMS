/**
 * Performance Configuration
 * Control performance monitoring settings
 */

export const performanceConfig = {
  // Enable/disable performance monitoring
  enabled: true, // Re-enabled to show performance improvements
  
  // Show visual performance monitor in app
  showVisualMonitor: false,
  
  // Log to console
  logToConsole: true,
  
  // Threshold for slow navigation (in milliseconds)
  slowNavigationThreshold: 100,
  
  // Maximum number of logs to keep
  maxLogs: 10,
};

// Helper to check if performance monitoring is enabled
export const isPerformanceMonitoringEnabled = () => {
  return performanceConfig.enabled && performanceConfig.logToConsole;
};

// Helper to check if visual monitor should be shown
export const shouldShowVisualMonitor = () => {
  return performanceConfig.enabled && performanceConfig.showVisualMonitor;
};