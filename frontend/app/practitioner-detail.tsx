import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppHeader from '../components/AppHeader';
import { useAuth } from './auth-context';
import config from '../config/config';
import { Calendar, Hospital, User, MapPin } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface PractitionerDetail {
  id: string;
  name: string;
  title: string;
  specialty: string;
  address: string;
  image: string;
  floor?: string;
  buildingCode?: string;
  transportAccess?: string;
  accepts_mutuelle: boolean;
  conventioned: boolean;
  isVerified: boolean;
  price?: {
    amount: number;
    currency: string;
    secuCoverage: number;
  };
  payment_methods: {
    card: boolean;
    bank_transfer: boolean;
    check: boolean;
    cash: boolean;
  };
  email?: string;
  phone?: string;
}

interface AvailableSlot {
  date: string;
  dayName: string;
  dayNumber: string;
  month: string;
  available: boolean;
}

interface TimeSlot {
  time: string;
  datetime: string;
  available: boolean;
}

export default function PractitionerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  
  const [practitioner, setPractitioner] = useState<PractitionerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedDateTime, setSelectedDateTime] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Generate next 5 days for appointment slots
  const generateAvailableSlots = (): AvailableSlot[] => {
    const slots: AvailableSlot[] = [];
    const today = new Date();
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      
      slots.push({
        date: date.toISOString().split('T')[0],
        dayName: dayNames[dayOfWeek],
        dayNumber: date.getDate().toString(),
        month: monthNames[date.getMonth()],
        available: true, // Will be determined by API
      });
    }
    
    return slots;
  };

  const fetchPractitioner = async () => {
    if (!token || !id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/api/practitioners`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du praticien');
      }

      const practitioners = await response.json();
      const practitionerData = practitioners.find((p: PractitionerDetail) => p.id === id);
      
      if (!practitionerData) {
        throw new Error('Praticien non trouvé');
      }

      setPractitioner(practitionerData);
      setAvailableSlots(generateAvailableSlots());
    } catch (error) {
      console.error('Erreur fetchPractitioner:', error);
      Alert.alert('Erreur', 'Impossible de charger les informations du praticien');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async (date: string) => {
    if (!token || !id) return;
    
    try {
      setLoadingSlots(true);
      const response = await fetch(
        `${config.API_URL}/api/practitioners/${id}/availability?date=${date}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des créneaux');
      }

      const data = await response.json();
      
      if (data.available && data.timeSlots) {
        setTimeSlots(data.timeSlots);
        
        // Update slot availability
        setAvailableSlots(prev => prev.map(slot => 
          slot.date === date 
            ? { ...slot, available: data.timeSlots.length > 0 }
            : slot
        ));
      } else {
        setTimeSlots([]);
        setAvailableSlots(prev => prev.map(slot => 
          slot.date === date 
            ? { ...slot, available: false }
            : slot
        ));
      }
    } catch (error) {
      console.error('Erreur fetchTimeSlots:', error);
      setTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchPractitioner();
  }, [id, token]);
  
  useEffect(() => {
    // Fetch availability for all days when slots are generated
    const checkAllDaysAvailability = async () => {
      if (availableSlots.length > 0 && token && id) {
        // Check availability for each day
        const availabilityPromises = availableSlots.map(async (slot) => {
          try {
            const response = await fetch(
              `${config.API_URL}/api/practitioners/${id}/availability?date=${slot.date}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );
  
            if (response.ok) {
              const data = await response.json();
              return {
                date: slot.date,
                available: data.available && data.timeSlots && data.timeSlots.length > 0
              };
            }
          } catch (error) {
            console.error(`Error checking availability for ${slot.date}:`, error);
          }
          return { date: slot.date, available: false };
        });
  
        const results = await Promise.all(availabilityPromises);
        
        // Update all slots with their availability
        setAvailableSlots(prev => prev.map(slot => {
          const result = results.find(r => r.date === slot.date);
          return { ...slot, available: result?.available || false };
        }));
        
        // Fetch time slots for the initially selected date
        if (availableSlots.length > 0) {
          fetchTimeSlots(availableSlots[0].date);
        }
      }
    };
  
    checkAllDaysAvailability();
  }, [availableSlots.length, token, id]); // Only check when we have the initial slots
  
  useEffect(() => {
    // Fetch time slots when date selection changes (user clicks)
    if (availableSlots.length > 0 && selectedSlot < availableSlots.length && selectedSlot > 0) {
      const selectedDate = availableSlots[selectedSlot].date;
      fetchTimeSlots(selectedDate);
      setSelectedTime(''); // Reset selected time
      setSelectedDateTime('');
    }
  }, [selectedSlot]);

  const handleBookAppointment = async () => {
    console.log('handleBookAppointment called');
    console.log('selectedDateTime:', selectedDateTime);
    console.log('id:', id);
    console.log('token:', token);
    
    if (!selectedDateTime || !id || !token) {
      // For web, use window.alert or create a custom modal
      if (Platform.OS === 'web') {
        window.alert(`Données manquantes: DateTime: ${selectedDateTime}, ID: ${id}, Token: ${token ? 'present' : 'missing'}`);
      } else {
        Alert.alert('Erreur', `Données manquantes: DateTime: ${selectedDateTime}, ID: ${id}, Token: ${token ? 'present' : 'missing'}`);
      }
      return;
    }
    
    const slot = availableSlots[selectedSlot];
    
    // For web, use window.confirm
    const confirmBooking = Platform.OS === 'web' 
      ? window.confirm(`Voulez-vous réserver un rendez-vous le ${slot.dayName} ${slot.dayNumber} ${slot.month} à ${selectedTime} ?`)
      : await new Promise((resolve) => {
          Alert.alert(
            'Confirmer le rendez-vous',
            `Voulez-vous réserver un rendez-vous le ${slot.dayName} ${slot.dayNumber} ${slot.month} à ${selectedTime} ?`,
            [
              { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Confirmer', onPress: () => resolve(true) }
            ]
          );
        });
  
    if (!confirmBooking) return;
  
    try {
      setBookingInProgress(true);
      
      console.log('Sending appointment request...');
      
      const response = await fetch(`${config.API_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          practitioner_id: id,
          scheduled_at: selectedDateTime,
          notes: '',
        }),
      });
  
      const responseData = await response.json();
      console.log('Response:', response.status, responseData);
  
      if (!response.ok) {
        throw new Error(responseData.error || 'Erreur lors de la réservation');
      }
      
      // Success message
      const successMessage = `Votre rendez-vous avec ${practitioner?.title || ''} ${practitioner?.name} est confirmé pour le ${slot.dayName} ${slot.dayNumber} ${slot.month} à ${selectedTime}.\n\nVous recevrez un email de confirmation.`;
      
      if (Platform.OS === 'web') {
        window.alert('Rendez-vous confirmé ✓\n\n' + successMessage);
        router.push('/(tabs)/');
      } else {
        Alert.alert(
          'Rendez-vous confirmé ✓', 
          successMessage,
          [
            {
              text: 'OK',
              onPress: () => {
                router.push('/(tabs)/');
              }
            }
          ]
        );
      }
      
      // Refresh the time slots
      fetchTimeSlots(slot.date);
      
    } catch (error) {
      console.error('Erreur réservation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible de réserver le rendez-vous';
      
      if (Platform.OS === 'web') {
        window.alert('Erreur: ' + errorMessage);
      } else {
        Alert.alert('Erreur', errorMessage);
      }
    } finally {
      setBookingInProgress(false);
    }
  };  

  const navigateToTab = (tab: 'practitioners' | 'profil' | 'index') => {
    if (tab === 'index') {
      router.push('/');
    } else {
      router.push(`/(tabs)/${tab}` as any);
    }
  };

  const handleTimeSelection = (slot: TimeSlot) => {
    if (!slot.available) return;
    console.log('Selected time slot:', slot); // Debug log
    setSelectedTime(slot.time);
    setSelectedDateTime(slot.datetime);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E4FD1" />
        </View>
      </SafeAreaView>
    );
  }

  if (!practitioner) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Praticien non trouvé</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section with Image Background */}
        <View style={styles.headerSection}>
          <Image
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Bateau_Lavoir_01.jpg/1200px-Bateau_Lavoir_01.jpg' }}
            style={styles.backgroundImage}
          />
          <View style={styles.profileOverlay}>
            <View style={styles.profileInfo}>
              <Image
                source={{ uri: practitioner.image }}
                style={styles.practitionerImage}
                defaultSource={require('../assets/images/placeholder-doctor.jpg')}
              />
              {practitioner.isVerified && (
                <View style={styles.onlineIndicator} />
              )}
              <View style={styles.profileText}>
                <Text style={styles.practitionerName}>
                  {practitioner.title ? `${practitioner.title} ${practitioner.name}` : practitioner.name}
                </Text>
                <Text style={styles.specialty}>{practitioner.specialty}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.contentContainer}>
          {/* Address Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Adresse</Text>
            <View style={styles.addressContent}>
              <Text style={styles.addressText}>{practitioner.address}</Text>
              {practitioner.floor && (
                <Text style={styles.addressSubText}>{practitioner.floor}</Text>
              )}
              {practitioner.transportAccess && (
                <View style={styles.transportSection}>
                  <Text style={styles.transportLabel}>Transport:</Text>
                  <Text style={styles.transportText}>{practitioner.transportAccess}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.mapButton}>
                <MapPin size={20} color="#2E4FD1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tarifs Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tarifs et remboursement</Text>
            {practitioner.conventioned && (
              <Text style={styles.infoText}>• Conventionné secteur 1</Text>
            )}
            {practitioner.price && (
              <>
                <Text style={styles.infoText}>
                  • {practitioner.price.amount}€ consultation standard
                </Text>
                <Text style={styles.infoText}>
                  • Prise en charge à {practitioner.price.secuCoverage}% par l'assurance maladie
                </Text>
              </>
            )}
          </View>

          {/* Payment Methods Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Moyens de paiement</Text>
            {practitioner.payment_methods.card && (
              <Text style={styles.infoText}>• Carte bancaire</Text>
            )}
            {practitioner.conventioned && (
              <Text style={styles.infoText}>• Carte vitale</Text>
            )}
            {practitioner.payment_methods.check && (
              <Text style={styles.infoText}>• Chèque</Text>
            )}
            {practitioner.payment_methods.cash && (
              <Text style={styles.infoText}>• Liquide</Text>
            )}
          </View>

          {/* Appointment Section */}
          <View style={styles.appointmentCard}>
            <Text style={styles.cardTitle}>Planning des rendez-vous</Text>
            
            {/* Date Selection */}
            <View style={styles.dateContainer}>
              {availableSlots.map((slot, index) => (
                <TouchableOpacity
                  key={slot.date}
                  style={[
                    styles.dateSlot,
                    selectedSlot === index && styles.selectedDateSlot,
                    !slot.available && styles.unavailableDateSlot
                  ]}
                  onPress={() => setSelectedSlot(index)}
                >
                  <Text style={[
                    styles.dayText,
                    selectedSlot === index && styles.selectedDateText,
                    !slot.available && styles.unavailableText
                  ]}>
                    {slot.dayName}
                  </Text>
                  <Text style={[
                    styles.dateNumber,
                    selectedSlot === index && styles.selectedDateText,
                    !slot.available && styles.unavailableText
                  ]}>
                    {slot.dayNumber}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time Slots */}
            {loadingSlots ? (
              <View style={styles.loadingSlotsContainer}>
                <ActivityIndicator size="small" color="#2E4FD1" />
                <Text style={styles.loadingSlotsText}>Chargement des créneaux...</Text>
              </View>
            ) : (
              <>
                {timeSlots.length > 0 ? (
                  <>
                    <Text style={styles.timeSlotsTitle}>Créneaux disponibles</Text>
                    <View style={styles.timeSlotContainer}>
                      {timeSlots.map((slot) => (
                        <TouchableOpacity
                          key={slot.time}
                          style={[
                            styles.timeSlot,
                            selectedTime === slot.time && styles.selectedTimeSlot,
                            !slot.available && styles.unavailableTimeSlot
                          ]}
                          onPress={() => handleTimeSelection(slot)}
                          disabled={!slot.available}
                        >
                          <Text style={[
                            styles.timeText,
                            selectedTime === slot.time && styles.selectedTimeText,
                            !slot.available && styles.unavailableTimeText
                          ]}>
                            {slot.time}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Book Button */}
                    <TouchableOpacity 
                      style={[
                        styles.bookButton, 
                        (!selectedTime || bookingInProgress) && styles.bookButtonDisabled
                      ]}
                      onPress={handleBookAppointment}
                      disabled={!selectedTime || bookingInProgress}
                    >
                      {bookingInProgress ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.bookButtonText}>
                          {selectedTime ? 'Confirmer le rendez-vous' : 'Sélectionnez un créneau'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.unavailableMessage}>
                    <Text style={styles.unavailableMessageText}>
                      Aucun créneau disponible ce jour
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigateToTab('index')}
        >
          <Calendar size={24} color="#666" />
          <Text style={styles.navText}>RDV</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigateToTab('practitioners')}
        >
          <Hospital size={24} color="#2E4FD1" />
          <Text style={[styles.navText, styles.activeNavText]}>PRATICIENS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigateToTab('profil')}
        >
          <User size={24} color="#666" />
          <Text style={styles.navText}>PROFIL</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  
  // Header Section
  headerSection: {
    height: 200,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  practitionerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileText: {
    marginLeft: 16,
    flex: 1,
  },
  practitionerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  specialty: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  // Content
  contentContainer: {
    padding: 16,
  },
  
  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  
  // Address Card
  addressContent: {
    position: 'relative',
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  addressSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  transportSection: {
    marginTop: 12,
  },
  transportLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  transportText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  mapButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Info Text
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
  },
  
  // Appointment Card
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  // Date Selection
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateSlot: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 60,
  },
  selectedDateSlot: {
    backgroundColor: '#2E4FD1',
    borderColor: '#2E4FD1',
  },
  unavailableDateSlot: {
    backgroundColor: '#F8F8F8',
    opacity: 0.5,
  },
  dayText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  selectedDateText: {
    color: '#fff',
  },
  unavailableText: {
    color: '#C0C0C0',
  },
  
  // Time Slots
  timeSlotsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  timeSlot: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#2E4FD1',
  },
  unavailableTimeSlot: {
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  timeText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTimeText: {
    color: '#fff',
  },
  unavailableTimeText: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  
  // Unavailable Message
  unavailableMessage: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  unavailableMessageText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  
  // Book Button
  bookButton: {
    backgroundColor: '#2E4FD1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#C0C0C0',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Bottom Navigation
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  navText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  activeNavText: {
    color: '#2E4FD1',
  },
  loadingSlotsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSlotsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});