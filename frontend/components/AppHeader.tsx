import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { router, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../app/auth-context';
import { useUserData } from '../hooks/useUserData';

interface AppHeaderProps {
  showNotificationBadge?: boolean;
}

export default function AppHeader({ showNotificationBadge = true }: AppHeaderProps) {
  const { logout } = useAuth();
  const { user, isLoading } = useUserData();
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (showNotificationBadge && user) {
      fetchNotificationCount();
    }
  }, [showNotificationBadge, user]);

  const fetchNotificationCount = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      const role = userData ? JSON.parse(userData).role : 'patient';

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/notifications/count`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

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
            <Bell color="#222" size={22} style={styles.bellIcon} />
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
          <Bell color="#222" size={22} style={styles.bellIcon} />
          {showNotificationBadge && notificationCount > 0 && user ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount}</Text>
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