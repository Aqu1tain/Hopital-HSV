import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { router, useRouter, usePathname } from 'expo-router'; // Add usePathname
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../app/auth-context';
import { useUserData } from '../hooks/useUserData';
import config from '../config/config'; // Use your config instead of process.env

interface AppHeaderProps {
  showNotificationBadge?: boolean;
}

export default function AppHeader({ showNotificationBadge = true }: AppHeaderProps) {
  const { token } = useAuth();
  const { user, isLoading } = useUserData();
  const router = useRouter();
  const pathname = usePathname(); // Add this to detect current route
  const [notificationCount, setNotificationCount] = useState(0);

  // Check if we're on notifications page
  const isOnNotificationsPage = pathname === '/notifications' || 
                                pathname === '/(tabs)/notifications' || 
                                pathname === '/(practitioner-tabs)/notifications';

  useEffect(() => {
    if (showNotificationBadge && user) {
      console.log('Fetching notification count...');
      fetchNotificationCount();
      
      // Refresh notification count every 30 seconds when not on notifications page
      if (!isOnNotificationsPage) {
        const interval = setInterval(fetchNotificationCount, 10000);
        return () => clearInterval(interval);
      }
    }
  }, [showNotificationBadge, user, isOnNotificationsPage]);

  // Reset notification count when on notifications page
  useEffect(() => {
    if (isOnNotificationsPage && notificationCount > 0) {
      setNotificationCount(0);
    }
  }, [isOnNotificationsPage]);

  const fetchNotificationCount = async () => {
    try {
      if (!token) return;

      const response = await fetch(`${config.API_URL}/api/notifications/count`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Response:', response);
  
      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const handleBellPress = () => {
    const role = user?.role || 'patient';
    if (role === 'practitioner') {
      router.push('/(practitioner-tabs)/notifications');
    } else {
      router.push('/(tabs)/notifications');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerGreeting}>Bonjour</Text>
          <Text style={styles.headerName}>
            <Text style={{ fontWeight: 'bold', fontFamily: 'Inter-Bold' }}>Chargement...</Text>
          </Text>
        </View>
        <View style={styles.rightSection}>
          <TouchableOpacity onPress={handleBellPress} style={styles.bellContainer}>
            {isOnNotificationsPage ? (
              <Bell fill="#222" color="#222" size={22} style={styles.bellIcon} />
            ) : (
              <Bell color="#222" size={22} style={styles.bellIcon} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.headerTextContainer}>
        {user ? (
          <View>
            <Text style={styles.headerGreeting}>Bonjour</Text>
            <Text style={styles.headerName}>
              <Text style={{ fontWeight: 'bold', fontFamily: 'Inter-Bold' }}>
                {user.first_name || user.email.split('@')[0]}{' '}
                {user.last_name ? user.last_name.toUpperCase() : ''}
              </Text>
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.headerGreeting}>Bonjour</Text>
            <Text style={styles.headerName}>
              <Text style={{ fontWeight: 'bold', fontFamily: 'Inter-Bold' }}>Invité</Text>
            </Text>
          </View>
        )}
      </View>
      <View style={styles.rightSection}>
        {!user ? (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.loginText}>Se connecter</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={handleBellPress} style={styles.bellContainer}>
          {isOnNotificationsPage ? (
            <Bell fill="#222" color="#222" size={22} style={styles.bellIcon} />
          ) : (
            <Bell color="#222" size={22} style={styles.bellIcon} />
          )}
          {showNotificationBadge && notificationCount > 0 && user && !isOnNotificationsPage ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notificationCount > 99 ? '99+' : notificationCount.toString()}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 26, // for safe area
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTextContainer: {
    flexDirection: 'column',
  },
  headerGreeting: {
    fontSize: 16,
    color: '#444',
    fontFamily: 'Inter',
  },
  headerName: {
    fontSize: 18,
    color: '#222',
    marginTop: 2,
    fontFamily: 'Inter-Bold',
    fontWeight: 'bold',
  },
  bellContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButton: {
    padding: 8,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  loginText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  bellIcon: {
    marginLeft: 16,
  },
});