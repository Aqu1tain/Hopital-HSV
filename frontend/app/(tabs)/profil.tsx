import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import AppHeader from '../../components/AppHeader';
import React from 'react';

const Bandeau = () => {
  return <View style={styles.bandeau}></View>;
};

interface TextProps {
  textView: string;
  textSecondaryView: string;
}

const Texte: React.FC<TextProps> = ({ textView, textSecondaryView }) => {
  return (
    <View style={{ marginTop: 10, flexDirection: 'row' }}>
      <Text style={styles.text}>{textView}</Text>
      <Text style={styles.textSecondary}>{textSecondaryView}</Text>
    </View>
  );
};

export default function ProfilScreen() {
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
          <Text style={styles.titre}>Informations personnelles</Text>
          <Texte textView="Date de Naissance : " textSecondaryView="10 mars 2005" />
          <Texte textView="Poids : " textSecondaryView="83" />
          <Texte textView="Allergies : " textSecondaryView="Pollen, poussière, bouleau, poils de chat" />
          <Texte textView="Antécédents médicaux : " textSecondaryView="Fracture avant bras gauche" />
          <Texte textView="Sexe : " textSecondaryView="Homme" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 33,
    paddingTop: 10, // Add padding to avoid overlap with pseudo
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  titre: {
    color: '#000',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  text: {
    color: '#000',
    fontSize: 15,
    fontStyle: 'normal',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  textSecondary: {
    color: '#000',
    fontSize: 15,
    fontStyle: 'normal',
    fontFamily: 'Inter',
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
    alignItems: 'center', // Center image and pseudo horizontally
    marginTop: -60, // Pull image up to overlap bandeau
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