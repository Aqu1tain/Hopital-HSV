import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppHeaderProps {
  showNotificationBadge?: boolean;
}

export default function AppHeader({ showNotificationBadge = true }: AppHeaderProps) {
  const [userInfo, setUserInfo] = useState({ firstName: '', lastName: '', role: '' });
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    loadUserInfo();
    if (showNotificationBadge) {
      fetchNotificationCount();
    }
  }, [showNotificationBadge]);

  const loadUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserInfo(parsed);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      const role = userData ? JSON.parse(userData).role : 'patient';
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/notifications/count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
    if (userInfo.role === 'practitioner') {
      router.push('/(practitioner-tabs)/notifications');
    } else {
      router.push('/(tabs)/notifications');
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerGreeting}>Bonjour,</Text>
        <Text style={styles.headerName}>
          Valentin Lamouche
        </Text>
      </View>
      <TouchableOpacity onPress={handleBellPress} style={styles.bellContainer}>
        <Bell color="#222" size={22} />
        {showNotificationBadge && notificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notificationCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
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
});