import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import { Check, X, Filter } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import config from '@/config/config';
import { useAuth } from '@/app/auth-context';

interface PractitionerNotification {
  id: string;
  appointment_id?: string;
  section: string;
  time: string;
  title: string;
  message: string;
  type: 'appointment_request' | 'appointment_accepted' | 'appointment_rejected' | 'appointment_cancelled';
  is_read: boolean;
  created_at: string;
  patientName?: string;
  patientAvatar?: string;
  status: string;
  scheduledAt?: string;
}

const NotificationItem: React.FC<{
  item: PractitionerNotification;
  showSectionHeader?: boolean;
  onAccept: (appointmentId: string) => void;
  onReject: (appointmentId: string) => void;
  onMarkRead: (id: string) => void;
}> = ({ item, showSectionHeader, onAccept, onReject, onMarkRead }) => {
  
  const handleAcceptPress = () => {
    if (!item.appointment_id) return;
    if (Platform.OS === 'web') {
      const confirm = window.confirm(`Confirmer le rendez-vous avec ${item.patientName} ?`);
      if (confirm) {
        onAccept(item.appointment_id!);
      }
    } else {
      Alert.alert(
        'Accepter le rendez-vous',
        `Confirmer le rendez-vous avec ${item.patientName} ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Accepter', 
            onPress: () => onAccept(item.appointment_id!)
          }
        ]
      );
    }
  };

  const handleRejectPress = () => {
    if (!item.appointment_id) return;
    if (Platform.OS === 'web') {
      const confirm = window.confirm(`Refuser le rendez-vous avec ${item.patientName} ?`);
      if (confirm) {
        onReject(item.appointment_id!);
      }
    } else {
      Alert.alert(
        'Refuser le rendez-vous',
        `Refuser le rendez-vous avec ${item.patientName} ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Refuser', 
            style: 'destructive',
            onPress: () => onReject(item.appointment_id!)
          }
        ]
      );
    }
  };

  const isPendingRequest = item.type === 'appointment_request' && item.status === 'pending';
  const isAccepted = item.status === 'scheduled';
  const isCancelled = item.status === 'cancelled';

  // Extract time from message for pending requests
  const extractTimeFromMessage = (message: string) => {
    const timeMatch = message.match(/à (\d{2}h\d{2})/);
    return timeMatch ? timeMatch[1] : '';
  };

  const getStatusText = () => {
    if (isPendingRequest) {
      const timeStr = extractTimeFromMessage(item.message);
      return `a demandé un rendez vous à ${timeStr} aujourd'hui`;
    } else if (isAccepted) {
      const timeStr = extractTimeFromMessage(item.message);
      return `a rendez vous à ${timeStr} aujourd'hui`;
    } else if (isCancelled) {
      return item.message;
    }
    return item.message;
  };

  return (
    <View style={styles.notificationContainer}>
      {showSectionHeader && <Text style={styles.sectionHeader}>{item.section}</Text>}
      <TouchableOpacity 
        style={styles.notification}
        onPress={() => !item.is_read && onMarkRead(item.id)}
      >
        <Image 
          source={{ 
            uri: item.patientAvatar || 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/340px-Default_pfp.svg.png' 
          }}
          style={styles.avatar}
        />
        
        <View style={styles.notificationContent}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
        
        {isPendingRequest ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAcceptPress}
            >
              <Text style={styles.acceptText}>Accepter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={handleRejectPress}
            >
              <Text style={styles.rejectText}>Refuser</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusIconContainer}>
            {isAccepted && <Check color="#34C759" size={24} />}
            {isCancelled && <X color="#FF3B30" size={24} />}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function PractitionerNotificationsScreen() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<PractitionerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  const fetchNotifications = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const response = await fetch(`${config.API_URL}/api/notifications/practitioner`, {
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

  const handleAccept = async (appointmentId: string) => {
    try {
      const response = await fetch(`${config.API_URL}/api/appointments/${appointmentId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Refresh notifications to get updated status
        fetchNotifications(false);
        Alert.alert('Succès', 'Rendez-vous accepté avec succès');
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.error || 'Impossible d\'accepter le rendez-vous');
      }
    } catch (error) {
      console.error('Error accepting appointment:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleReject = async (appointmentId: string) => {
    try {
      const response = await fetch(`${config.API_URL}/api/appointments/${appointmentId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Refresh notifications to get updated status
        fetchNotifications(false);
        Alert.alert('Succès', 'Rendez-vous refusé');
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.error || 'Impossible de refuser le rendez-vous');
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  // Filter notifications based on showOnlyPending
  const filteredNotifications = showOnlyPending 
    ? notifications.filter(n => n.type === 'appointment_request' && n.status === 'pending')
    : notifications;

  const displayData = filteredNotifications.map((item, index) => ({
    ...item,
    showSectionHeader: index === 0 || item.section !== filteredNotifications[index - 1]?.section,
  }));

  const pendingCount = notifications.filter(n => n.type === 'appointment_request' && n.status === 'pending').length;

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
      
      <TouchableOpacity 
        style={[styles.filterButton, showOnlyPending && styles.filterButtonActive]}
        onPress={() => setShowOnlyPending(!showOnlyPending)}
      >
        <Filter color={showOnlyPending ? "#fff" : "#666"} size={18} />
        <Text style={[styles.filterText, showOnlyPending && styles.filterTextActive]}>
          Afficher les demandes non répondues
        </Text>
      </TouchableOpacity>

      <FlatList
        data={displayData}
        renderItem={({ item }) => (
          <NotificationItem
            item={item}
            showSectionHeader={item.showSectionHeader}
            onAccept={handleAccept}
            onReject={handleReject}
            onMarkRead={handleMarkRead}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {showOnlyPending ? 'Aucune demande en attente' : 'Aucune notification'}
            </Text>
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    alignSelf: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#5671DA',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontFamily: 'Inter',
  },
  filterTextActive: {
    color: '#fff',
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  notificationContent: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    fontFamily: 'Inter',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#5671DA',
    borderRadius: 20,
  },
  acceptText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  rejectButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#5671DA',
    borderRadius: 20,
  },
  rejectText: {
    color: '#5671DA',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  statusIconContainer: {
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