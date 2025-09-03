import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FormService } from '@/lib/services/formService';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function LocationDebug() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`🔍 LocationDebug: ${message}`);
  };

  const testLocationFetch = async () => {
    setLoading(true);
    setError(null);
    addLog('Starting location fetch test...');
    
    try {
      addLog(`User: ${user?.name} (${user?.role})`);
      addLog(`User ID: ${user?.id}`);
      
      // Test getActiveLocations
      addLog('Testing FormService.getActiveLocations()...');
      const result = await FormService.getActiveLocations();
      addLog(`Result: ${JSON.stringify(result)}`);
      
      if (result.success && result.data) {
        setLocations(result.data);
        addLog(`✅ Success: Found ${result.data.length} locations`);
      } else {
        setError(result.error || 'Unknown error');
        addLog(`❌ Error: ${result.error}`);
        
        // Try fallback
        addLog('Trying fallback getLocations()...');
        const fallbackResult = await FormService.getLocations();
        addLog(`Fallback result: ${JSON.stringify(fallbackResult)}`);
        
        if (fallbackResult && fallbackResult.length > 0) {
          const activeLocations = fallbackResult.filter(loc => loc.status === 'active');
          setLocations(activeLocations);
          addLog(`✅ Fallback success: Found ${activeLocations.length} active locations`);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      addLog(`❌ Exception: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testLocationFetch();
  }, []);

  const styles = StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
      marginBottom: 16,
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    buttonText: {
      color: '#FFFFFF',
      textAlign: 'center',
      fontWeight: '600',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    locationItem: {
      backgroundColor: theme.colors.backgroundSecondary,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    locationName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    locationDetails: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginTop: 4,
    },
    error: {
      color: theme.colors.status.error,
      fontSize: 14,
      marginBottom: 16,
    },
    logContainer: {
      backgroundColor: theme.colors.backgroundSecondary,
      padding: 12,
      borderRadius: 8,
      maxHeight: 200,
    },
    logText: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      fontFamily: 'monospace',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Location Debug Tool</Text>
      
      <TouchableOpacity style={styles.button} onPress={testLocationFetch} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Location Fetch'}
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>Error: {error}</Text>}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Locations ({locations.length})</Text>
        {locations.map((location, index) => (
          <View key={location.id || index} style={styles.locationItem}>
            <Text style={styles.locationName}>{location.name}</Text>
            <Text style={styles.locationDetails}>
              ID: {location.id} | Type: {location.type} | Status: {location.status}
            </Text>
            {location.address && (
              <Text style={styles.locationDetails}>Address: {location.address}</Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Logs</Text>
        <ScrollView style={styles.logContainer}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}
