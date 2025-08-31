/**
 * Simple Performance Monitor
 * Console-only monitoring to avoid theme provider issues
 */

class SimplePerformanceMonitor {
  private navigationTimes: Map<string, number> = new Map();
  private enabled: boolean = false; // DISABLED - To prevent any interference with login
  
  startNavigation(route: string) {
    if (!this.enabled) return;
    this.navigationTimes.set(route, Date.now());
  }
  
  endNavigation(route: string) {
    if (!this.enabled) return;
    
    const startTime = this.navigationTimes.get(route);
    if (startTime) {
      const duration = Date.now() - startTime;
      
      // Performance feedback disabled to clean up terminal output
      // Navigation timing still tracked internally but not logged
      
      this.navigationTimes.delete(route);
    }
  }
  
  enable() {
    this.enabled = true;
    // Console logs disabled to clean up terminal output
  }
  
  disable() {
    this.enabled = false;
    // Console logs disabled to clean up terminal output
  }
}

export const simplePerformanceMonitor = new SimplePerformanceMonitor();

// Startup message disabled to clean up terminal output

// Helper to wrap navigation calls with performance monitoring (DISABLED)
export const withSimplePerformanceMonitoring = (route: string, navigationFn: () => void) => {
  // Just execute the navigation function without monitoring to prevent login issues
  navigationFn();
};