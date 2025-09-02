import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// Location interface
export interface Location {
  id: number;
  name: string;
  type: 'warehouse' | 'showroom';
  address?: string;
  status: 'active' | 'inactive';
}

// Location context interface
interface LocationContextType {
  locations: Location[];
  warehouses: Location[];
  showrooms: Location[];
  isLoading: boolean;
  getLocationById: (id: number) => Location | undefined;
  getLocationsByType: (type: 'warehouse' | 'showroom') => Location[];
  isWarehouse: (locationId: number) => boolean;
  isShowroom: (locationId: number) => boolean;
  refreshLocations: () => Promise<void>;
}

// Create context
const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Location provider component
interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load locations from database
  const loadLocations = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, type, address, status')
        .eq('status', 'active')
        .order('type, name');

      if (error) {
        console.error('Failed to load locations:', error);
        return;
      }

      console.log('🏢 Loaded locations:', data);
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load locations on mount
  useEffect(() => {
    loadLocations();
  }, []);

  // Get warehouses
  const warehouses = locations.filter(location => location.type === 'warehouse');
  
  // Get showrooms
  const showrooms = locations.filter(location => location.type === 'showroom');

  // Get location by ID
  const getLocationById = (id: number): Location | undefined => {
    return locations.find(location => location.id === id);
  };

  // Get locations by type
  const getLocationsByType = (type: 'warehouse' | 'showroom'): Location[] => {
    return locations.filter(location => location.type === type);
  };

  // Check if location is warehouse
  const isWarehouse = (locationId: number): boolean => {
    const location = getLocationById(locationId);
    console.log(`🏭 isWarehouse check for ${locationId}:`, { location, type: location?.type, result: location?.type === 'warehouse' });
    return location?.type === 'warehouse' || false;
  };

  // Check if location is showroom
  const isShowroom = (locationId: number): boolean => {
    const location = getLocationById(locationId);
    console.log(`🏪 isShowroom check for ${locationId}:`, { location, type: location?.type, result: location?.type === 'showroom' });
    return location?.type === 'showroom' || false;
  };

  // Refresh locations
  const refreshLocations = async () => {
    await loadLocations();
  };

  const value: LocationContextType = {
    locations,
    warehouses,
    showrooms,
    isLoading,
    getLocationById,
    getLocationsByType,
    isWarehouse,
    isShowroom,
    refreshLocations,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

// Custom hook to use location context
export function useLocations() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocations must be used within a LocationProvider');
  }
  return context;
}
