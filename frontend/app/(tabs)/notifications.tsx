import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Check, X } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Notification {
  id: string;
  section: string;
  time: string;
  messageParts: { text: string; bold: boolean }[];
  cancellable?: boolean;
  read?: boolean;
}

const NotificationItem: React.FC<{ 
  item: Notification; 
  showSectionHeader?: boolean;
  onCancel?: (id: string) => void;
}> = ({ item, showSectionHeader, onCancel }) => (
  <View style={styles.notificationContainer}>
    {showSectionHeader && <Text style={styles.sectionHeader}>{item.section}</Text>}
    <View style={styles.notification}>
      <View style={styles.notificationContent}>
        <Text style={styles.time}>{item.time}</Text>
        <Text style={styles.message}>
          {item.messageParts.map((part, index) => (
            <Text key={index} style={part.bold ? styles.boldText : null}>
              {part.text}
            </Text>
          ))}
        </Text>
      </View>
      {item.cancellable && (
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => onCancel?.(item.id)}
        >
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      )}
      {item.read && (
        <View style={styles.readIconContainer}>
          <Check color="#34C759" size={20} />
        </View>
      )}
    </View>
  </View>
);

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/notifications/patient`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (notificationId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/notifications/${notificationId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Remove the notification from the list
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const displayData = notifications.map((item, index) => ({
    ...item,
    showSectionHeader: index === 0 || item.section !== notifications[index - 1]?.section,
  }));

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader showNotificationBadge={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5671DA" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader showNotificationBadge={false} />
      <TouchableOpacity 
        style={styles.markAllReadButton}
        onPress={handleMarkAllAsRead}
      >
        <Text style={styles.markAllReadText}>Tout marquer comme lu</Text>
      </TouchableOpacity>
      <FlatList
        data={displayData}
        renderItem={({ item }) => (
          <NotificationItem 
            item={item} 
            showSectionHeader={item.showSectionHeader}
            onCancel={handleCancel}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markAllReadButton: {
    margin: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    alignItems: 'center',
  },
  markAllReadText: {
    fontSize: 15,
    color: '#666',
    fontFamily: 'Inter',
  },
  listContainer: {
    paddingBottom: 20,
  },
  notificationContainer: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 12,
    fontFamily: 'Inter-Bold',
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  notificationContent: {
    flex: 1,
  },
  time: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  message: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  boldText: {
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#5671DA',
    marginLeft: 12,
  },
  cancelText: {
    color: '#5671DA',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  readIconContainer: {
    marginLeft: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});