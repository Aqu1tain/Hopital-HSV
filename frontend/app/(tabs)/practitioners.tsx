// PraticiensScreen.js
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../auth-context';
import config from '../../config/config';

interface Practitioner {
  id: string;
  name: string;
  title: string;
  specialty: string;
  address: string;
  image: string;
  accepts_mutuelle: boolean;
  conventioned: boolean;
  payment_methods: {
    card: boolean;
    bank_transfer: boolean;
    check: boolean;
    cash: boolean;
  };
}

interface LocationType {
  city?: string;
  district?: string;
}

const FILTERS = [
  { key: 'all', label: 'Toutes les spécialités' },
  { key: 'general', label: 'Médecine générale' },
  { key: 'pediatric', label: 'Pédiatrie' },
  { key: 'cardiology', label: 'Cardiologie' },
  { key: 'osteopathy', label: 'Ostéopathie' },
];

const PAYMENT_FILTERS = [
  { key: 'all', label: 'Tous les paiements' },
  { key: 'carte_vitale', label: 'Carte vitale' },
  { key: 'mutuelle', label: 'Mutuelle' },
];

export default function PraticiensScreen() {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [filteredPractitioners, setFilteredPractitioners] = useState<Practitioner[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    value: LocationType;
  } | null>(null);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [useLocation, setUseLocation] = useState(true);

  const fetchPractitioners = async () => {
    if (!token) {
      console.error('No authentication token found');
      return;
    }
    
    try {
      setRefreshing(true);
      
      // Préparer les données de la requête
      const requestBody: { location?: { city?: string; postal_code?: string } } = {};
      let endpoint = `${config.API_URL}/api/practitioners`;
      
      // Si la localisation est activée et qu'on a une localisation sélectionnée
      if (useLocation && selectedLocation) {
        requestBody.location = {};
        if (selectedLocation.value.city) requestBody.location.city = selectedLocation.value.city;
        if (selectedLocation.value.district) requestBody.location.postal_code = selectedLocation.value.district;
      } else if (useLocation) {
        // Si la localisation est activée mais qu'on n'a pas encore de localisation
        console.log('En attente de la localisation...');
        return;
      } else {
        // Si la localisation est désactivée, on utilise un endpoint différent
        endpoint = `${config.API_URL}/api/practitioners/all`;
      }
      
      console.log('Fetching practitioners from:', endpoint);
      console.log('Request body:', requestBody);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
      });

      // Vérifier d'abord le type de contenu de la réponse
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        console.error('Réponse non-JSON reçue:', text);
        throw new Error(`Réponse inattendue du serveur: ${text.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        console.error('Erreur du serveur:', response.status, responseData);
        throw new Error(responseData.message || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      console.log('Données reçues:', responseData);
      setPractitioners(responseData);
      setFilteredPractitioners(responseData);
    } catch (error) {
      console.error('Erreur dans fetchPractitioners:', error);
      Alert.alert(
        'Erreur', 
        `Impossible de charger les praticiens: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Définir Paris 6 par défaut si la localisation n'est pas autorisée
          setSelectedLocation({ 
            name: 'Paris 6', 
            value: { city: 'Paris', district: '75006' } 
          });
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync(location.coords);
        console.log('Adresse complète:', address); // Debug log
        
        // Extraire la ville et le code postal
        const city = address[0]?.city || 'Paris';
        // Utiliser le code postal complet au lieu de juste le dernier chiffre
        const postalCode = address[0]?.postalCode || '75000';
        const district = postalCode.startsWith('75') ? postalCode : `${postalCode}`;

        setSelectedLocation({ 
          name: `${city} ${postalCode}`, 
          value: { 
            city, 
            district: postalCode // Envoyer le code postal complet
          }
        });
      } catch (error) {
        console.error('Erreur de géolocalisation:', error);
        setSelectedLocation({ 
          name: 'Paris 75006', 
          value: { 
            city: 'Paris', 
            district: '75006' 
          }
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchPractitioners();
    }
  }, [token, selectedLocation]);

  useEffect(() => {
    // Apply filters and search
    let result = [...practitioners];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.specialty.toLowerCase().includes(searchLower) ||
          p.title.toLowerCase().includes(searchLower)
      );
    }

    // Apply specialty filter
    if (selectedSpecialty !== 'all') {
      result = result.filter(p => 
        p.specialty.toLowerCase() === selectedSpecialty.toLowerCase()
      );
    }

    // Apply payment filter
    if (selectedPayment === 'carte_vitale') {
      result = result.filter(p => p.conventioned);
    } else if (selectedPayment === 'mutuelle') {
      result = result.filter(p => p.accepts_mutuelle);
    }

    setFilteredPractitioners(result);
  }, [search, selectedSpecialty, selectedPayment, practitioners]);

  const renderItem = ({ item }: { item: Practitioner }) => (
    <TouchableOpacity style={styles.card}>
      <Image 
        source={{ uri: item.image || 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/340px-Default_pfp.svg.png' }} 
        style={styles.avatar} 
        defaultSource={require('@/assets/images/placeholder-doctor.jpg')}
      />
      <View style={styles.info}>
        <Text style={styles.name}>
          {item.title ? `${item.title} ` : ''}{item.name}
        </Text>
        <Text style={styles.spec}>{item.specialty}</Text>
        <Text style={styles.adresse} numberOfLines={1} ellipsizeMode="tail">
          {item.address}
        </Text>
        <View style={styles.paymentIcons}>
          {item.conventioned && (
            <View style={styles.paymentIcon}>
              <Ionicons name="card-outline" size={16} color="#2E4FD1" />
              <Text style={styles.paymentText}>Carte Vitale</Text>
            </View>
          )}
          {item.accepts_mutuelle && (
            <View style={styles.paymentIcon}>
              <Ionicons name="medkit-outline" size={16} color="#2E4FD1" />
              <Text style={styles.paymentText}>Mutuelle</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleLocationSelect = () => {
    setLocationInput('');
    setIsLocationModalVisible(true);
  };

  const handleLocationSubmit = () => {
    if (!locationInput.trim()) {
      setIsLocationModalVisible(false);
      return;
    }

    try {
      // Extraire le code postal si présent (format: Paris 75006 ou 75006)
      const postalCodeMatch = locationInput.match(/\b(\d{5})\b/);
      const district = postalCodeMatch ? postalCodeMatch[1] : null;
      const city = locationInput.replace(/\s*\d{5}\s*$/, '').trim() || 'Paris';
      
      setSelectedLocation({
        name: `${city}${district ? ` ${district}` : ''}`.trim(),
        value: { 
          city: city || 'Paris',
          district: district || undefined 
        }
      });
    } catch (error) {
      console.error('Erreur de recherche de localisation:', error);
      Alert.alert('Erreur', 'Impossible de traiter cette localisation');
    } finally {
      setIsLocationModalVisible(false);
    }
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

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader />
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={[styles.searchInput, { borderColor: focused ? '#2E4FD1' : '#C7C7C7' }]}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Rechercher un médecin, un praticien"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#7B7B7B"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Specialty Filters */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Spécialité :</Text>
          <FlatList
            horizontal
            data={FILTERS}
            keyExtractor={item => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  selectedSpecialty === item.key && styles.filterBtnActive
                ]}
                onPress={() => setSelectedSpecialty(item.key)}
              >
                <Text style={[
                  styles.filterText,
                  selectedSpecialty === item.key && styles.filterTextActive
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
          />
        </View>

        {/* Payment Filters */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Paiement :</Text>
          <FlatList
            horizontal
            data={PAYMENT_FILTERS}
            keyExtractor={item => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  selectedPayment === item.key && styles.filterBtnActive
                ]}
                onPress={() => setSelectedPayment(item.key)}
              >
                <Text style={[
                  styles.filterText,
                  selectedPayment === item.key && styles.filterTextActive
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
          />
        </View>

        {/* Location Toggle */}
        <View style={styles.locationToggleContainer}>
          <Text style={styles.locationToggleLabel}>Recherche par localisation</Text>
          <Switch
            value={useLocation}
            onValueChange={setUseLocation}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={useLocation ? '#2E4FD1' : '#f4f3f4'}
          />
        </View>

        {/* Location */}
        {useLocation && (
          <View style={styles.zone}>
            <Text style={styles.zoneLabel}>Praticiens {selectedLocation?.name ? `à ${selectedLocation.name}` : 'proches'}</Text>
            <View style={styles.zoneInfo}>
              <Text style={styles.zoneText} numberOfLines={1}>
                {selectedLocation?.name || 'Chargement...'}
              </Text>
              <TouchableOpacity onPress={handleLocationSelect} style={{ padding: 8 }}>
                <Text style={styles.zoneChange}>Changer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Practitioners List */}
        {filteredPractitioners.length > 0 ? (
          <FlatList
            data={filteredPractitioners}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={fetchPractitioners}
                colors={['#2E4FD1']}
                tintColor="#2E4FD1"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#C7C7C7" />
                <Text style={styles.emptyText}>Aucun praticien trouvé</Text>
                <Text style={styles.emptySubtext}>
                  Essayez de modifier vos critères de recherche
                </Text>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#C7C7C7" />
            <Text style={styles.emptyText}>Aucun praticien trouvé</Text>
            <Text style={styles.emptySubtext}>
              Essayez de modifier vos critères de recherche
            </Text>
          </View>
        )}
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isLocationModalVisible}
        onRequestClose={() => setIsLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer de zone</Text>
            <Text style={styles.modalSubtitle}>Entrez votre ville ou code postal (ex: Paris 75006)</Text>
            
            <TextInput
              style={styles.modalInput}
              value={locationInput}
              onChangeText={setLocationInput}
              placeholder="Ex: Paris 75006"
              autoFocus={true}
              onSubmitEditing={handleLocationSubmit}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsLocationModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleLocationSubmit}
              >
                <Text style={styles.submitButtonText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7C7C7',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginBottom: 8,
    marginLeft: 4,
  },
  filtersList: {
    paddingHorizontal: 4,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  filterBtnActive: {
    backgroundColor: '#2E4FD1',
    borderColor: '#2E4FD1',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  zone: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  zoneLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  zoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  zoneChange: {
    color: '#2E4FD1',
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  spec: {
    fontSize: 14,
    color: '#2E4FD1',
    fontWeight: '500',
    marginBottom: 4,
  },
  adresse: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  paymentIcons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF0FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  paymentText: {
    fontSize: 12,
    color: '#2E4FD1',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#2E4FD1',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  locationToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationToggleLabel: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
});
