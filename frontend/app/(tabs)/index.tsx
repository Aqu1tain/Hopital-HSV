import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../auth-context';

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  notes?: string;
  practitioner: {
    user_id: string;
    users: {
      first_name: string;
      last_name: string;
      profile_url?: string;
    };
    title?: string;
    street_address?: string;
    city?: string;
    specialty?: string;
  };
  patient?: {
    user_id: string;
    users: {
      first_name: string;
      last_name: string;
    };
  };
}

interface Practitioner {
  id: string;
  name: string;
  specialty: string;
  address: string;
  image: string;
  title?: string;
}

const Card = ({ title, details, actionText, onAction, loading = false }) => (
  <View style={[styles.card, loading && styles.loadingCard]}>
    <View style={{ flex: 1 }}>
      {loading ? (
        <View style={styles.loadingPlaceholder} />
      ) : (
        <Text style={styles.cardTitle}>{title}</Text>
      )}
      {loading ? (
        <View style={[styles.loadingPlaceholder, { width: '70%', marginTop: 8 }]} />
      ) : (
        <Text style={styles.cardDetails}>{details}</Text>
      )}
    </View>
    {actionText && !loading && (
      <TouchableOpacity style={styles.smallButton} onPress={onAction}>
        <Text style={styles.smallButtonText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default function HomeScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [availablePractitioners, setAvailablePractitioners] = useState<Practitioner[]>([]);

  const fetchData = async () => {
    if (!token) return;
    
    try {
      setRefreshing(true);
      
      // Fetch upcoming appointments
      const upcomingRes = await fetch('http://localhost:3000/api/appointments/upcoming', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const upcomingData = await upcomingRes.json();
      
      // Fetch past appointments
      const pastRes = await fetch('http://localhost:3000/api/appointments/past', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const pastData = await pastRes.json();
      
      // Fetch available practitioners
      const practitionersRes = await fetch('http://localhost:3000/api/practitioners/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const practitionersData = await practitionersRes.json();
      
      setUpcomingAppointments(upcomingData || []);
      setPastAppointments(pastData || []);
      setAvailablePractitioners(practitionersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format time
    const timeString = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    // Check if it's today or tomorrow
    if (date.toDateString() === now.toDateString()) {
      return `Aujourd'hui ${timeString}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Demain ${timeString}`;
    } else {
      // Format as "DayOfWeek DD/MM HH:MM"
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderAppointmentCard = (appointment: Appointment, isUpcoming: boolean) => {
    const name = `${appointment.practitioner.users.first_name} ${appointment.practitioner.users.last_name}`;
    const title = appointment.practitioner.title || '';
    const specialty = appointment.practitioner.specialty || 'Médecin Généraliste';
    const address = appointment.practitioner.street_address 
      ? `${appointment.practitioner.street_address}, ${appointment.practitioner.city}`
      : 'Adresse non disponible';
    
    return (
      <Card
        key={appointment.id}
        title={`${title} ${name} – ${specialty}`}
        details={isUpcoming 
          ? `${formatAppointmentDate(appointment.scheduled_at)} – ${address}`
          : `Le ${new Date(appointment.scheduled_at).toLocaleDateString('fr-FR')}`}
        actionText={isUpcoming ? "Programmer un rappel" : undefined}
        onAction={() => {}}
      />
    );
  };

  const renderLoadingCards = (count: number) => {
    return Array(count).fill(0).map((_, i) => (
      <Card
        key={`loading-${i}`}
        title=""
        details=""
        loading={true}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2E4FD1" />
          </View>
        ) : (
          <>
            {upcomingAppointments.length === 0 ? (
              <View style={styles.centered}>
                <Text style={styles.notice}>
                  Vous n'avez pas de rendez-vous prévu aujourd'hui.
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => router.push('/practitioners')}
                >
                  <Text style={styles.primaryButtonText}>
                    Prendre un rendez-vous
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {upcomingAppointments.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Vos prochains rendez-vous</Text>
                {upcomingAppointments.map(appt => renderAppointmentCard(appt, true))}
              </>
            )}

            <Text style={styles.sectionTitle}>Vos derniers rendez-vous</Text>
            {loading ? (
              renderLoadingCards(2)
            ) : pastAppointments.length > 0 ? (
              pastAppointments.map(appt => renderAppointmentCard(appt, false))
            ) : (
              <Text style={styles.noDataText}>Aucun rendez-vous passé</Text>
            )}

            <Text style={styles.sectionTitle}>
              Praticiens disponibles aujourd'hui
            </Text>

            <View style={styles.pracList}>
              {loading ? (
                renderLoadingCards(2)
              ) : availablePractitioners.length > 0 ? (
                availablePractitioners.slice(0, 3).map((practitioner) => (
                  <View key={practitioner.id} style={styles.doctorCard}>
                    <Image 
                      source={{ uri: practitioner.image }} 
                      style={styles.doctorImage} 
                      defaultSource={require('@/assets/images/placeholder-doctor.jpg')}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.cardTitle}>
                        {practitioner.title ? `${practitioner.title} ` : ''}{practitioner.name}
                      </Text>
                      <Text style={styles.doctorSpecialty}>{practitioner.specialty}</Text>
                      <Text style={styles.doctorAddress}>{practitioner.address}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>Aucun praticien disponible aujourd'hui</Text>
              )}

              {/* overlay gradient */}
              <LinearGradient
                colors={['transparent', '#ffffff']}
                style={styles.gradientOverlay}
              />
              <View style={styles.overlayContent}>
                <TouchableOpacity
                  onPress={() => router.push('/practitioners')}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Voir plus</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },

  centered: { alignItems: 'center', marginVertical: 40 },
  notice: {
    fontSize: 14,        
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
    color: '#000',
  },

  primaryButton: {
    backgroundColor: '#2E4FD1',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,        
    fontWeight: '500',
  },

  sectionTitle: {
    fontSize: 16,        
    fontWeight: '500',
    marginTop: 30,
    marginBottom: 10,
    color: '#000',
  },

  card: {

    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 17,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,        
    fontWeight: '600',
    color: '#000',
  },
  cardDetails: {
    fontSize: 12,        
    fontWeight: '400',
    color: '#444',
    marginTop: 4,
  },

  smallButton: {
    backgroundColor: '#2E4FD1E5',
    paddingHorizontal: 9,
    paddingVertical: 11,  
    borderRadius: 8,
  },

  smallButtonText: {
    color: '#fff',
    fontSize: 14,        
    fontWeight: '500',
  },
  pracList: {
    marginTop: 10,
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,  
    height: 200,
    zIndex: 1,
  },
  overlayContent: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },

  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  doctorImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  doctorSpecialty: {
    fontSize: 14,        
    fontWeight: '500',
    color: '#444',
    marginTop: 2,
  },
  doctorAddress: {
    fontSize: 12,        
    fontWeight: '400',
    color: '#777',
    marginTop: 2,
  },
  loadingCard: {
    backgroundColor: '#f5f5f5',
    minHeight: 80,
    justifyContent: 'center',
  },
  
  loadingPlaceholder: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  
  noDataText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
});
