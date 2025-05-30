import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { Check, X } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';
import config from '@/config/config';
import { useAuth } from '@/app/auth-context';
import { useFocusEffect } from '@react-navigation/native';

interface Notification {
  id: string;
  section: string;
  time: string;
  title: string;
  message: string;
  type: 'appointment_request' | 'appointment_accepted' | 'appointment_rejected' | 'appointment_cancelled';
  appointment_id?: string;
  is_read: boolean;
  created_at: string;
  cancellable?: boolean;
}

const NotificationItem: React.FC<{ 
  item: Notification; 
  showSectionHeader?: boolean;
  onCancel?: (id: string) => void;
  onMarkRead?: (id: string) => void;
}> = ({ item, showSectionHeader, onCancel, onMarkRead }) => {
  
  const handleCancelPress = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?');
      if (confirm) {
        onCancel?.(item.id);
      }
    } else {
      Alert.alert(  
        'Annuler le rendez-vous',
        'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
        [
          { text: 'Non', style: 'cancel' },
          { 
            text: 'Oui, annuler', 
            style: 'destructive',
            onPress: () => onCancel?.(item.id)
          }
        ]
      );
    }
  };

  // Parse message to extract key information
  const parseMessage = (message: string, type: string) => {
    if (type === 'appointment_request') {
      // "Votre demande de rendez-vous avec Dr. Rozières a été envoyée"
      const doctorMatch = message.match(/Dr\.\s+(\w+)/);
      const doctorName = doctorMatch ? `Le Dr. ${doctorMatch[1]}` : 'Le docteur';
      return {
        text: `${doctorName} a reçu votre demande de rendez-vous pour 10h`,
        showCancel: true
      };
    } else if (type === 'appointment_accepted') {
      // "Dr. Lanson a accepté votre rendez-vous du 30/05/2025 à 10:00"
      const doctorMatch = message.match(/Dr\.\s+(\w+)/);
      const timeMatch = message.match(/à (\d{2}:\d{2})/);
      const doctorName = doctorMatch ? `M. ${doctorMatch[1]}` : 'M. Lanson';
      const time = timeMatch ? timeMatch[1].replace(':', 'h') : '10h';
      return {
        text: `${doctorName} a accepté votre demande de rendez-vous à ${time} hier`,
        showCancel: false,
        showCheck: true
      };
    } else if (type === 'appointment_cancelled') {
      return {
        text: message,
        showCancel: false
      };
    }
    return {
      text: message,
      showCancel: false
    };
  };

  const parsedMessage = parseMessage(item.message, item.type);

  return (
    <View style={styles.notificationContainer}>
      {showSectionHeader && <Text style={styles.sectionHeader}>{item.section}</Text>}
      <TouchableOpacity 
        style={styles.notification}
        onPress={() => !item.is_read && onMarkRead?.(item.id)}
      >
        <View style={styles.notificationContent}>
          <Text style={styles.time}>{item.time}</Text>
          <Text style={styles.message}>{parsedMessage.text}</Text>
        </View>
        
        {parsedMessage.showCancel && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancelPress}
          >
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        )}
        
        {parsedMessage.showCheck && (
          <View style={styles.checkIconContainer}>
            <Check color="#34C759" size={20} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const response = await fetch(`${config.API_URL}/api/notifications/patient`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        console.error('Failed to fetch notifications:', response.status);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const handleCancel = async (notificationId: string) => {
    try {
      const response = await fetch(`${config.API_URL}/api/notifications/${notificationId}/cancel-appointment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Refresh notifications to get updated status
        fetchNotifications(false);
        if (Platform.OS === 'web') {
          window.alert('Rendez-vous annulé avec succès');
        } else {
          Alert.alert('Succès', 'Rendez-vous annulé avec succès');
        }
      } else {
        const errorData = await response.json();
        if (Platform.OS === 'web') {
          window.alert(errorData.error || 'Impossible d\'annuler le rendez-vous');
        } else {
          Alert.alert('Erreur', errorData.error || 'Impossible d\'annuler le rendez-vous');
        }
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      if (Platform.OS === 'web') {
        window.alert('Une erreur est survenue lors de l\'annulation');
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de l\'annulation');
      }
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    try {
      const response = await fetch(`${config.API_URL}/api/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Update notification locally
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Mark all notifications as read locally
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  const displayData = notifications.map((item, index) => ({
    ...item,
    showSectionHeader: index === 0 || item.section !== notifications[index - 1]?.section,
  }));

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading && !refreshing) {
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
      
      {unreadCount > 0 && (
        <TouchableOpacity 
          style={styles.markAllReadButton}
          onPress={handleMarkAllAsRead}
        >
          <Text style={styles.markAllReadText}>
            Tout marquer comme lu
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={displayData}
        renderItem={({ item }) => (
          <NotificationItem 
            item={item} 
            showSectionHeader={item.showSectionHeader}
            onCancel={handleCancel}
            onMarkRead={handleMarkRead}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune notification</Text>
          </View>
        }
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
  checkIconContainer: {
    marginLeft: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter',
  },
});