import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, TextInput, Switch, ActivityIndicator, Alert, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import config from '../config/config';

interface TextProps {
  textView: string;
  textSecondaryView: string;
  onChangeText?: (text: string) => void;
  isEditing?: boolean;
  error?: string;
}

const Texte: React.FC<TextProps> = ({ textView, textSecondaryView, onChangeText, isEditing, error }) => {
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
          <>
            <TextInput
              style={[styles.textInput, error && styles.textInputError]}
              value={textSecondaryView}
              onChangeText={onChangeText}
              autoCapitalize="none"
              secureTextEntry={textView.includes('Mot de passe') || textView.includes('Confirmer')}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </>
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

export default function SettingsScreen() {
  const { token } = useAuth();
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState({
    email: '',
    first_name: '',
    last_name: '',
  });
  const [privacyData, setPrivacyData] = useState({
    dataSharing: true,
  });
  const [errors, setErrors] = useState({
    email: '',
  });

  // Fetch user data from the /me endpoint
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
      setAccountData({
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
      });
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

  const validateFields = () => {
    let isValid = true;
    const newErrors = { email: '' };

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(accountData.email)) {
      newErrors.email = 'Email invalide';
      isValid = false;
    }

    if (isEditingAccount && accountData.email) {
      if (accountData.email.length < 8) {
        newErrors.email = 'Minimum 8 caractères';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const updateAccountData = async () => {
    if (!validateFields()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans les champs avant de sauvegarder');
      return;
    }

    try {
      setLoading(true);
      const updateData: { email?: string } = {};
      if (accountData.email) updateData.email = accountData.email;

      // Update user data via /api/users/update
      if (updateData.email) {
        const response = await fetch(`${config.API_URL}/api/users/update`, {
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
      }

      await fetchUserData(); // Refresh data after update
      setIsEditingAccount(false);
      Alert.alert('Succès', 'Vos informations ont été mises à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour les données');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAccountToggle = () => {
    if (isEditingAccount) {
      updateAccountData();
    } else {
      setIsEditingAccount(true);
    }
  };

  const handleSwitchToggle = (key: keyof typeof privacyData) => {
    setPrivacyData({ ...privacyData, [key]: !privacyData[key] });
    // Note: If privacy settings need to be persisted, add an API call here.
    // Currently, the schema doesn't include these fields, so they remain local.
  };

  if (dataLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.imageWrapper}>
          <Image
            source={
              accountData.profile_url && accountData.profile_url !== 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/340px-Default_pfp.svg.png'
                ? { uri: accountData.profile_url }
                : require('@/assets/images/pdp.png')
            }
            style={styles.image}
          />
          <Text style={styles.pseudo}>
            {accountData.first_name && accountData.last_name
              ? `${accountData.first_name} ${accountData.last_name}`
              : 'Utilisateur'}
          </Text>
        </View>
        <View style={styles.container}>
          <View style={styles.section}>
            <View style={styles.headerContainer}>
              <Text style={styles.titre}>Compte</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditAccountToggle}
                disabled={loading}
              >
                <Text style={styles.penIcon}>✎</Text>
                <Text style={[styles.editText, isEditingAccount && styles.editTextActive]}>
                  {loading ? 'Enregistrement...' : isEditingAccount ? 'Enregistrer' : 'Modifier'}
                </Text>
              </TouchableOpacity>
            </View>
            {[
              {
                textView: 'Email : ',
                value: accountData.email,
                onChange: (text: string) => setAccountData({ ...accountData, email: text }),
                error: errors.email,
              },
            ].map((item, index) => (
              <Texte
                key={index}
                textView={item.textView}
                textSecondaryView={item.value}
                isEditing={isEditingAccount}
                onChangeText={item.onChange}
                error={item.error}
              />
            ))}
          </View>
          <View style={styles.sectionSeparator} />
          <View style={[styles.section, { display: 'none' }]}>
            <View style={styles.headerContainer}>
              <Text style={styles.titre}>Confidentialité et Sécurité</Text>
            </View>
            {[
              {
                textView: 'Partage de données : ',
                value: privacyData.dataSharing ? 'Activé' : 'Désactivé',
                switchValue: privacyData.dataSharing,
                onSwitch: () => handleSwitchToggle('dataSharing'),
              },
            ].map((item, index) => (
              <View key={index} style={styles.textContainer}>
                <Text style={styles.text}>{item.textView}</Text>
                <View style={styles.infoContainer}>
                  <View style={styles.textWrapper}>
                    <Text style={styles.textSecondary}>{item.value}</Text>
                    <Switch
                      value={item.switchValue}
                      onValueChange={item.onSwitch}
                      trackColor={{ false: '#767577', true: '#007BFF' }}
                      thumbColor={item.switchValue ? '#007BFF' : '#f4f3f4'}
                      ios_backgroundColor="#007BFF"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
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
    width: width * 0.5,
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  textWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 140,
  },
  textSecondary: {
    color: '#000',
    fontSize: 15,
    fontStyle: 'normal',
    fontFamily: 'Inter',
    textAlign: 'right',
    marginRight: 12,
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
    backgroundColor: 'transparent',
    textAlign: 'right',
    minWidth: 140,
    width: '100%',
  },
  textInputError: {
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    fontFamily: 'Inter',
    textAlign: 'right',
    marginTop: 4,
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
  imageWrapper: {
    alignItems: 'center',
    marginTop: 20,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
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