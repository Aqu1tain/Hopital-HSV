import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, TextInput } from 'react-native';
import AppHeader from '../../components/AppHeader';
import React, { useState } from 'react';

const Bandeau = () => {
  return <View style={styles.bandeau}></View>;
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
          <View style={styles.headerContainer}>
            <Text style={styles.titre}>Informations personnelles</Text>
            <TouchableOpacity onPress={handleEditPersonalToggle}>
              <Text style={[styles.editText, isEditingPersonal && styles.editTextActive]}>
                {isEditingPersonal ? 'Enregistrer' : 'Modifier'}
              </Text>
            </TouchableOpacity>
          </View>
          <Texte
            textView="Date de Naissance : "
            textSecondaryView={personalData.dateOfBirth}
            isEditing={isEditingPersonal}
            onChangeText={(text) => setPersonalData({ ...personalData, dateOfBirth: text })}
          />
          <Texte
            textView="Poids : "
            textSecondaryView={personalData.weight}
            isEditing={isEditingPersonal}
            onChangeText={(text) => setPersonalData({ ...personalData, weight: text })}
          />
          <Texte
            textView="Allergies : "
            textSecondaryView={personalData.allergies}
            isEditing={isEditingPersonal}
            onChangeText={(text) => setPersonalData({ ...personalData, allergies: text })}
          />
          <Texte
            textView="Antécédents médicaux : "
            textSecondaryView={personalData.medicalHistory}
            isEditing={isEditingPersonal}
            onChangeText={(text) => setPersonalData({ ...personalData, medicalHistory: text })}
          />
          <Texte
            textView="Sexe : "
            textSecondaryView={personalData.gender}
            isEditing={isEditingPersonal}
            onChangeText={(text) => setPersonalData({ ...personalData, gender: text })}
          />
          <View style={styles.sectionSeparator} />
          <View style={styles.headerContainer}>
            <Text style={styles.titre}>Informations de Contact</Text>
            <TouchableOpacity onPress={handleEditContactToggle}>
              <Text style={[styles.editText, isEditingContact && styles.editTextActive]}>
                {isEditingContact ? 'Enregistrer' : 'Modifier'}
              </Text>
            </TouchableOpacity>
          </View>
          <Texte
            textView="Téléphone : "
            textSecondaryView={contactData.phone}
            isEditing={isEditingContact}
            onChangeText={(text) => setContactData({ ...contactData, phone: text })}
          />
          <Texte
            textView="Mail : "
            textSecondaryView={contactData.email}
            isEditing={isEditingContact}
            onChangeText={(text) => setContactData({ ...contactData, email: text })}
          />
          <View style={styles.sectionSeparator} />
          <View style={styles.headerContainer}>
            <Text style={styles.titre}>Sécurité Sociale</Text>
            <TouchableOpacity onPress={handleEditSocialSecurityToggle}>
              <Text style={[styles.editText, isEditingSocialSecurity && styles.editTextActive]}>
                {isEditingSocialSecurity ? 'Enregistrer' : 'Modifier'}
              </Text>
            </TouchableOpacity>
          </View>
          <Texte
            textView="Numéro de sécurité sociale : "
            textSecondaryView={socialSecurityData.socialSecurityNumber}
            isEditing={isEditingSocialSecurity}
            onChangeText={(text) => setSocialSecurityData({ ...socialSecurityData, socialSecurityNumber: text })}
          />
          <Texte
            textView="Caisse d'assurance maladie : "
            textSecondaryView={socialSecurityData.healthInsuranceFund}
            isEditing={isEditingSocialSecurity}
            onChangeText={(text) => setSocialSecurityData({ ...socialSecurityData, healthInsuranceFund: text })}
          />
          <Texte
            textView="Mutuelle : "
            textSecondaryView={socialSecurityData.mutualInsurance}
            isEditing={isEditingSocialSecurity}
            onChangeText={(text) => setSocialSecurityData({ ...socialSecurityData, mutualInsurance: text })}
          />
          <View style={styles.sectionSeparator} />
          <View style={styles.headerContainer}>
            <Text style={styles.titre}>Adresse</Text>
            <TouchableOpacity onPress={handleEditAddressToggle}>
              <Text style={[styles.editText, isEditingAddress && styles.editTextActive]}>
                {isEditingAddress ? 'Enregistrer' : 'Modifier'}
              </Text>
            </TouchableOpacity>
          </View>
          <Texte
            textView="Rue : "
            textSecondaryView={addressData.street}
            isEditing={isEditingAddress}
            onChangeText={(text) => setAddressData({ ...addressData, street: text })}
          />
          <Texte
            textView="Code postal : "
            textSecondaryView={addressData.postalCode}
            isEditing={isEditingAddress}
            onChangeText={(text) => setAddressData({ ...addressData, postalCode: text })}
          />
          <Texte
            textView="Ville : "
            textSecondaryView={addressData.city}
            isEditing={isEditingAddress}
            onChangeText={(text) => setAddressData({ ...addressData, city: text })}
          />
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
    color: '#28A745', // Green color for "Enregistrer"
    textDecorationLine: 'underline',
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  text: {
    color: '#000',
    fontSize: 15,
    fontStyle: 'normal',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  infoContainer: {
    width: 150, // Fixed width for information fields
    marginRight: 10, // Space from the right edge
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
    height: 20,
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
  },
  imageWrapper: {
    alignItems: 'center',
    marginTop: -60,
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