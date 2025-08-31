import { useEffect, useState } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  // Add a state variable to track if the framework is ready
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Mark the framework as ready
    setIsReady(true);
    
    // Call the global frameworkReady function if it exists
    if (window.frameworkReady) {
      window.frameworkReady();
    }
  }, []);
  
  // Return the ready state so it can be used if needed
  return isReady;
}