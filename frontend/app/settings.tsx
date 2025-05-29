import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, TextInput, Switch } from 'react-native';
import React, { useState } from 'react';

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
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accountData, setAccountData] = useState({
    email: 'valentin.lamouche@mail.com',
    password: '',
    confirmPassword: '',
  });
  const [privacyData, setPrivacyData] = useState({
    dataSharing: true,
    twoFactorAuth: false,
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validateFields = () => {
    let isValid = true;
    const newErrors = { email: '', password: '', confirmPassword: '' };

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(accountData.email)) {
      newErrors.email = 'Email invalide';
      isValid = false;
    }

    // Password validation
    if (accountData.password.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
      isValid = false;
    }
    if (accountData.password !== accountData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleEditAccountToggle = () => {
    if (isEditingAccount && validateFields()) {
      // Save data (e.g., to backend or AsyncStorage)
      setIsEditingAccount(false);
    } else if (!isEditingAccount) {
      setIsEditingAccount(true);
    }
  };

  const handleSwitchToggle = (key: keyof typeof privacyData) => {
    setPrivacyData({ ...privacyData, [key]: !privacyData[key] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.imageWrapper}>
          <Image
            source={require('@/assets/images/pdp.png')}
            style={styles.image}
          />
          <Text style={styles.pseudo}>Valentin LAMOUCHE</Text>
        </View>
        <View style={styles.container}>
          <View style={styles.section}>
            <View style={styles.headerContainer}>
              <Text style={styles.titre}>Compte</Text>
              {!isEditingAccount && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditAccountToggle}
                >
                  <Text style={styles.penIcon}>✎</Text>
                  <Text style={styles.editText}>Modifier</Text>
                </TouchableOpacity>
              )}
            </View>
            {[
              {
                textView: 'Email : ',
                value: accountData.email,
                onChange: (text: string) => setAccountData({ ...accountData, email: text }),
                error: errors.email,
              },
              {
                textView: 'Mot de passe : ',
                value: accountData.password,
                onChange: (text: string) => setAccountData({ ...accountData, password: text }),
                error: errors.password,
              },
              {
                textView: 'Confirmer mot de passe : ',
                value: accountData.confirmPassword,
                onChange: (text: string) => setAccountData({ ...accountData, confirmPassword: text }),
                error: errors.confirmPassword,
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
            {isEditingAccount && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditAccountToggle}
              >
                <Text style={styles.penIcon}>✎</Text>
                <Text style={[styles.editText, styles.editTextActive]}>Enregistrer</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.sectionSeparator} />
          <View style={styles.section}>
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
              {
                textView: 'Authentification à deux facteurs : ',
                value: privacyData.twoFactorAuth ? 'Activé' : 'Désactivé',
                switchValue: privacyData.twoFactorAuth,
                onSwitch: () => handleSwitchToggle('twoFactorAuth'),
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
    width: width * 0.5, // Fixed width for consistent label alignment
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'column', // Changed to column to stack TextInput and error text
    alignItems: 'flex-end', // Align content to the right
  },
  textWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 140, // Consistent width for alignment
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
    minWidth: 140, // Match textWrapper minWidth for alignment
    width: '100%', // Ensure it takes available space
  },
  textInputError: {
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    fontFamily: 'Inter',
    textAlign: 'right',
    marginTop: 4, // Position closer to the input
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
});