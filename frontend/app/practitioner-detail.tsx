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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppHeader from '../components/AppHeader';
import { useAuth } from './auth-context';
import config from '../config/config';
import { Calendar, Hospital, User } from 'lucide-react-native';

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
  available: boolean;
}

export default function PractitionerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  
  const [practitioner, setPractitioner] = useState<PractitionerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);

  // Generate next 5 days for appointment slots
  const generateAvailableSlots = (): AvailableSlot[] => {
    const slots: AvailableSlot[] = [];
    const today = new Date();
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      slots.push({
        date: date.toISOString().split('T')[0],
        dayName: dayNames[date.getDay()],
        dayNumber: date.getDate().toString(),
        available: i !== 2, // Make middle day unavailable as example
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

  useEffect(() => {
    fetchPractitioner();
  }, [id, token]);

  const handleBookAppointment = (slot: AvailableSlot) => {
    if (!slot.available) return;
    
    Alert.alert(
      'Réserver un rendez-vous',
      `Voulez-vous réserver un rendez-vous le ${slot.dayName} ${slot.dayNumber} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Réserver', 
          onPress: () => {
            // TODO: Implement appointment booking
            Alert.alert('Succès', 'Rendez-vous réservé avec succès !');
          }
        }
      ]
    );
  };

  const navigateToTab = (tab: 'practitioners' | 'profil' | 'home' | 'appointments') => {
    router.push(`/(tabs)/${tab}` as any);
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
        {/* Header Image and Info */}
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: practitioner.image }}
            style={styles.practitionerImage}
            defaultSource={require('../assets/images/placeholder-doctor.jpg')}
          />
          
          {/* Online status indicator */}
          <View style={styles.onlineIndicator} />
          
          <Text style={styles.practitionerName}>
            {practitioner.title} {practitioner.name}
          </Text>
          <Text style={styles.specialty}>{practitioner.specialty}</Text>
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color="#2E4FD1" />
            <Text style={styles.sectionTitle}>Adresse</Text>
          </View>
          <Text style={styles.address}>{practitioner.address}</Text>
          {practitioner.floor && (
            <Text style={styles.addressDetail}>{practitioner.floor}</Text>
          )}
          {practitioner.buildingCode && (
            <Text style={styles.addressDetail}>Code: {practitioner.buildingCode}</Text>
          )}
        </View>

        {/* Transport Section */}
        {practitioner.transportAccess && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="train" size={20} color="#2E4FD1" />
              <Text style={styles.sectionTitle}>Transport:</Text>
            </View>
            <Text style={styles.transportText}>{practitioner.transportAccess}</Text>
          </View>
        )}

        {/* Tariffs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={20} color="#2E4FD1" />
            <Text style={styles.sectionTitle}>Tarifs et remboursement</Text>
          </View>
          {practitioner.conventioned && (
            <View style={styles.tariffItem}>
              <Text style={styles.tariffText}>Conventionné secteur 1</Text>
            </View>
          )}
          {practitioner.price && (
            <>
              <View style={styles.tariffItem}>
                <Text style={styles.tariffText}>
                  {practitioner.price.amount}€ consultation standard
                </Text>
              </View>
              <View style={styles.tariffItem}>
                <Text style={styles.tariffText}>
                  Prise en charge à {practitioner.price.secuCoverage}% par l'assurance maladie
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Payment Methods Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet" size={20} color="#2E4FD1" />
            <Text style={styles.sectionTitle}>Moyens de paiement</Text>
          </View>
          <View style={styles.paymentMethods}>
            {practitioner.payment_methods.card && (
              <Text style={styles.paymentMethod}>Carte bancaire</Text>
            )}
            {practitioner.conventioned && (
              <Text style={styles.paymentMethod}>Carte vitale</Text>
            )}
            {practitioner.payment_methods.check && (
              <Text style={styles.paymentMethod}>Chèque</Text>
            )}
            {practitioner.payment_methods.cash && (
              <Text style={styles.paymentMethod}>Liquide</Text>
            )}
          </View>
        </View>

        {/* Available Appointments Section */}
        <View style={styles.section}>
          <Text style={styles.appointmentTitle}>Planning des rendez-vous</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.slotsContainer}
          >
            {availableSlots.map((slot, index) => (
              <TouchableOpacity
                key={slot.date}
                style={[
                  styles.slotCard,
                  index === 0 && styles.firstSlot,
                  !slot.available && styles.unavailableSlot
                ]}
                onPress={() => handleBookAppointment(slot)}
                disabled={!slot.available}
              >
                <Text style={[
                  styles.slotDay,
                  index === 0 && styles.selectedSlotText,
                  !slot.available && styles.unavailableSlotText
                ]}>
                  {slot.dayName}
                </Text>
                <Text style={[
                  styles.slotNumber,
                  index === 0 && styles.selectedSlotText,
                  !slot.available && styles.unavailableSlotText
                ]}>
                  {slot.dayNumber}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Text style={styles.availabilityTitle}>Créneaux disponibles</Text>
          <View style={styles.availabilityNote}>
            <Text style={styles.availabilityText}>
              Sélectionnez une date pour voir les créneaux disponibles
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation - Cohérent avec vos tabs */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigateToTab('practitioners')}
        >
          <Calendar color="#B0B0B0" size={24} />
          <Text style={styles.navText}>RDV</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigateToTab('practitioners')}
        >
          <Hospital color="#5671DA" size={24} />
          <Text style={[styles.navText, styles.activeNavText]}>Praticiens</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigateToTab('profil')}
        >
          <User color="#B0B0B0" size={24} />
          <Text style={styles.navText}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    position: 'relative',
  },
  practitionerImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    top: 24 + 70,
    left: '50%',
    marginLeft: 25,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#fff',
  },
  practitionerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginLeft: 8,
  },
  address: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  addressDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transportText: {
    fontSize: 14,
    color: '#333',
  },
  tariffItem: {
    marginBottom: 8,
  },
  tariffText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  paymentMethods: {
    flexDirection: 'column',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 16,
  },
  slotsContainer: {
    marginBottom: 20,
  },
  slotCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 12,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  firstSlot: {
    backgroundColor: '#2E4FD1',
    borderColor: '#2E4FD1',
  },
  unavailableSlot: {
    backgroundColor: '#F0F0F0',
    opacity: 0.6,
  },
  slotDay: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  slotNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  selectedSlotText: {
    color: '#fff',
  },
  unavailableSlotText: {
    color: '#999',
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  availabilityNote: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  availabilityText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    color: '#B0B0B0',
    marginTop: 4,
    fontWeight: '500',
  },
  activeNavText: {
    color: '#5671DA',
  },
});