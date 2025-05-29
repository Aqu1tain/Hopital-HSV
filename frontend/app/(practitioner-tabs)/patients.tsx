import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { Phone, User } from 'lucide-react-native';
import { useAuth } from '../auth-context';
import config from '../../config/config';
import AppHeader from '@/components/AppHeader';

// Theme for consistent styling (same as planning.tsx)
const theme = {
  colors: {
    primary: '#2E4FD1',
    accent: '#E35050',
    background: '#FFFFFF',
    card: '#FAFAFA',
    border: '#EFEFF6',
    text: '#222222',
    muted: '#888888',
    white: '#FFFFFF',
    green: '#4CAF50',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  fontSizes: {
    small: 14,
    medium: 16,
    large: 18,
    xlarge: 20,
  },
  borderRadius: {
    small: 8,
    medium: 12,
  },
};

// Patient Avatar component
const PatientAvatar = ({ profileUrl }: { profileUrl?: string }) => (
  <View style={styles.avatarCircle}>
    {profileUrl && profileUrl !== 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/340px-Default_pfp.svg.png' ? (
      <Image
        source={{ uri: profileUrl }}
        style={styles.avatarImg}
      />
    ) : (
      <User size={24} color={theme.colors.muted} />
    )}
  </View>
);

interface User {
  first_name: string;
  last_name: string;
  profile_url?: string;
  phone?: string;
}

interface Patient {
  user_id: string;
  users: User;
}

interface Practitioner {
  user_id: string;
  users: User;
  title?: string;
  specialty?: string;
  city?: string;
  street_address?: string;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  notes?: string;
  patient: Patient;
  practitioner: Practitioner;
}

interface PatientContact {
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  profile_url?: string;
  appointment_time: string;
  appointment_date: string;
  status?: string;
}

interface GroupedPatients {
  [date: string]: PatientContact[];
}

export default function PatientsScreen() {
  const { token, user } = useAuth();
  const [upcomingPatients, setUpcomingPatients] = useState<GroupedPatients>({});
  const [pastPatients, setPastPatients] = useState<GroupedPatients>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Function to make a phone call
  const makePhoneCall = (phoneNumber: string) => {
    if (!phoneNumber) {
      Alert.alert('Erreur', 'Numéro de téléphone non disponible');
      return;
    }
    
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Erreur', 'Impossible de passer un appel depuis cet appareil');
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => {
        console.error('Error making phone call:', err);
        Alert.alert('Erreur', 'Impossible de passer l\'appel');
      });
  };

  // Group patients by date
  const groupPatientsByDate = (appointments: Appointment[]): GroupedPatients => {
    const grouped: GroupedPatients = {};
    
    appointments.forEach((appointment: Appointment) => {
      // For practitioners, show patient info; for patients, show practitioner info
      const isPatient = user?.role === 'patient';
      const contactInfo = isPatient ? appointment.practitioner.users : appointment.patient.users;
      const contactUserId = isPatient ? appointment.practitioner.user_id : appointment.patient.user_id;
      
      const appointmentDate = new Date(appointment.scheduled_at);
      const dateKey = appointmentDate.toISOString().split('T')[0];
      const timeString = appointmentDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const patient: PatientContact = {
        user_id: contactUserId,
        first_name: contactInfo.first_name,
        last_name: contactInfo.last_name,
        phone: contactInfo.phone,
        profile_url: contactInfo.profile_url,
        appointment_time: timeString,
        appointment_date: dateKey,
        status: appointment.status,
      };
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      // Avoid duplicates
      const existingIndex = grouped[dateKey].findIndex(p => p.user_id === patient.user_id);
      if (existingIndex === -1) {
        grouped[dateKey].push(patient);
      }
    });
    
    // Sort patients within each date by appointment time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    });
    
    return grouped;
  };

  // Fetch upcoming appointments
  const fetchUpcomingPatients = async () => {
    try {
      const res = await fetch(`${config.API_URL}/api/appointments/upcoming`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement des prochains patients');
      const data = await res.json();
      
      const grouped = groupPatientsByDate(data);
      setUpcomingPatients(grouped);
    } catch (err) {
      console.error('Error fetching upcoming patients:', err);
      throw err;
    }
  };

  // Fetch past appointments
  const fetchPastPatients = async () => {
    try {
      const res = await fetch(`${config.API_URL}/api/appointments/past`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement des derniers patients');
      const data = await res.json();
      
      const grouped = groupPatientsByDate(data);
      setPastPatients(grouped);
    } catch (err) {
      console.error('Error fetching past patients:', err);
      throw err;
    }
  };

  // Fetch all patient data
  const fetchPatients = useCallback(async () => {
    if (!token) {
      setError('Vous devez être connecté pour voir les patients.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([fetchUpcomingPatients(), fetchPastPatients()]);
    } catch (err) {
      setError('Impossible de charger les patients. Veuillez réessayer.');
      setUpcomingPatients({});
      setPastPatients({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Format date for display
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const dateKey = date.toISOString().split('T')[0];
    const todayKey = today.toISOString().split('T')[0];
    const tomorrowKey = tomorrow.toISOString().split('T')[0];
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    
    if (dateKey === todayKey) return "Aujourd'hui";
    if (dateKey === tomorrowKey) return "Demain";
    if (dateKey === yesterdayKey) return "Hier";
    
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Render patient item
  const renderPatientItem = (patient: PatientContact) => (
    <View key={`${patient.user_id}-${patient.appointment_time}`} style={styles.patientItem}>
      <PatientAvatar profileUrl={patient.profile_url} />
      
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>
          {patient.first_name} {patient.last_name}
        </Text>
        <Text style={styles.patientPhone}>
          {patient.phone || 'Numéro non disponible'}
        </Text>
      </View>
      
      <View style={styles.appointmentInfo}>
        <Text style={styles.appointmentTime}>
          {patient.appointment_time}
        </Text>
        {patient.status === 'cancelled' && (
          <Text style={styles.cancelledStatus}>Annulé</Text>
        )}
      </View>
      
      <TouchableOpacity
        style={[styles.callButton, !patient.phone && styles.callButtonDisabled]}
        onPress={() => makePhoneCall(patient.phone || '')}
        disabled={!patient.phone}
      >
        <Phone size={20} color={theme.colors.white} />
      </TouchableOpacity>
    </View>
  );

  // Render grouped patients section
  const renderPatientsSection = (groupedPatients: GroupedPatients, title: string) => {
    const dates = Object.keys(groupedPatients).sort((a, b) => {
      return title === 'Prochains Patients' ? a.localeCompare(b) : b.localeCompare(a);
    });
    
    if (dates.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        
        {dates.map((date) => (
          <View key={date} style={styles.dateGroup}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateTitle}>
                {formatDateHeader(date)}
              </Text>
            </View>
            
            <View style={styles.patientsContainer}>
              {groupedPatients[date].map((patient) => renderPatientItem(patient))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader />
    
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchPatients} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          {/* Upcoming Patients Section */}
          {renderPatientsSection(upcomingPatients, 'Prochains Patients')}

          {/* Past Patients Section */}
          {renderPatientsSection(pastPatients, 'Derniers Patients')}

          {/* Empty State */}
          {Object.keys(upcomingPatients).length === 0 && Object.keys(pastPatients).length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun patient trouvé.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.white,
  },
  greeting: {
    fontSize: theme.fontSizes.medium,
    color: theme.colors.muted,
  },
  userName: {
    fontSize: theme.fontSizes.xlarge,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.large,
    fontWeight: '600',
    color: theme.colors.text,
  },
  dateGroup: {
    marginBottom: theme.spacing.lg,
  },
  dateHeader: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  dateTitle: {
    fontSize: theme.fontSizes.medium,
    fontWeight: '500',
    color: theme.colors.primary,
    textTransform: 'capitalize',
  },
  patientsContainer: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarCircle: {
    backgroundColor: theme.colors.card,
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: theme.fontSizes.medium,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  patientPhone: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.muted,
  },
  appointmentInfo: {
    alignItems: 'flex-end',
    marginRight: theme.spacing.md,
  },
  appointmentTime: {
    fontSize: theme.fontSizes.small,
    fontWeight: '400',
    color: theme.colors.primary,
  },
  cancelledStatus: {
    fontSize: theme.fontSizes.small - 2,
    color: theme.colors.accent,
    marginTop: theme.spacing.xs,
  },
  callButton: {
    backgroundColor: theme.colors.green,
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonDisabled: {
    backgroundColor: theme.colors.muted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.fontSizes.medium,
    color: theme.colors.accent,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.small,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.medium,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSizes.medium,
    color: theme.colors.muted,
    textAlign: 'center',
  },
});