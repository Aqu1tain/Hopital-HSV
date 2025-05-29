import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import AppHeader from '../../components/AppHeader';
import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../auth-context';
import { useRouter } from 'expo-router';
import config from '../../config/config';

const Bandeau = () => {
  return (
    <View style={styles.bandeau}>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.replace('../settings')}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
};

interface TextProps {
  textView: string;
  textSecondaryView: string;
  onChangeText?: (text: string) => void;
  isEditing?: boolean;
}

const Texte: React.FC<TextProps> = ({ textView, textSecondaryView, onChangeText, isEditing }) => {
  const isMultilineField = textView === 'Allergies : ' || textView === 'Antécédents médicaux : ';
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
    <View style={styles.textContainer}>
      <Text style={styles.text}>{textView}</Text>
      <View style={styles.infoContainer}>
        {isEditing ? (
          <TextInput
            style={styles.textInput}
            value={textSecondaryView}
            onChangeText={onChangeText}
            multiline={isMultilineField}
            numberOfLines={isMultilineField ? undefined : 1}
            autoCapitalize="none"
          />
        ) : (
          <View style={styles.textWrapper}>
            <Text
              style={styles.textSecondary}
              numberOfLines={isExpanded ? undefined : 1}
              onTextLayout={handleTextLayout}
            >
              {textSecondaryView}
            </Text>
            {isTruncated && !isExpanded && (
              <TouchableOpacity onPress={toggleExpand}>
                <Text style={styles.ellipsis}>...</Text>
              </TouchableOpacity>
            )}
            {isExpanded && (
              <TouchableOpacity onPress={toggleExpand}>
                <Text style={styles.ellipsis}>Voir moins</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default function ProfilScreen() {
  const { logout, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingSocialSecurity, setIsEditingSocialSecurity] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  
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
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      
      // Set basic user data
      setUserData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        profile_url: data.profile_url || '',
      });

      // Set contact data
      setContactData({
        phone: data.phone || '',
        email: data.email || '',
      });

      // If user is a patient, set their profile data
      if (data.role === 'patient' && data.profile) {
        const profile = data.profile;
        
        // Format birth date
        const birthDate = profile.birth_date ? new Date(profile.birth_date) : null;
        const formattedBirthDate = birthDate ? birthDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : '';

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
      console.error('Error fetching user data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [token]);

  const updatePersonalData = async () => {
    try {
      setLoading(true);
      const genderMap: { [key: string]: string } = {
        'Homme': 'M',
        'Femme': 'F',
        'Autre': 'Other'
      };
      
      const updateData = {
        weight_kg: personalData.weight ? parseFloat(personalData.weight) : null,
        allergies: personalData.allergies ? personalData.allergies.split(',').map(a => a.trim()) : [],
        medical_history: personalData.medicalHistory,
        gender: genderMap[personalData.gender] || personalData.gender,
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
        throw new Error('Failed to update personal data');
      }

      setIsEditingPersonal(false);
    } catch (error) {
      console.error('Error updating personal data:', error);
      alert('Erreur lors de la mise à jour des données');
    } finally {
      setLoading(false);
    }
  };

  const updateContactData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/api/users/update`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: contactData.phone,
          email: contactData.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update contact data');
      }

      setIsEditingContact(false);
    } catch (error) {
      console.error('Error updating contact data:', error);
      alert('Erreur lors de la mise à jour des données');
    } finally {
      setLoading(false);
    }
  };

  const updateSocialSecurityData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/api/patients/update`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          social_security_number: socialSecurityData.socialSecurityNumber,
          health_insurance: socialSecurityData.healthInsuranceFund,
          coverage_mutuelle: socialSecurityData.mutualInsurance,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update social security data');
      }

      setIsEditingSocialSecurity(false);
    } catch (error) {
      console.error('Error updating social security data:', error);
      alert('Erreur lors de la mise à jour des données');
    } finally {
      setLoading(false);
    }
  };

  const updateAddressData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/api/patients/update`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          street_address: addressData.street,
          postal_code: addressData.postalCode,
          city: addressData.city,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update address data');
      }

      setIsEditingAddress(false);
    } catch (error) {
      console.error('Error updating address data:', error);
      alert('Erreur lors de la mise à jour des données');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPersonalToggle = () => {
    if (isEditingPersonal) {
      updatePersonalData();
    } else {
      setIsEditingPersonal(true);
    }
  };

  const handleEditContactToggle = () => {
    if (isEditingContact) {
      updateContactData();
    } else {
      setIsEditingContact(true);
    }
  };

  const handleEditSocialSecurityToggle = () => {
    if (isEditingSocialSecurity) {
      updateSocialSecurityData();
    } else {
      setIsEditingSocialSecurity(true);
    }
  };

  const handleEditAddressToggle = () => {
    if (isEditingAddress) {
      updateAddressData();
    } else {
      setIsEditingAddress(true);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch(`${config.API_URL}/auth/logout`, { method: 'POST' });
    } catch {}
    logout();
    router.replace('/auth');
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
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
          />
          <Text style={styles.pseudo}>
            {dataLoading ? 'Chargement...' : `${userData.first_name} ${userData.last_name}`}
          </Text>
        </View>
        
        {dataLoading ? (
          <View style={styles.container}>
            <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 50 }} />
          </View>
        ) : (
          <View style={styles.container}>
            <View style={styles.section}>
              <View style={styles.headerContainer}>
                <Text style={styles.titre}>Informations personnelles</Text>
                {!isEditingPersonal && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEditPersonalToggle}
                    disabled={loading}
                  >
                    <Text style={styles.penIcon}>✎</Text>
                    <Text style={styles.editText}>Modifier</Text>
                  </TouchableOpacity>
                )}
              </View>
              {[
                { textView: 'Date de Naissance : ', value: personalData.dateOfBirth, onChange: (text: string) => setPersonalData({ ...personalData, dateOfBirth: text }) },
                { textView: 'Poids : ', value: personalData.weight, onChange: (text: string) => setPersonalData({ ...personalData, weight: text }) },
                { textView: 'Allergies : ', value: personalData.allergies, onChange: (text: string) => setPersonalData({ ...personalData, allergies: text }) },
                { textView: 'Antécédents médicaux : ', value: personalData.medicalHistory, onChange: (text: string) => setPersonalData({ ...personalData, medicalHistory: text }) },
                { textView: 'Sexe : ', value: personalData.gender, onChange: (text: string) => setPersonalData({ ...personalData, gender: text }) },
              ].map((item, index) => (
                <Texte
                  key={index}
                  textView={item.textView}
                  textSecondaryView={item.value}
                  isEditing={isEditingPersonal}
                  onChangeText={item.onChange}
                />
              ))}
              {isEditingPersonal && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditPersonalToggle}
                  disabled={loading}
                >
                  <Text style={styles.penIcon}>✎</Text>
                  <Text style={[styles.editText, styles.editTextActive]}>
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.sectionSeparator} />
            <View style={styles.section}>
              <View style={styles.headerContainer}>
                <Text style={styles.titre}>Informations de Contact</Text>
                {!isEditingContact && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEditContactToggle}
                    disabled={loading}
                  >
                    <Text style={styles.penIcon}>✎</Text>
                    <Text style={styles.editText}>Modifier</Text>
                  </TouchableOpacity>
                )}
              </View>
              {[
                { textView: 'Téléphone : ', value: contactData.phone, onChange: (text: string) => setContactData({ ...contactData, phone: text }) },
                { textView: 'Mail : ', value: contactData.email, onChange: (text: string) => setContactData({ ...contactData, email: text }) },
              ].map((item, index) => (
                <Texte
                  key={index}
                  textView={item.textView}
                  textSecondaryView={item.value}
                  isEditing={isEditingContact}
                  onChangeText={item.onChange}
                />
              ))}
              {isEditingContact && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditContactToggle}
                  disabled={loading}
                >
                  <Text style={styles.penIcon}>✎</Text>
                  <Text style={[styles.editText, styles.editTextActive]}>
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.sectionSeparator} />
            <View style={styles.section}>
              <View style={styles.headerContainer}>
                <Text style={styles.titre}>Sécurité Sociale</Text>
                {!isEditingSocialSecurity && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEditSocialSecurityToggle}
                    disabled={loading}
                  >
                    <Text style={styles.penIcon}>✎</Text>
                    <Text style={styles.editText}>Modifier</Text>
                  </TouchableOpacity>
                )}
              </View>
              {[
                { textView: 'Numéro de sécurité sociale : ', value: socialSecurityData.socialSecurityNumber, onChange: (text: string) => setSocialSecurityData({ ...socialSecurityData, socialSecurityNumber: text }) },
                { textView: 'Caisse d\'assurance maladie : ', value: socialSecurityData.healthInsuranceFund, onChange: (text: string) => setSocialSecurityData({ ...socialSecurityData, healthInsuranceFund: text }) },
                { textView: 'Mutuelle : ', value: socialSecurityData.mutualInsurance, onChange: (text: string) => setSocialSecurityData({ ...socialSecurityData, mutualInsurance: text }) },
              ].map((item, index) => (
                <Texte
                  key={index}
                  textView={item.textView}
                  textSecondaryView={item.value}
                  isEditing={isEditingSocialSecurity}
                  onChangeText={item.onChange}
                />
              ))}
              {isEditingSocialSecurity && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditSocialSecurityToggle}
                  disabled={loading}
                >
                  <Text style={styles.penIcon}>✎</Text>
                  <Text style={[styles.editText, styles.editTextActive]}>
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.sectionSeparator} />
            <View style={styles.section}>
              <View style={styles.headerContainer}>
                <Text style={styles.titre}>Adresse</Text>
                {!isEditingAddress && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEditAddressToggle}
                    disabled={loading}
                  >
                    <Text style={styles.penIcon}>✎</Text>
                    <Text style={styles.editText}>Modifier</Text>
                  </TouchableOpacity>
                )}
              </View>
              {[
                { textView: 'Rue : ', value: addressData.street, onChange: (text: string) => setAddressData({ ...addressData, street: text }) },
                { textView: 'Code postal : ', value: addressData.postalCode, onChange: (text: string) => setAddressData({ ...addressData, postalCode: text }) },
                { textView: 'Ville : ', value: addressData.city, onChange: (text: string) => setAddressData({ ...addressData, city: text }) },
              ].map((item, index) => (
                <Texte
                  key={index}
                  textView={item.textView}
                  textSecondaryView={item.value}
                  isEditing={isEditingAddress}
                  onChangeText={item.onChange}
                />
              ))}
              {isEditingAddress && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditAddressToggle}
                  disabled={loading}
                >
                  <Text style={styles.penIcon}>✎</Text>
                  <Text style={[styles.editText, styles.editTextActive]}>
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Logout section */}
            <View style={styles.sectionSeparator} />
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                disabled={loading}
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

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    paddingLeft: 33,
    paddingRight: 33,
    paddingTop: 10,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titre: {
    color: '#000',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  penIcon: {
    color: '#007BFF',
    fontSize: 15,
    marginRight: 4,
  },
  editText: {
    color: '#007BFF',
    fontSize: 15,
    fontStyle: 'normal',
    fontWeight: '600',
    fontFamily: 'Inter',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editTextActive: {
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingBottom: 6,
  },
  text: {
    color: '#000',
    fontSize: 15,
    fontStyle: 'normal',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  infoContainer: {
    width: 100,
    marginRight: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textSecondary: {
    color: '#000',
    fontSize: 15,
    fontStyle: 'normal',
    fontFamily: 'Inter',
    textAlign: 'right',
    flex: 1,
  },
  textInput: {
    color: '#000',
    fontSize: 15,
    fontStyle: 'normal',
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: '#007BFF',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#F8F9FA',
    textAlign: 'right',
    width: '100%',
  },
  ellipsis: {
    color: '#007BFF',
    fontSize: 15,
    fontStyle: 'normal',
    fontFamily: 'Inter',
    marginLeft: 4,
  },
  sectionSeparator: {
    height: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 18,
    color: '#444',
    fontFamily: 'Inter',
  },
  bandeau: {
    height: 177,
    width: '100%',
    backgroundColor: '#007BFF',
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
  settingsIcon: {
    color: '#FFFFFF',
    fontSize: 28,
  },
  imageWrapper: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 20,
  },
  pseudo: {
    marginTop: 10,
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: '600',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});