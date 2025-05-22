import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue sur l'application !</Text>
      <Button title="Entrer" onPress={() => navigation.replace('Home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  title: {
    fontSize: 24, fontWeight: 'bold', marginBottom: 20,
  },
});