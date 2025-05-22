import { Image, ScrollView, View, Text, StyleSheet, Button, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import AppHeader from '../../components/AppHeader';

type RDVBtn = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
};

type Card = {
  doctorName: string;
  details: string;
  onPress: (event: GestureResponderEvent) => void;
}

type CardNoButton = {
  doctorName: string;
  details: string;
}

type DoctorCardProps = {
  image: any; // peut être une URI ou require()
  name: string;
  specialty: string;
  address: string;
};

const RDVButton: React.FC<RDVBtn> = ({ title, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>

  );
};

const CardPrac: React.FC<Card> = ({ doctorName, details, onPress }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.divCard}>
          <Text style={styles.cardTitle}>{doctorName}</Text>
          <Text style={styles.subtitle}>{details}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <Text style={[styles.buttonText, { fontSize: 12 }]}>Programmer un rappel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DoctorInfoCard: React.FC<DoctorCardProps> = ({ image, name, specialty, address }) => {
  return (
    <View style={styles.doctorCard}>
      <Image source={image} style={styles.doctorImage} />
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{name}</Text>
        <Text style={styles.doctorSpecialty}>{specialty}</Text>
        <Text style={styles.doctorAddress}>{address}</Text>
      </View>
    </View>
  );
};

const CardPracNoButton: React.FC<CardNoButton> = ({ doctorName, details }) => {
  return (
    <View style={styles.card}>
      <View style={styles.divCard}>
        <Text style={styles.cardTitle}>{doctorName}</Text>
        <Text style={styles.subtitle}>{details}</Text>
      </View>
    </View>
  );
};

export default function HomeScreen() {

  return (
    <View style={styles.screen}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.firstContainer}>
          <Text style={[styles.typicalText, { lineHeight: 50, paddingBottom: 7 }]}>Vous n’avez pas de rendez-vous prévu aujourd’hui.</Text>
          <RDVButton
            title="Prendre un rendez vous"
            onPress={() => alert('Bouton appuyé')}
          />
        </View>
        <View style={[styles.header, { flexDirection: 'column' }]}>
          <Text style={[styles.typicalText, { alignSelf: 'flex-start' }]}>Vos prochains rendez-vous</Text>
          <CardPrac
            doctorName="Dr. Rozières - Généraliste"
            details="Demain 9h - rue boissonade"
            onPress={() => alert('Bouton appuyé')}
          />
          <Text style={[styles.typicalText, { alignSelf: 'flex-start', marginTop: 30 }]}>Vos derniers rendez-vous</Text>
          <CardPracNoButton
            doctorName="Martin Lanson - Ostéopathe"
            details="Lundi"
          />
          <CardPracNoButton
            doctorName="Dr. Martinez - Cardiologue"
            details="Il y a 2 semaines"
          />
          <Text style={[styles.typicalText, { alignSelf: 'flex-start', marginTop: 30 }]}>Praticiens disponibles aujourd'hui</Text>
          <View style={styles.blurContainer}>
            <DoctorInfoCard
              image={require('../../assets/images/elise.png')}
              name="Dr. Elise Renard"
              specialty="Dermatologue"
              address="32 rue de la Santé, Paris"
            />
            <DoctorInfoCard
              image={require('../../assets/images/elise.png')}
              name="Dr. Jean Dupont"
              specialty="Généraliste"
              address="12 rue Lafayette, Paris"
            />
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.9)', '#fff']}
              style={styles.gradientOverlay}
              pointerEvents="none"
            />
            <View style={styles.overlayContent}>
              <TouchableOpacity
                onPress={() => router.replace('/practitioners')}
                style={styles.overlayButton}
              >
                <Text style={styles.buttonText}>Voire plus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  blurContainer: {
    position: 'relative',
    marginTop: 10,
  },
  overlayContent: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -0.5 * 94 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4, 
  },

  overlayButton: {
    backgroundColor: '#2E4FD1E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    zIndex: 5,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60, // Ajuste selon ton besoin
    zIndex: 1,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  typicalText: {
    color: '#000',
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: 500,
    fontStyle: 'normal',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cardTitle: {
    color: 'black',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter',
    textAlign: 'left',
  },
  button: {
    marginLeft: 20, // espace entre le texte et le bouton
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E4FD1E5',
  },
  buttonText: {
    color: '#FFF',
    textAlign: 'right',
    fontFamily: 'Inter',
    fontSize: 15,
    fontStyle: 'normal',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16, // for safe area
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },
  headerTextContainer: {
    flexDirection: 'column',
  },
  headerGreeting: {
    fontSize: 16,
    color: '#444',
    fontFamily: 'Inter',
  },
  headerName: {
    fontSize: 18,
    color: '#222',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  bellIcon: {
    marginLeft: 16,
  },
  container: {
    alignItems: 'center',
  },
  firstContainer: {
    alignItems: 'center',
    marginTop: 98,
    marginBottom: 98,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: 'Inter',
  },
  divCard: {
    flex: 1, // occupe tout l’espace dispo à gauche
    paddingRight: 10,
    justifyContent: 'center',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  card: {
    height: 59,
    alignSelf: 'stretch',
    marginBottom: 17,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  subtitle: {
    color: 'black',
    fontSize: 8,
    fontFamily: 'Inter',
    fontWeight: '400',
    textAlign: 'center',
  },
  doctorCard: {
    width: 424,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  doctorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },

  doctorInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter',
    color: '#000',
  },

  doctorSpecialty: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter',
    color: '#444',
  },

  doctorAddress: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: 'Inter',
    color: '#777',
  },
});
