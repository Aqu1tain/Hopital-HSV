import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppHeader from '@/components/AppHeader';

export default function PlanningScreen() {
  return (
    <View style={styles.container}>
      <AppHeader />
      <Text style={styles.title}>Mon planning</Text>
      <Text style={styles.subtitle}>
        Ici s’affichera votre planning de rendez-vous.
      </Text>
      {/* Tu ajoutes ici ton agenda, liste des créneaux, etc. */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E4FD1',
    marginTop: 10,
    marginBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,

  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    paddingLeft: 10,
    paddingRight: 10,
  },
});
