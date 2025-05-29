import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, TextInput, ActivityIndicator, Platform, Alert } from 'react-native';
import AppHeader from '../../components/AppHeader';
import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../auth-context';
import config from '../../config/config';

const { width } = Dimensions.get('window');

const Bandeau = () => {
  return (
    <View style={styles.bandeau}>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.replace('../settings')}
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
            autoCapitalize={label === 'Mail : ' ? 'none' : 'sentences'}
            keyboardType={label === 'Téléphone : ' ? 'phone-pad' : label === 'Mail : ' ? 'email-address' : 'default'}
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

export default function ProfilScreen() {
  const { logout, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    profile_url: '',
  });

  const [personalData, setPersonalData] = useState({
    dateOfBirth: '',
    weight: '',
    allergies: '',
    medicalHistory: '',
    gender: '',
  });

  const [contactData, setContactData] = useState({
    phone: '',
    email: '',
  });

  const [socialSecurityData, setSocialSecurityData] = useState({
    socialSecurityNumber: '',
    healthInsuranceFund: '',
    mutualInsurance: '',
  });

  const [addressData, setAddressData] = useState({
    street: '',
    postalCode: '',
    city: '',
  });

  const validateFields = () => {
    const newErrors: { [key: string]: string } = {};

    // Validate email
    if (isEditing && contactData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
      newErrors.email = 'Adresse e-mail invalide';
    }

    // Validate phone
    if (isEditing && contactData.phone && !/^\+?\d{10,}$/.test(contactData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    // Validate date of birth
    if (isEditing && personalData.dateOfBirth) {
      const dateParts = personalData.dateOfBirth.split(' ');
      if (dateParts.length !== 3 || !/^\d{1,2}\s[a-zA-Zéû]+\s\d{4}$/.test(personalData.dateOfBirth)) {
        newErrors.dateOfBirth = 'Format de date invalide (ex: 12 janvier 2025)';
      }
    }

    // Validate weight
    if (isEditing && personalData.weight && !/^\d+(\.\d+)?$/.test(personalData.weight)) {
      newErrors.weight = 'Poids invalide (ex: 70.5)';
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

      setContactData({
        phone: data.phone || '',
        email: data.email || '',
      });

      if (data.role === 'patient' && data.profile) {
        const profile = data.profile;
        const birthDate = profile.birth_date ? new Date(profile.birth_date) : null;
        const formattedBirthDate = birthDate
          ? birthDate.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : '';

        setPersonalData({
          dateOfBirth: formattedBirthDate,
          weight: profile.weight_kg ? profile.weight_kg.toString() : '',
          allergies: profile.allergies ? profile.allergies.join(', ') : '',
          medicalHistory: profile.medical_history || '',
          gender: profile.gender === 'M' ? 'Homme' : profile.gender === 'F' ? 'Femme' : profile.gender || '',
        });

        setSocialSecurityData({
          socialSecurityNumber: profile.social_security_number || '',
          healthInsuranceFund: profile.health_insurance || '',
          mutualInsurance: profile.coverage_mutuelle || '',
        });

        setAddressData({
          street: profile.street_address || '',
          postalCode: profile.postal_code || '',
          city: profile.city || '',
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
      const genderMap: { [key: string]: string } = {
        Homme: 'M',
        Femme: 'F',
        Autre: 'Other',
      };

      let birthDateISO = null;
      if (personalData.dateOfBirth) {
        const months: { [key: string]: string } = {
          janvier: '01',
          février: '02',
          mars: '03',
          avril: '04',
          mai: '05',
          juin: '06',
          juillet: '07',
          août: '08',
          septembre: '09',
          octobre: '10',
          novembre: '11',
          décembre: '12',
        };
        const dateParts = personalData.dateOfBirth.split(' ');
        if (dateParts.length === 3) {
          const day = dateParts[0].padStart(2, '0');
          const month = months[dateParts[1].toLowerCase()];
          const year = dateParts[2];
          if (day && month && year) {
            birthDateISO = `${year}-${month}-${day}`;
            const parsedDate = new Date(birthDateISO);
            if (isNaN(parsedDate.getTime())) {
              throw new Error('Format de date invalide');
            }
          }
        }
      }

      const updateData = {
        phone: contactData.phone,
        email: contactData.email,
        birth_date: birthDateISO,
        weight_kg: personalData.weight ? parseFloat(personalData.weight) : null,
        allergies: personalData.allergies ? personalData.allergies.split(',').map(a => a.trim()) : [],
        medical_history: personalData.medicalHistory,
        gender: genderMap[personalData.gender] || personalData.gender,
        social_security_number: socialSecurityData.socialSecurityNumber,
        health_insurance: socialSecurityData.healthInsuranceFund,
        coverage_mutuelle: socialSecurityData.mutualInsurance,
        street_address: addressData.street,
        postal_code: addressData.postalCode,
        city: addressData.city,
      };

      const response = await fetch(`${config.API_URL}/api/patients/update`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Échec de la mise à jour des données');
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
            {dataLoading ? 'Chargement...' : `${userData.first_name} ${userData.last_name}`}
          </Text>
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

            {/* Personal Information */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Informations personnelles</Text>
              {[
                { label: 'Date de Naissance : ', value: personalData.dateOfBirth, onChange: (text: string) => setPersonalData({ ...personalData, dateOfBirth: text }), error: errors.dateOfBirth },
                { label: 'Poids : ', value: personalData.weight, onChange: (text: string) => setPersonalData({ ...personalData, weight: text }), error: errors.weight },
                { label: 'Allergies : ', value: personalData.allergies, onChange: (text: string) => setPersonalData({ ...personalData, allergies: text }), multiline: true },
                { label: 'Antécédents médicaux : ', value: personalData.medicalHistory, onChange: (text: string) => setPersonalData({ ...personalData, medicalHistory: text }), multiline: true },
                { label: 'Sexe : ', value: personalData.gender, onChange: (text: string) => setPersonalData({ ...personalData, gender: text }) },
              ].map((item, index) => (
                <Texte
                  key={index}
                  label={item.label}
                  value={item.value}
                  isEditing={isEditing}
                  onChangeText={item.onChange}
                  multiline={item.multiline}
                  error={item.error}
                />
              ))}
            </View>

            {/* Contact Information */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Informations de contact</Text>
              {[
                { label: 'Téléphone : ', value: contactData.phone, onChange: (text: string) => setContactData({ ...contactData, phone: text }), error: errors.phone },
                { label: 'Mail : ', value: contactData.email, onChange: (text: string) => setContactData({ ...contactData, email: text }), error: errors.email },
              ].map((item, index) => (
                <Texte
                  key={index}
                  label={item.label}
                  value={item.value}
                  isEditing={isEditing}
                  onChangeText={item.onChange}
                  error={item.error}
                />
              ))}
            </View>

            {/* Social Security */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sécurité sociale</Text>
              {[
                { label: 'Numéro de sécurité sociale : ', value: socialSecurityData.socialSecurityNumber, onChange: (text: string) => setSocialSecurityData({ ...socialSecurityData, socialSecurityNumber: text }) },
                { label: 'Caisse d\'assurance maladie : ', value: socialSecurityData.healthInsuranceFund, onChange: (text: string) => setSocialSecurityData({ ...socialSecurityData, healthInsuranceFund: text }) },
                { label: 'Mutuelle : ', value: socialSecurityData.mutualInsurance, onChange: (text: string) => setSocialSecurityData({ ...socialSecurityData, mutualInsurance: text }) },
              ].map((item, index) => (
                <Texte
                  key={index}
                  label={item.label}
                  value={item.value}
                  isEditing={isEditing}
                  onChangeText={item.onChange}
                />
              ))}
            </View>

            {/* Address */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Adresse</Text>
              {[
                { label: 'Rue : ', value: addressData.street, onChange: (text: string) => setAddressData({ ...addressData, street: text }) },
                { label: 'Code postal : ', value: addressData.postalCode, onChange: (text: string) => setAddressData({ ...addressData, postalCode: text }) },
                { label: 'Ville : ', value: addressData.city, onChange: (text: string) => setAddressData({ ...addressData, city: text }) },
              ].map((item, index) => (
                <Texte
                  key={index}
                  label={item.label}
                  value={item.value}
                  isEditing={isEditing}
                  onChangeText={item.onChange}
                />
              ))}
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
    color: '#FFFFFF',
    fontSize: 24,
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
  settingsIcon: {
    width: 28,
    height: 28,
    tintColor: '#FFFFFF',
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