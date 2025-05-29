import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, TextInput } from 'react-native';
import AppHeader from '../../components/AppHeader';
import React, { useState } from 'react';
import { router } from 'expo-router';

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
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingSocialSecurity, setIsEditingSocialSecurity] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [personalData, setPersonalData] = useState({
    dateOfBirth: '10 mars 2005',
    weight: '83',
    allergies: 'Pollen, poussière, bouleau, poils de chat',
    medicalHistory: 'Fracture avant bras gauche',
    gender: 'Homme',
  });
  const [contactData, setContactData] = useState({
    phone: '06 12 34 56 78',
    email: 'valentin.lamouche@mail.com',
  });
  const [socialSecurityData, setSocialSecurityData] = useState({
    socialSecurityNumber: '1 05 05 75 123 456 78',
    healthInsuranceFund: 'CPAM Paris',
    mutualInsurance: 'MutuelleSanté+',
  });
  const [addressData, setAddressData] = useState({
    street: '12 Rue des Lilas',
    postalCode: '75001',
    city: 'Paris',
  });

  const handleEditPersonalToggle = () => {
    setIsEditingPersonal(!isEditingPersonal);
  };

  const handleEditContactToggle = () => {
    setIsEditingContact(!isEditingContact);
  };

  const handleEditSocialSecurityToggle = () => {
    setIsEditingSocialSecurity(!isEditingSocialSecurity);
  };

  const handleEditAddressToggle = () => {
    setIsEditingAddress(!isEditingAddress);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Bandeau />
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
              <Text style={styles.titre}>Informations personnelles</Text>
              {!isEditingPersonal && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditPersonalToggle}
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
              >
                <Text style={styles.penIcon}>✎</Text>
                <Text style={[styles.editText, styles.editTextActive]}>Enregistrer</Text>
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
              >
                <Text style={styles.penIcon}>✎</Text>
                <Text style={[styles.editText, styles.editTextActive]}>Enregistrer</Text>
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
              >
                <Text style={styles.penIcon}>✎</Text>
                <Text style={[styles.editText, styles.editTextActive]}>Enregistrer</Text>
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
              >
                <Text style={styles.penIcon}>✎</Text>
                <Text style={[styles.editText, styles.editTextActive]}>Enregistrer</Text>
              </TouchableOpacity>
            )}
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
});