import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Platform, 
  Alert 
} from 'react-native';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/app/auth-context';
import { useRouter } from 'expo-router';
import config from '@/config/config';

const { width } = Dimensions.get('window');

const Bandeau = () => {
  const router = useRouter();
  
  return (
    <View style={styles.bandeau}>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.replace('/(tabs)/settings')}
        accessible
        accessibilityLabel="Ouvrir les paramètres"
      >
        <Image
          source={require('@/assets/images/settings.png')}
          style={styles.settingsIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

interface TextProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  isEditing?: boolean;
  multiline?: boolean;
  error?: string;
}

const Texte: React.FC<TextProps> = ({ label, value, onChangeText, isEditing, multiline = false, error }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  const handleTextLayout = (event: any) => {
    const { lines } = event.nativeEvent;
    setIsTruncated(lines.length > 1);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={[styles.textContainer, error && styles.textContainerError]}>
      <Text style={styles.text}>{label}</Text>
      <View style={styles.infoContainer}>
        {isEditing ? (
          <TextInput
            style={[styles.textInput, multiline && styles.multilineInput]}
            value={value}
            onChangeText={onChangeText}
            multiline={multiline}
            numberOfLines={multiline ? undefined : 1}
            autoCapitalize={label === 'Email : ' ? 'none' : 'sentences'}
            keyboardType={label === 'Téléphone : ' ? 'phone-pad' : label === 'Email : ' ? 'email-address' : 'default'}
            placeholder={`Entrez ${label.toLowerCase().replace(' : ', '')}`}
            accessibilityLabel={label}
          />
        ) : (
          <View style={styles.textWrapper}>
            <Text
              style={styles.textSecondary}
              numberOfLines={isExpanded ? undefined : 1}
              onTextLayout={handleTextLayout}
            >
              {value || 'Non renseigné'}
            </Text>
            {isTruncated && !isExpanded && (
              <TouchableOpacity onPress={toggleExpand} accessible accessibilityLabel="Afficher plus">
                <Text style={styles.ellipsis}>...</Text>
              </TouchableOpacity>
            )}
            {isExpanded && (
              <TouchableOpacity onPress={toggleExpand} accessible accessibilityLabel="Afficher moins">
                <Text style={styles.ellipsis}>Voir moins</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

interface ToggleProps {
  label: string;
  value: boolean;
  onToggle?: (value: boolean) => void;
  isEditing?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ label, value, onToggle, isEditing }) => {
  return (
    <View style={styles.textContainer}>
      <Text style={styles.text}>{label}</Text>
      <View style={styles.infoContainer}>
        {isEditing ? (
          <TouchableOpacity
            style={[styles.toggle, value && styles.toggleActive]}
            onPress={() => onToggle?.(!value)}
            accessible
            accessibilityLabel={`${label} ${value ? 'activé' : 'désactivé'}`}
          >
            <View style={[styles.toggleButton, value && styles.toggleButtonActive]} />
          </TouchableOpacity>
        ) : (
          <Text style={[styles.textSecondary, { color: value ? '#4CAF50' : '#e74c3c' }]}>
            {value ? 'Oui' : 'Non'}
          </Text>
        )}
      </View>
    </View>
  );
};

export default function PractitionerProfilScreen() {
  const { logout, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    profile_url: '',
  });

  const [practitionerData, setPractitionerData] = useState({
    title: '',
    specialty: '',
    street_address: '',
    postal_code: '',
    city: '',
    floor: '',
    building_code: '',
    public_transport_access: '',
    standard_price_cents: '',
    secu_coverage_percent: '',
    payment_card: false,
    payment_bank_transfer: false,
    payment_cheque: false,
    payment_cash: false,
    accepts_mutuelle: false,
    conventioned: false,
    is_verified: false,
  });

  const validateFields = () => {
    const newErrors: { [key: string]: string } = {};

    // Validate email
    if (isEditing && userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      newErrors.email = 'Adresse e-mail invalide';
    }

    // Validate phone
    if (isEditing && userData.phone && !/^\+?\d{10,}$/.test(userData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    // Validate postal code
    if (isEditing && practitionerData.postal_code && !/^\d{5}$/.test(practitionerData.postal_code)) {
      newErrors.postal_code = 'Code postal invalide (5 chiffres requis)';
    }

    // Validate price
    if (isEditing && practitionerData.standard_price_cents && !/^\d+$/.test(practitionerData.standard_price_cents)) {
      newErrors.standard_price_cents = 'Prix invalide (nombre entier requis)';
    }

    // Validate secu coverage
    if (isEditing && practitionerData.secu_coverage_percent && 
        (!/^\d+$/.test(practitionerData.secu_coverage_percent) || 
         parseInt(practitionerData.secu_coverage_percent) > 100)) {
      newErrors.secu_coverage_percent = 'Pourcentage invalide (0-100)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchUserData = async () => {
    if (!token) return;

    try {
      setDataLoading(true);
      const response = await fetch(`${config.API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Échec de la récupération des données utilisateur');
      }

      const data = await response.json();

      setUserData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        profile_url: data.profile_url || '',
      });

      if (data.role === 'practitioner' && data.profile) {
        const profile = data.profile;
        setPractitionerData({
          title: profile.title || '',
          specialty: profile.specialty || '',
          street_address: profile.street_address || '',
          postal_code: profile.postal_code || '',
          city: profile.city || '',
          floor: profile.floor || '',
          building_code: profile.building_code || '',
          public_transport_access: profile.public_transport_access || '',
          standard_price_cents: profile.standard_price_cents ? (profile.standard_price_cents / 100).toString() : '',
          secu_coverage_percent: profile.secu_coverage_percent ? profile.secu_coverage_percent.toString() : '',
          payment_card: profile.payment_card || false,
          payment_bank_transfer: profile.payment_bank_transfer || false,
          payment_cheque: profile.payment_cheque || false,
          payment_cash: profile.payment_cash || false,
          accepts_mutuelle: profile.accepts_mutuelle || false,
          conventioned: profile.conventioned || false,
          is_verified: profile.is_verified || false,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données utilisateur');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [token]);

  const updateAllData = async () => {
    if (!validateFields()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans les champs avant de sauvegarder');
      return;
    }

    try {
      setLoading(true);

      // Update user data first
      const userResponse = await fetch(`${config.API_URL}/api/users/update`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: userData.phone,
          email: userData.email,
        }),
      });

      if (!userResponse.ok) {
        throw new Error('Échec de la mise à jour des données utilisateur');
      }

      // Update practitioner profile
      const practitionerResponse = await fetch(`${config.API_URL}/api/practitioners/update`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: practitionerData.title,
          specialty: practitionerData.specialty,
          street_address: practitionerData.street_address,
          postal_code: practitionerData.postal_code,
          city: practitionerData.city,
          floor: practitionerData.floor,
          building_code: practitionerData.building_code,
          public_transport_access: practitionerData.public_transport_access,
          standard_price_cents: practitionerData.standard_price_cents ? parseInt(practitionerData.standard_price_cents) * 100 : null,
          secu_coverage_percent: practitionerData.secu_coverage_percent ? parseInt(practitionerData.secu_coverage_percent) : null,
          payment_card: practitionerData.payment_card,
          payment_bank_transfer: practitionerData.payment_bank_transfer,
          payment_cheque: practitionerData.payment_cheque,
          payment_cash: practitionerData.payment_cash,
          accepts_mutuelle: practitionerData.accepts_mutuelle,
          conventioned: practitionerData.conventioned,
        }),
      });

      if (!practitionerResponse.ok) {
        throw new Error('Échec de la mise à jour du profil praticien');
      }

      await fetchUserData(); // Refresh data after update
      setIsEditing(false);
      Alert.alert('Succès', 'Vos informations ont été mises à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour les données');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      updateAllData();
    } else {
      setIsEditing(true);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = Platform.OS === 'web'
      ? window.confirm('Voulez-vous vraiment vous déconnecter ?')
      : await new Promise(resolve => {
          Alert.alert(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter ?',
            [
              { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Confirmer', onPress: () => resolve(true) },
            ],
          );
        });

    if (!confirmLogout) return;

    setLoading(true);
    try {
      await fetch(`${config.API_URL}/auth/logout`, { method: 'POST' });
    } catch {}
    logout();
    router.replace('/auth');
    setLoading(false);
  };

  return (
    <View style={styles.safe}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Bandeau />
        <View style={styles.imageWrapper}>
          <Image
            source={
              userData.profile_url && userData.profile_url !== 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/340px-Default_pfp.svg.png'
                ? { uri: userData.profile_url }
                : require('@/assets/images/pdp.png')
            }
            style={styles.image}
            accessible
            accessibilityLabel="Photo de profil"
          />
          <Text style={styles.pseudo}>
            {dataLoading ? 'Chargement...' : `${practitionerData.title} ${userData.first_name} ${userData.last_name}`}
          </Text>
          <Text style={styles.specialty}>
            {practitionerData.specialty || 'Praticien'}
          </Text>
          <View style={styles.verificationBadge}>
            <Text style={[styles.verificationText, practitionerData.is_verified && styles.verifiedText]}>
              {practitionerData.is_verified ? '✓ Vérifié' : '⏳ En attente de vérification'}
            </Text>
          </View>
        </View>

        {dataLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E4FD1" />
            <Text style={styles.loadingText}>Chargement des données...</Text>
          </View>
        ) : (
          <View style={styles.container}>
            {/* Edit/Save Button */}
            <TouchableOpacity
              style={[styles.editButton, isEditing && styles.editButtonActive]}
              onPress={handleEditToggle}
              disabled={loading}
              accessible
              accessibilityLabel={isEditing ? 'Enregistrer les modifications' : 'Modifier le profil'}
            >
              <Text style={styles.editIcon}>✎</Text>
              <Text style={styles.editText}>
                {loading ? 'Enregistrement...' : isEditing ? 'Enregistrer tout' : 'Modifier'}
              </Text>
            </TouchableOpacity>

            {/* Contact Information */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Informations de contact</Text>
              <Texte
                label="Téléphone : "
                value={userData.phone}
                isEditing={isEditing}
                onChangeText={(text) => setUserData({ ...userData, phone: text })}
                error={errors.phone}
              />
              <Texte
                label="Email : "
                value={userData.email}
                isEditing={isEditing}
                onChangeText={(text) => setUserData({ ...userData, email: text })}
                error={errors.email}
              />
            </View>

            {/* Professional Information */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Informations professionnelles</Text>
              <Texte
                label="Titre : "
                value={practitionerData.title}
                isEditing={isEditing}
                onChangeText={(text) => setPractitionerData({ ...practitionerData, title: text })}
              />
              <Texte
                label="Spécialité : "
                value={practitionerData.specialty}
                isEditing={isEditing}
                onChangeText={(text) => setPractitionerData({ ...practitionerData, specialty: text })}
              />
            </View>

            {/* Address */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Adresse du cabinet</Text>
              <Texte
                label="Rue : "
                value={practitionerData.street_address}
                isEditing={isEditing}
                onChangeText={(text) => setPractitionerData({ ...practitionerData, street_address: text })}
              />
              <Texte
                label="Code postal : "
                value={practitionerData.postal_code}
                isEditing={isEditing}
                onChangeText={(text) => setPractitionerData({ ...practitionerData, postal_code: text })}
                error={errors.postal_code}
              />
              <Texte
                label="Ville : "
                value={practitionerData.city}
                isEditing={isEditing}
                onChangeText={(text) => setPractitionerData({ ...practitionerData, city: text })}
              />
              <Texte
                label="Étage : "
                value={practitionerData.floor}
                isEditing={isEditing}
                onChangeText={(text) => setPractitionerData({ ...practitionerData, floor: text })}
              />
              <Texte
                label="Code bâtiment : "
                value={practitionerData.building_code}
                isEditing={isEditing}
                onChangeText={(text) => setPractitionerData({ ...practitionerData, building_code: text })}
              />
              <Texte
                label="Accès transport : "
                value={practitionerData.public_transport_access}
                isEditing={isEditing}
                onChangeText={(text) => setPractitionerData({ ...practitionerData, public_transport_access: text })}
                multiline={true}
              />
            </View>

            {/* Payment Methods */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Moyens de paiement</Text>
              <Toggle
                label="Carte bancaire : "
                value={practitionerData.payment_card}
                isEditing={isEditing}
                onToggle={(value) => setPractitionerData({ ...practitionerData, payment_card: value })}
              />
              <Toggle
                label="Virement bancaire : "
                value={practitionerData.payment_bank_transfer}
                isEditing={isEditing}
                onToggle={(value) => setPractitionerData({ ...practitionerData, payment_bank_transfer: value })}
              />
              <Toggle
                label="Chèque : "
                value={practitionerData.payment_cheque}
                isEditing={isEditing}
                onToggle={(value) => setPractitionerData({ ...practitionerData, payment_cheque: value })}
              />
              <Toggle
                label="Espèces : "
                value={practitionerData.payment_cash}
                isEditing={isEditing}
                onToggle={(value) => setPractitionerData({ ...practitionerData, payment_cash: value })}
              />
            </View>

            {/* Pricing and Insurance */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tarifs et remboursement</Text>
              <Toggle
                label="Mutuelle acceptée : "
                value={practitionerData.accepts_mutuelle}
                isEditing={isEditing}
                onToggle={(value) => setPractitionerData({ ...practitionerData, accepts_mutuelle: value })}
              />
              <Toggle
                label="Conventionné : "
                value={practitionerData.conventioned}
                isEditing={isEditing}
                onToggle={(value) => setPractitionerData({ ...practitionerData, conventioned: value })}
              />
              <Texte
                label="Prix standard (€) : "
                value={practitionerData.standard_price_cents}
                isEditing={isEditing}
                onChangeText={(text) => setPractitionerData({ ...practitionerData, standard_price_cents: text })}
                error={errors.standard_price_cents}
              />
              <Texte
                label="Prise en charge Sécu (%) : "
                value={practitionerData.secu_coverage_percent}
                isEditing={isEditing}
                onChangeText={(text) => setPractitionerData({ ...practitionerData, secu_coverage_percent: text })}
                error={errors.secu_coverage_percent}
              />
            </View>

            {/* Logout */}
            <View style={styles.card}>
              <TouchableOpacity
                style={[styles.logoutButton, loading && styles.buttonDisabled]}
                onPress={handleLogout}
                disabled={loading}
                accessible
                accessibilityLabel="Se déconnecter"
              >
                <Text style={styles.logoutText}>
                  {loading ? 'Déconnexion...' : 'Se déconnecter'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    padding: 16,
  },
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
    fontFamily: 'Inter',
  },
  bandeau: {
    height: 160,
    width: '100%',
    backgroundColor: '#2E4FD1',
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  settingsIcon: {
    tintColor: '#FFFFFF',
    width: 24,
    height: 24,
  },
  imageWrapper: {
    alignItems: 'center',
    marginTop: -60,
    marginBottom: 16,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  pseudo: {
    marginTop: 8,
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  specialty: {
    marginTop: 4,
    color: '#666',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  verificationBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  verificationText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter',
  },
  verifiedText: {
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E4FD1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  editButtonActive: {
    backgroundColor: '#4CAF50',
  },
  editIcon: {
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
  },
  editText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContainerError: {
    borderLeftWidth: 3,
    borderLeftColor: '#e74c3c',
    paddingLeft: 8,
  },
  text: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
    width: 150,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 8,
  },
  textWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textSecondary: {
    color: '#333',
    fontSize: 14,
    fontFamily: 'Inter',
    textAlign: 'right',
    flex: 1,
  },
  textInput: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
    textAlign: 'right',
    width: '100%',
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter',
  },
  ellipsis: {
    color: '#2E4FD1',
    fontSize: 14,
    fontFamily: 'Inter',
    marginLeft: 8,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
    alignSelf: 'flex-end',
  },
  toggleActive: {
    backgroundColor: '#4CAF50',
  },
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleButtonActive: {
    alignSelf: 'flex-end',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#C0C0C0',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    fontFamily: 'Inter',
  },
});