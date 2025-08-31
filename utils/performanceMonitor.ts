/**
 * Performance Monitor for Navigation
 * Tracks and optimizes navigation performance
 */

import { performanceConfig, isPerformanceMonitoringEnabled } from './performanceConfig';

class NavigationPerformanceMonitor {
  private navigationTimes: Map<string, number> = new Map();
  
  startNavigation(route: string) {
    this.navigationTimes.set(route, Date.now());
  }
  
  endNavigation(route: string) {
    if (!isPerformanceMonitoringEnabled()) return;
    
    const startTime = this.navigationTimes.get(route);
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`Navigation to ${route} took ${duration}ms`);
      this.navigationTimes.delete(route);
      
      // Log slow navigations based on configured threshold
      if (duration > performanceConfig.slowNavigationThreshold) {
        console.warn(`Slow navigation detected: ${route} took ${duration}ms`);
      }
    }
  }
  
  // Optimize navigation by preloading
  preloadRoute(route: string) {
    if (isPerformanceMonitoringEnabled()) {
      console.log(`Preloading route: ${route}`);
    }
    // In a real app, this would preload the route component
  }
}

export const performanceMonitor = new NavigationPerformanceMonitor();

// Helper to wrap navigation calls with performance monitoring
export const withPerformanceMonitoring = (route: string, navigationFn: () => void) => {
  if (!isPerformanceMonitoringEnabled()) {
    navigationFn();
    return;
  }
  
  performanceMonitor.startNavigation(route);
  navigationFn();
  // End monitoring after a short delay to account for navigation completion
  setTimeout(() => performanceMonitor.endNavigation(route), 50);
};