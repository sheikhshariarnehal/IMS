import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { clearMemoryCache } from '@/utils/performanceUtils';

interface PerformanceContextType {
  clearCache: () => void;
  optimizeMemory: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const clearCache = () => {
    clearMemoryCache();
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  };

  const optimizeMemory = () => {
    clearCache();
    // Additional memory optimization
    console.log('Memory optimized');
  };

  // Auto cleanup every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      optimizeMemory();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const value = {
    clearCache,
    optimizeMemory,
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}