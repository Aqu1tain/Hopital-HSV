import React from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AppHeader from '../../components/AppHeader';

const Card = ({ title, details, actionText, onAction }) => (
  <View style={styles.card}>
    <View style={{ flex: 1 }}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDetails}>{details}</Text>
    </View>
    {actionText && (
      <TouchableOpacity style={styles.smallButton} onPress={onAction}>
        <Text style={styles.smallButtonText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default function HomeScreen() {
  const nextAppts = [
    { title: 'Dr. Rozières – Généraliste', details: 'Demain 9h – rue Boissonade' }
  ];
  const pastAppts = [
    { title: 'Martin Lanson – Ostéopathe', details: 'Lundi' },
    { title: 'Dr. Martinez – Cardiologue', details: 'Il y a 2 semaines' }
  ];
  const todayDocs = [
    {
      image: require('@/assets/images/elise.png'),
      name: 'Dr. Rozières',
      specialty: 'Médecin Généraliste',
      address: '14 rue Boissonade, 75014 Paris'
    },
    {
      image: require('@/assets/images/elise.png'),
      name: 'Dr. Haussman',
      specialty: 'Médecin Généraliste',
      address: '14 rue Boissonade, 75014 Paris'
    },
  ];

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.centered}>
          <Text style={styles.notice}>
            Vous n’avez pas de rendez-vous prévu aujourd’hui.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {}}
          >
            <Text style={styles.primaryButtonText}>
              Prendre un rendez-vous
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Vos prochains rendez-vous</Text>
        {nextAppts.map((r, i) => (
          <Card
            key={i}
            title={r.title}
            details={r.details}
            actionText="Programmer un rappel"
            onAction={() => {}}
          />
        ))}

        <Text style={styles.sectionTitle}>Vos derniers rendez-vous</Text>
        {pastAppts.map((r, i) => (
          <Card key={i} title={r.title} details={r.details} />
        ))}

        <Text style={styles.sectionTitle}>
          Praticiens disponibles aujourd’hui
        </Text>

        <View style={styles.pracList}>
          {todayDocs.map((d, i) => (
            <View key={i} style={styles.doctorCard}>
              <Image source={d.image} style={styles.doctorImage} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.cardTitle}>{d.name}</Text>
                <Text style={styles.doctorSpecialty}>{d.specialty}</Text>
                <Text style={styles.doctorAddress}>{d.address}</Text>
              </View>
            </View>
          ))}

          {/* overlay gradient */}
          <LinearGradient
            colors={['transparent', '#ffffff']}
            style={styles.gradientOverlay}
          />
          <View style={styles.overlayContent}>
            <TouchableOpacity
              onPress={() => router.replace('/practitioners')}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Voir plus</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },

  centered: { alignItems: 'center', marginVertical: 40 },
  notice: {
    fontSize: 14,        // comme avant
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
    color: '#000',
  },

  primaryButton: {
    backgroundColor: '#2E4FD1',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,        // comme avant
    fontWeight: '500',
  },

  sectionTitle: {
    fontSize: 16,        // comme avant
    fontWeight: '500',
    marginTop: 30,
    marginBottom: 10,
    color: '#000',
  },

  card: {

    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 17,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,        // comme avant
    fontWeight: '600',
    color: '#000',
  },
  cardDetails: {
    fontSize: 12,        // comme avant
    fontWeight: '400',
    color: '#444',
    marginTop: 4,
  },

  smallButton: {
    backgroundColor: '#2E4FD1E5',
    paddingHorizontal: 9,
    paddingVertical: 11,  // ajusté à 11 comme avant
    borderRadius: 8,
  },

  smallButtonText: {
    color: '#fff',
    fontSize: 14,        // comme avant
    fontWeight: '500',
  },
  pracList: {
    marginTop: 10,
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0  ,
    height: 200,
    zIndex: 1,
  },
  overlayContent: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },

  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  doctorImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  doctorSpecialty: {
    fontSize: 14,        // comme avant
    fontWeight: '500',
    color: '#444',
    marginTop: 2,
  },
  doctorAddress: {
    fontSize: 12,        // comme avant
    fontWeight: '400',
    color: '#777',
    marginTop: 2,
  },
});
