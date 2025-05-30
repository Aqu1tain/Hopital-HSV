import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import { Check, X, Filter } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';
import config from '@/config/config';
import { useAuth } from '@/app/auth-context';

interface AppointmentRequest {
  id: string;
  patientName: string;
  patientAvatar?: string;
  time: string;
  date: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  section: string;
}

const AppointmentRequestItem: React.FC<{
  item: AppointmentRequest;
  showSectionHeader?: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}> = ({ item, showSectionHeader, onAccept, onReject }) => {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'accepted':
        return <View style={styles.statusIcon}><Check color="#34C759" size={20} /></View>;
      case 'rejected':
      case 'cancelled':
        return <View style={styles.statusIcon}><X color="#FF3B30" size={20} /></View>;
      default:
        return null;
    }
  };

  return (
    <View style={styles.requestContainer}>
      {showSectionHeader && <Text style={styles.sectionHeader}>{item.section}</Text>}
      <View style={styles.requestItem}>
        <Image 
          source={{ uri: item.patientAvatar || 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/340px-Default_pfp.svg.png' }}
          style={styles.avatar}
        />
        <View style={styles.requestContent}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <Text style={styles.requestText}>
            {item.status === 'pending' && `a demandé un rendez vous à ${item.time} ${item.date}`}
            {item.status === 'accepted' && `a rendez vous à ${item.time} ${item.date}`}
            {item.status === 'rejected' && `avait rendez-vous ${item.date} à ${item.time}`}
            {item.status === 'cancelled' && `a annulé son rendez vous prévu ${item.date} à ${item.time}`}
          </Text>
        </View>
        {item.status === 'pending' ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => onAccept(item.id)}
            >
              <Text style={styles.acceptText}>Accepter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => onReject(item.id)}
            >
              <Text style={styles.rejectText}>Refuser</Text>
            </TouchableOpacity>
          </View>
        ) : (
          getStatusIcon()
        )}
      </View>
    </View>
  );
};

export default function PractitionerNotificationsScreen() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    fetchAppointmentRequests();
  }, []);

  const fetchAppointmentRequests = async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/notifications/practitioner`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error fetching appointment requests:', error);
    } finally {
      setLoading(false);
    }
  };

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
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'accepted' } : apt
        ));
      }
    } catch (error) {
      console.error('Error accepting appointment:', error);
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
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'rejected' } : apt
        ));
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
    }
  };

  const displayData = appointments.map((item, index) => ({
    ...item,
    showSectionHeader: index === 0 || item.section !== appointments[index - 1]?.section,
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
        style={styles.filterButton}
        onPress={() => setShowFilter(!showFilter)}
      >
        <Filter color="#666" size={18} />
        <Text style={styles.filterText}>Afficher les demandes non répondues</Text>
      </TouchableOpacity>
      <FlatList
        data={displayData}
        renderItem={({ item }) => (
          <AppointmentRequestItem
            item={item}
            showSectionHeader={item.showSectionHeader}
            onAccept={handleAccept}
            onReject={handleReject}
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
  filterText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontFamily: 'Inter',
  },
  listContainer: {
    paddingBottom: 20,
  },
  requestContainer: {
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
  requestItem: {
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
  requestContent: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  requestText: {
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
  statusIcon: {
    marginLeft: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});