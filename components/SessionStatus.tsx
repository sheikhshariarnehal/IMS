import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface SessionInfo {
  hasStoredSession: boolean;
  sessionEmail?: string;
  sessionRole?: string;
  loginTime?: string;
  sessionAge?: string;
  isExpired?: boolean;
}

export default function SessionStatus() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSessionStatus = async () => {
    try {
      setIsLoading(true);
      const sessionData = await AsyncStorage.getItem('userSession');
      
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const ageMs = now.getTime() - loginTime.getTime();
        const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
        const ageMinutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));
        
        setSessionInfo({
          hasStoredSession: true,
          sessionEmail: session.email,
          sessionRole: session.role,
          loginTime: loginTime.toLocaleString(),
          sessionAge: `${ageHours}h ${ageMinutes}m`,
          isExpired: ageMs > (24 * 60 * 60 * 1000) // 24 hours
        });
      } else {
        setSessionInfo({
          hasStoredSession: false
        });
      }
    } catch (error) {
      console.error('Error checking session status:', error);
      setSessionInfo({
        hasStoredSession: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSessionStatus();
  }, [user]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      margin: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    value: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '400',
    },
    statusGood: {
      color: theme.colors.success,
      fontWeight: 'bold',
    },
    statusBad: {
      color: theme.colors.error,
      fontWeight: 'bold',
    },
    statusWarning: {
      color: theme.colors.warning,
      fontWeight: 'bold',
    },
    refreshButton: {
      backgroundColor: theme.colors.primary,
      padding: 8,
      borderRadius: 4,
      marginTop: 12,
      alignItems: 'center',
    },
    refreshButtonText: {
      color: theme.colors.surface,
      fontSize: 14,
      fontWeight: '500',
    },
    loading: {
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    }
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Session Status</Text>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session Status</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>Current User:</Text>
        <Text style={[styles.value, user ? styles.statusGood : styles.statusBad]}>
          {user ? `${user.email} (${user.role})` : 'Not logged in'}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Stored Session:</Text>
        <Text style={[styles.value, sessionInfo?.hasStoredSession ? styles.statusGood : styles.statusBad]}>
          {sessionInfo?.hasStoredSession ? 'Found' : 'Not found'}
        </Text>
      </View>

      {sessionInfo?.hasStoredSession && (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>Session Email:</Text>
            <Text style={styles.value}>{sessionInfo.sessionEmail}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Session Role:</Text>
            <Text style={styles.value}>{sessionInfo.sessionRole}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Login Time:</Text>
            <Text style={styles.value}>{sessionInfo.loginTime}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Session Age:</Text>
            <Text style={[styles.value, sessionInfo.isExpired ? styles.statusWarning : styles.statusGood]}>
              {sessionInfo.sessionAge} {sessionInfo.isExpired ? '(Expired)' : ''}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Match Status:</Text>
            <Text style={[styles.value, 
              user && sessionInfo.sessionEmail === user.email ? styles.statusGood : styles.statusBad
            ]}>
              {user && sessionInfo.sessionEmail === user.email ? 'Match' : 'Mismatch'}
            </Text>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.refreshButton} onPress={checkSessionStatus}>
        <Text style={styles.refreshButtonText}>Refresh Status</Text>
      </TouchableOpacity>
    </View>
  );
}
